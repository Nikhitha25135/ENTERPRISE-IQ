"""
Hybrid retrieval: vector search (ChromaDB) + keyword search (BM25), fused
with Reciprocal Rank Fusion (RRF).

Why hybrid: pure embedding search is weak on exact numbers, IDs, and precise
legal/financial terms ("clause 4.2", "$182,400") that BM25 catches easily.
Fusing both, rather than picking one, gives noticeably better recall on
enterprise documents than either alone.

Both legs of the search are RBAC-scoped by owner_id/workspace_id/doc_id
before ranking ever happens — retrieval can't leak across permission
boundaries.
"""
from typing import Optional

from app.core.config import get_settings
from app.vectorstore import chroma_store
from app.vectorstore.bm25_index import bm25_search
from app.vectorstore.embeddings import embed_query

settings = get_settings()

RRF_K = 60  # standard RRF smoothing constant


async def _fetch_rbac_scoped_candidates(
    db, owner_id: str, workspace_id: Optional[str], doc_id: Optional[str]
) -> list[dict]:
    query_filter: dict = {"owner_id": owner_id}
    if workspace_id:
        query_filter["workspace_id"] = workspace_id
    if doc_id:
        query_filter["doc_id"] = doc_id

    cursor = db["chunks"].find(query_filter)
    docs = await cursor.to_list(length=5000)
    return [
        {
            "chunk_id": d["chunk_id"],
            "text": d["text"],
            "doc_id": d["doc_id"],
            "file_name": d.get("file_name", ""),
            "page": d.get("page"),
            "category": d.get("category", "general"),
        }
        for d in docs
    ]


def _reciprocal_rank_fusion(vector_hits: list[dict], bm25_hits: list[dict]) -> list[dict]:
    scores: dict[str, float] = {}
    chunk_lookup: dict[str, dict] = {}

    for rank, hit in enumerate(vector_hits):
        cid = hit["chunk_id"]
        scores[cid] = scores.get(cid, 0.0) + 1.0 / (RRF_K + rank + 1)
        chunk_lookup[cid] = {
            "chunk_id": cid,
            "text": hit["text"],
            "doc_id": hit["metadata"]["doc_id"],
            "file_name": hit["metadata"].get("file_name", ""),
            "page": hit["metadata"].get("page"),
            "category": hit["metadata"].get("category", "general"),
        }

    for rank, hit in enumerate(bm25_hits):
        cid = hit["chunk_id"]
        scores[cid] = scores.get(cid, 0.0) + 1.0 / (RRF_K + rank + 1)
        chunk_lookup.setdefault(
            cid,
            {
                "chunk_id": cid,
                "text": hit["text"],
                "doc_id": hit["doc_id"],
                "file_name": hit.get("file_name", ""),
                "page": hit.get("page"),
                "category": hit.get("category", "general"),
            },
        )

    ranked_ids = sorted(scores.keys(), key=lambda cid: scores[cid], reverse=True)
    return [{**chunk_lookup[cid], "fused_score": scores[cid]} for cid in ranked_ids]


async def hybrid_search(
    db,
    query: str,
    owner_id: str,
    workspace_id: Optional[str] = None,
    doc_id: Optional[str] = None,
    top_k: Optional[int] = None,
) -> list[dict]:
    top_k = top_k or settings.final_top_k

    candidates = await _fetch_rbac_scoped_candidates(db, owner_id, workspace_id, doc_id)
    bm25_hits = bm25_search(candidates, query, top_k=settings.bm25_top_k)

    query_embedding = embed_query(query)
    vector_hits = chroma_store.query(
        query_embedding=query_embedding,
        owner_id=owner_id,
        workspace_id=workspace_id,
        doc_id=doc_id,
        top_k=settings.vector_top_k,
    )

    fused = _reciprocal_rank_fusion(vector_hits, bm25_hits)
    return fused[:top_k]
