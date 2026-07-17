from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import PyObjectId


class ChatQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    workspace_id: Optional[str] = None
    document_id: Optional[str] = None

    @field_validator("workspace_id", "document_id", mode="before")
    @classmethod
    def _empty_string_to_none(cls, v):
        if v in (None, "", "null", "undefined"):
            return None
        return v


class CitationOut(BaseModel):
    chunk_id: str
    doc_id: str
    file_name: str
    page: Optional[int] = None
    text_preview: str


class ChatQueryResponse(BaseModel):
    answer: str
    intent: str
    verified: bool
    verification_note: str
    citations: list[CitationOut]


class ChatHistoryOut(BaseModel):
    id: PyObjectId = Field(alias="_id")
    owner_id: str
    query: str
    answer: str
    intent: str
    verified: bool
    created_at: datetime

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}