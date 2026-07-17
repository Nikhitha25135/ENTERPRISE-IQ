import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.redis_client import cache, close_redis_connection, connect_to_redis
from app.database import close_mongo_connection, connect_to_mongo, database
from app.middleware.error_handler import RequestContextMiddleware, register_exception_handlers
from app.routers import auth, chat, documents, users

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()
    await connect_to_redis()
    yield
    await close_redis_connection()
    await close_mongo_connection()


app = FastAPI(
    title=settings.app_name,
    description="EnterpriseIQ — AI-powered Enterprise Knowledge Management API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestContextMiddleware)
register_exception_handlers(app)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(documents.router)
app.include_router(chat.router)


@app.get("/api/health", tags=["System"])
async def health_check():
    return {
        "status": "ok",
        "environment": settings.environment,
        "database": "mock (in-memory)" if database.using_mock else "mongodb",
        "cache": "mock (in-memory)" if cache.using_mock else "redis",
        "llm_configured": bool(settings.groq_api_key),
    }


@app.get("/", tags=["System"])
async def root():
    return {"message": f"{settings.app_name} API is running. See /docs for API documentation."}
