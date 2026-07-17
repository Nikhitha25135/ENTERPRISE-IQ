"""
Redis client — used for LangGraph state checkpointing and query result
caching.

Mirrors the same pattern as app/database.py: if REDIS_URL isn't configured,
fall back to an in-memory dict so the exact same code path works in local
dev without a Redis instance running. Nothing survives a restart in that
mode, same tradeoff as the Mongo mock.
"""
import json
import logging
from typing import Any, Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class _InMemoryFallback:
    """Drop-in replacement for the subset of the redis-py async API this
    project uses, backed by a plain dict."""

    def __init__(self) -> None:
        self._store: dict[str, str] = {}

    async def get(self, key: str) -> Optional[str]:
        return self._store.get(key)

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> None:
        self._store[key] = value

    async def delete(self, key: str) -> None:
        self._store.pop(key, None)

    async def close(self) -> None:
        self._store.clear()


class RedisCache:
    client = None
    using_mock = False


cache = RedisCache()


async def connect_to_redis() -> None:
    if settings.redis_url:
        import redis.asyncio as redis

        logger.info("Connecting to Redis at configured REDIS_URL")
        cache.client = redis.from_url(settings.redis_url, decode_responses=True)
        cache.using_mock = False
    else:
        logger.warning(
            "No REDIS_URL configured — using an in-memory cache fallback. "
            "Chat memory/cache will NOT persist across restarts or scale "
            "across multiple worker processes."
        )
        cache.client = _InMemoryFallback()
        cache.using_mock = True


async def close_redis_connection() -> None:
    if cache.client:
        await cache.client.close()


async def cache_get_json(key: str) -> Optional[Any]:
    raw = await cache.client.get(key)
    if raw is None:
        return None
    return json.loads(raw)


async def cache_set_json(key: str, value: Any, ttl_seconds: int = 3600) -> None:
    await cache.client.set(key, json.dumps(value), ex=ttl_seconds)


def get_cache():
    """FastAPI dependency — yields the current cache client."""
    return cache.client
