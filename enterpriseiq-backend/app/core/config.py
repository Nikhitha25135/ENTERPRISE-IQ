"""
Centralized application configuration.

All settings are read from environment variables (via a .env file in local dev).
Nothing here should be hardcoded for production secrets — see .env.example.
"""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    app_name: str = "EnterpriseIQ"
    environment: str = "development"
    debug: bool = True

    # Mongo
    mongo_uri: str = ""  # empty -> use in-memory mock DB
    mongo_db_name: str = "enterpriseiq"

    # JWT
    jwt_secret_key: str = "CHANGE_ME_TO_A_LONG_RANDOM_SECRET"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # Uploads
    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 25
    allowed_extensions: str = ".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg"

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # --- Ingestion / RAG pipeline ---
    chroma_persist_dir: str = "./chroma_data"
    chroma_collection: str = "enterpriseiq_chunks"
    embedding_model_name: str = "all-MiniLM-L6-v2"
    chunk_size_tokens: int = 400
    chunk_overlap_tokens: int = 60
    ocr_enabled: bool = True
    tesseract_cmd: str = ""  # leave empty to use system PATH

    # Retrieval
    vector_top_k: int = 8
    bm25_top_k: int = 8
    final_top_k: int = 5
    max_verification_retries: int = 2

    # --- LLM (Groq) ---
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # --- Redis (cache / session) ---
    redis_url: str = ""  # empty -> in-memory fallback cache

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [ext.strip().lower() for ext in self.allowed_extensions.split(",") if ext.strip()]

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
