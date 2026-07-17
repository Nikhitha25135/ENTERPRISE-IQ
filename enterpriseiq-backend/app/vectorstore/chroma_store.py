"""
ChromaDB vector store.

Every chunk is upserted with owner_id / workspace_id / doc_id / category in
its metadata. This is what makes RBAC actually reach into retrieval instead
of only guarding the API layer: every query filters on owner_id (and
workspace_id, when the request is scoped to a workspace) so a vector search
can never surface a chunk belonging to someone else's document.
"""
import logging
import threading
from typing import Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_client = None
_collection = None
_lock = threading.Lock()


def _get_collection():
    global _client, _collection
    if _collection is None:
        with _lock:
            if _collection is None:
                import chromadb

                _client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
                _collection = _client.get_or_create_collection(
                    name=settings.chroma_collection,
                    metadata={"hnsw:space": "cosine"},
                )
    return _collection


def upsert_chunks(chunk_records: list[dict]) -> None:
    """chunk_records: [{id, text, embedding, owner_id, workspace_id, doc_id,
    page, category, ...}, ...]"""
    if not chunk_records:
        return

    collection = _get_collection()
    ids = [c["id"] for c in chunk_records]
    embeddings = [c["embedding"] for c in chunk_records]
    documents = [c["text"] for c in chunk_records]
    metadatas = [
        {
            "owner_id": c["owner_id"],
            "workspace_id": c.get("workspace_id") or "",
            "doc_id": c["doc_id"],
            "page": c.get("page") if c.get("page") is not None else -1,
            "category": c.get("category", "general"),
            "file_name": c.get("file_name", ""),
        }
        for c in chunk_records
    ]
    collection.upsert(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)


def delete_document_chunks(doc_id: str) -> None:
    collection = _get_collection()
    collection.delete(where={"doc_id": doc_id})


def query(
    query_embedding: list[float],
    owner_id: str,
    workspace_id: Optional[str] = None,
    doc_id: Optional[str] = None,
    top_k: int = 8,
) -> list[dict]:
    """RBAC-filtered vector search. Always scoped to owner_id at minimum."""
    collection = _get_collection()

    conditions = [{"owner_id": owner_id}]
    if workspace_id:
        conditions.append({"workspace_id": workspace_id})
    if doc_id:
        conditions.append({"doc_id": doc_id})

    where = conditions[0] if len(conditions) == 1 else {"$and": conditions}

    result = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where,
    )

    hits = []
    ids = result.get("ids", [[]])[0]
    docs = result.get("documents", [[]])[0]
    metas = result.get("metadatas", [[]])[0]
    dists = result.get("distances", [[]])[0]

    for i in range(len(ids)):
        hits.append(
            {
                "chunk_id": ids[i],
                "text": docs[i],
                "metadata": metas[i],
                "distance": dists[i],
            }
        )
    return hits
