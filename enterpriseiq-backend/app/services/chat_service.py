import logging
from datetime import datetime, timezone
from typing import Optional

from app.agents.graph import run_query
from app.schemas.chat import CitationOut

logger = logging.getLogger(__name__)


async def ask(db, owner_id: str, query: str, workspace_id: Optional[str], document_id: Optional[str]) -> dict:
    final_state = await run_query(db, query=query, owner_id=owner_id, workspace_id=workspace_id, doc_id=document_id)

    chunks_by_id = {c["chunk_id"]: c for c in final_state.get("chunks", [])}
    cited_ids = final_state.get("cited_chunk_ids", [])
    citations = [
        CitationOut(
            chunk_id=cid,
            doc_id=chunks_by_id[cid]["doc_id"],
            file_name=chunks_by_id[cid]["file_name"],
            page=chunks_by_id[cid].get("page"),
            text_preview=chunks_by_id[cid]["text"][:200],
        )
        for cid in cited_ids
        if cid in chunks_by_id
    ]

    record = {
        "owner_id": owner_id,
        "workspace_id": workspace_id,
        "document_id": document_id,
        "query": query,
        "answer": final_state.get("answer", ""),
        "intent": final_state.get("intent", "qa"),
        "verified": final_state.get("verified", False),
        "verification_note": final_state.get("verification_note", ""),
        "citation_chunk_ids": cited_ids,
        "created_at": datetime.now(timezone.utc),
    }
    await db["chats"].insert_one(record)

    return {
        "answer": record["answer"],
        "intent": record["intent"],
        "verified": record["verified"],
        "verification_note": record["verification_note"],
        "citations": citations,
    }


async def get_history(db, owner_id: str, page: int, page_size: int) -> tuple[list[dict], int]:
    query = {"owner_id": owner_id}
    total = await db["chats"].count_documents(query)
    cursor = db["chats"].find(query).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size)
    chats = await cursor.to_list(length=page_size)
    return chats, total
