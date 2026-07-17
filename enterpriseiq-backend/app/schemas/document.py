from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import ProcessingStatus
from app.schemas.common import PyObjectId


class DocumentOut(BaseModel):
    id: PyObjectId = Field(alias="_id")
    owner_id: str
    workspace_id: Optional[str] = None
    file_name: str
    file_type: str
    file_size: int
    num_pages: Optional[int] = None
    processing_status: ProcessingStatus
    processing_error: Optional[str] = None
    category: Optional[str] = None
    chunk_count: Optional[int] = None
    uploaded_at: datetime

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}


class DocumentUpdate(BaseModel):
    file_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    workspace_id: Optional[str] = None


class DocumentListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    documents: list[DocumentOut]
