"""
Embedding generation via Hugging Face sentence-transformers.

The model is loaded lazily and cached at module level so it's only pulled
into memory once per process (loading it per-request would be slow and
wasteful). This is intentionally the only place in the codebase that knows
which embedding model is in use — swapping models means changing one
setting, not hunting through the ingestion/retrieval code.
"""
import logging
import threading

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_model = None
_lock = threading.Lock()


def _get_model():
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                from sentence_transformers import SentenceTransformer

                logger.info("Loading embedding model '%s'...", settings.embedding_model_name)
                _model = SentenceTransformer(settings.embedding_model_name)
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    model = _get_model()
    vectors = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return vectors.tolist()


def embed_query(query: str) -> list[float]:
    return embed_texts([query])[0]
