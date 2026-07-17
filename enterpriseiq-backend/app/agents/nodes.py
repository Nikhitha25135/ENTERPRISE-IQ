"""
Agent node implementations.

Each `make_*_node(db)` factory returns an async node function closing over
the Mongo handle — this keeps the (non-serializable) db connection out of
GraphState entirely, while still letting every node run real queries.

Five nodes for the MVP, matching the pipeline doc:
  Planner -> (Retrieval | Summary) -> Response -> Verification -> (retry | end)
"""
import logging
import re

from app.agents.llm import chat_completion
from app.agents.state import GraphState
from app.core.config import get_settings
from app.vectorstore.retriever import hybrid_search

logger = logging.getLogger(__name__)
settings = get_settings()

_SUMMARY_KEYWORDS = ("summarize", "summarise", "summary", "overview", "tl;dr", "give me a rundown")


def make_planner_node(db):
    async def planner_node(state: GraphState) -> dict:
        query_lower = state["query"].lower()
        intent = "summary" if any(kw in query_lower for kw in _SUMMARY_KEYWORDS) else "qa"
        return {"intent": intent, "retry_count": 0}

    return planner_node


def make_retrieval_node(db):
    async def retrieval_node(state: GraphState) -> dict:
        query = state["query"]
        retry_note = state.get("retry_note", "")
        if retry_note:
            # Verification failed last round — broaden the search instead of
            # repeating the exact same query.
            query = f"{query} {retry_note}"

        # Summary intent targeting a specific document pulls more chunks so
        # the Summary Agent has enough of the document to work with.
        top_k = settings.final_top_k * 3 if state.get("intent") == "summary" and state.get("doc_id") else None

        chunks = await hybrid_search(
            db,
            query=query,
            owner_id=state["owner_id"],
            workspace_id=state.get("workspace_id"),
            doc_id=state.get("doc_id"),
            top_k=top_k,
        )
        return {"chunks": chunks}

    return retrieval_node


def _format_context(chunks: list[dict]) -> str:
    blocks = []
    for c in chunks:
        location = f"p.{c['page']}" if c.get("page") else c.get("category", "")
        blocks.append(f"[chunk:{c['chunk_id']}] (source: {c['file_name']} {location})\n{c['text']}")
    return "\n\n---\n\n".join(blocks)


def make_summary_node(db):
    async def summary_node(state: GraphState) -> dict:
        if not state.get("chunks"):
            return {"answer": "I couldn't find any indexed content for this document to summarize.", "cited_chunk_ids": []}

        context = _format_context(state["chunks"])
        messages = [
            {
                "role": "system",
                "content": (
                    "You are the Summary Agent for an enterprise knowledge platform. "
                    "Summarize ONLY the information present in the provided context blocks. "
                    "Every factual sentence must end with the chunk tag(s) it came from, "
                    "e.g. [chunk:abc123]. Do not invent information not present in the context."
                ),
            },
            {"role": "user", "content": f"Context:\n\n{context}\n\nProduce a concise executive summary."},
        ]
        answer = chat_completion(messages)
        cited = re.findall(r"\[chunk:([a-f0-9]+)\]", answer)
        return {"answer": answer, "cited_chunk_ids": list(set(cited))}

    return summary_node


def make_response_node(db):
    async def response_node(state: GraphState) -> dict:
        if not state.get("chunks"):
            return {
                "answer": "I don't have any relevant indexed content to answer that from your documents.",
                "cited_chunk_ids": [],
            }

        context = _format_context(state["chunks"])
        messages = [
            {
                "role": "system",
                "content": (
                    "You are the Response Agent for an enterprise knowledge platform. "
                    "Answer the user's question using ONLY the provided context blocks. "
                    "Every claim must end with the chunk tag(s) that support it, e.g. [chunk:abc123]. "
                    "If the context does not contain the answer, say so plainly instead of guessing."
                ),
            },
            {"role": "user", "content": f"Context:\n\n{context}\n\nQuestion: {state['query']}"},
        ]
        answer = chat_completion(messages)
        cited = re.findall(r"\[chunk:([a-f0-9]+)\]", answer)
        return {"answer": answer, "cited_chunk_ids": list(set(cited))}

    return response_node


def make_verification_node(db):
    async def verification_node(state: GraphState) -> dict:
        retrieved_ids = {c["chunk_id"] for c in state.get("chunks", [])}
        cited_ids = set(state.get("cited_chunk_ids", []))

        unsupported = [cid for cid in cited_ids if cid not in retrieved_ids]
        # An answer with zero citations on a non-fallback response is also
        # treated as unverified — it means the model didn't ground its claims.
        no_citations = len(cited_ids) == 0 and "don't have any relevant" not in state.get("answer", "")

        verified = not unsupported and not no_citations
        retry_count = state.get("retry_count", 0)
        should_retry = (not verified) and (retry_count < settings.max_verification_retries)

        result: dict = {
            "verified": verified,
            "unsupported_citations": unsupported,
            "should_retry": should_retry,
        }

        if should_retry:
            result["retry_count"] = retry_count + 1
            result["retry_note"] = "Please be more specific and include exact figures, dates, or clause numbers."
            result["verification_note"] = (
                f"Retry {retry_count + 1}: answer had unsupported or missing citations, re-retrieving."
            )
        else:
            result["verification_note"] = (
                "Verified: all citations trace back to retrieved chunks."
                if verified
                else "Could not fully verify citations after max retries; returning best-effort answer with a caveat."
            )
            if not verified:
                result["answer"] = (
                    state.get("answer", "")
                    + "\n\n_Note: some parts of this answer could not be fully grounded in the source documents. Please verify against the original sources._"
                )

        return result

    return verification_node
