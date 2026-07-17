"""
BM25 keyword search.

Rebuilt in-memory per query over the RBAC-scoped candidate set (the chunks
Mongo collection, filtered by owner_id/workspace_id/doc_id first). This is
the right tradeoff at MVP scale: no separate keyword-index infrastructure to
maintain, and it guarantees the keyword search never sees a chunk outside
the requester's permission scope. Swap for a persistent inverted index
(e.g. Elasticsearch/OpenSearch) once corpus size makes per-query rebuilds
too slow.
"""
from rank_bm25 import BM25Okapi


def bm25_search(candidates: list[dict], query: str, top_k: int = 8) -> list[dict]:
    """candidates: [{"chunk_id": str, "text": str, ...}, ...]"""
    if not candidates:
        return []

    tokenized_corpus = [c["text"].lower().split() for c in candidates]
    bm25 = BM25Okapi(tokenized_corpus)
    scores = bm25.get_scores(query.lower().split())

    ranked = sorted(zip(candidates, scores), key=lambda pair: pair[1], reverse=True)
    results = []
    for candidate, score in ranked[:top_k]:
        if score <= 0:
            continue
        results.append({**candidate, "bm25_score": float(score)})
    return results
