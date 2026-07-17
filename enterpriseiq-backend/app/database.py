"""
Database connection layer.

Uses Motor (the async MongoDB driver) against a real MongoDB instance when
MONGO_URI is configured. When it's not (e.g. local dev with no DB running),
it transparently falls back to `mongomock-motor`, an in-memory drop-in
replacement with the same async API. This means the exact same service/router
code runs whether or not a real database is available — swap MONGO_URI in
.env when you point this at a real cluster, no code changes needed.
"""
import logging

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class Database:
    client = None
    db = None
    using_mock = False


database = Database()


async def connect_to_mongo() -> None:
    if settings.mongo_uri:
        from motor.motor_asyncio import AsyncIOMotorClient

        logger.info("Connecting to MongoDB at configured MONGO_URI")
        database.client = AsyncIOMotorClient(settings.mongo_uri)
        database.db = database.client[settings.mongo_db_name]
        database.using_mock = False
    else:
        from mongomock_motor import AsyncMongoMockClient

        logger.warning(
            "No MONGO_URI configured — using an in-memory mock database. "
            "Data will NOT persist across restarts. Set MONGO_URI in .env "
            "to connect to a real MongoDB instance."
        )
        database.client = AsyncMongoMockClient()
        database.db = database.client[settings.mongo_db_name]
        database.using_mock = True

    await _ensure_indexes()


async def close_mongo_connection() -> None:
    if database.client:
        database.client.close()


async def _ensure_indexes() -> None:
    """Create indexes required for correctness and query performance."""
    users = database.db["users"]
    await users.create_index("email", unique=True)

    documents = database.db["documents"]
    await documents.create_index("owner_id")
    await documents.create_index("workspace_id")
    await documents.create_index([("file_name", "text")])

    chunks = database.db["chunks"]
    await chunks.create_index("chunk_id", unique=True)
    await chunks.create_index("doc_id")
    await chunks.create_index([("owner_id", 1), ("workspace_id", 1)])

    chats = database.db["chats"]
    await chats.create_index([("owner_id", 1), ("created_at", -1)])


def get_db():
    """FastAPI dependency — yields the current database handle."""
    return database.db
