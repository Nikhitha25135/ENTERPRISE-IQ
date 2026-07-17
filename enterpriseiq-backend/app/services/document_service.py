import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

import aiofiles
from bson import ObjectId
from fastapi import BackgroundTasks, HTTPException, UploadFile, status

from app.core.config import get_settings
from app.ingestion.pipeline import delete_document_index, process_document
from app.models.enums import ProcessingStatus
from app.utils.file_validation import sanitize_filename, validate_upload

logger = logging.getLogger(__name__)
settings = get_settings()

CHUNK_SIZE = 1024 * 1024  # 1MB


async def save_document(
    db, file: UploadFile, owner_id: str, workspace_id: Optional[str], background_tasks: BackgroundTasks
) -> dict:
    ext = validate_upload(file, file.size)
    safe_name = sanitize_filename(file.filename)

    os.makedirs(settings.upload_dir, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(settings.upload_dir, stored_name)

    total_bytes = 0
    try:
        async with aiofiles.open(stored_path, "wb") as out_file:
            while chunk := await file.read(CHUNK_SIZE):
                total_bytes += len(chunk)
                if total_bytes > settings.max_upload_size_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds the {settings.max_upload_size_mb}MB upload limit",
                    )
                await out_file.write(chunk)
    except HTTPException:
        if os.path.exists(stored_path):
            os.remove(stored_path)
        raise
    except Exception as exc:
        if os.path.exists(stored_path):
            os.remove(stored_path)
        logger.exception("Failed to write uploaded file")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to store file") from exc

    doc = {
        "owner_id": owner_id,
        "workspace_id": workspace_id,
        "file_name": safe_name,
        "stored_path": stored_path,
        "file_type": ext.lstrip("."),
        "file_size": total_bytes,
        "num_pages": None,
        "processing_status": ProcessingStatus.UPLOADED.value,
        "uploaded_at": datetime.now(timezone.utc),
    }
    result = await db["documents"].insert_one(doc)
    doc["_id"] = result.inserted_id

    # Ingestion runs in the background so the upload request returns
    # immediately; processing_status moves UPLOADED -> PROCESSING ->
    # SEARCHABLE (or FAILED) as app.ingestion.pipeline.process_document runs.
    background_tasks.add_task(process_document, db, doc)

    return doc


async def list_documents(
    db, owner_id: str, page: int, page_size: int, search: Optional[str], workspace_id: Optional[str]
) -> tuple[list[dict], int]:
    query: dict = {"owner_id": owner_id}
    if workspace_id:
        query["workspace_id"] = workspace_id
    if search:
        query["file_name"] = {"$regex": search, "$options": "i"}

    total = await db["documents"].count_documents(query)
    cursor = (
        db["documents"]
        .find(query)
        .sort("uploaded_at", -1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )
    documents = await cursor.to_list(length=page_size)
    return documents, total


async def get_document(db, document_id: str, owner_id: str) -> dict:
    if not ObjectId.is_valid(document_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid document id")

    doc = await db["documents"].find_one({"_id": ObjectId(document_id), "owner_id": owner_id})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return doc


async def rename_document(db, document_id: str, owner_id: str, new_name: str) -> dict:
    doc = await get_document(db, document_id, owner_id)
    await db["documents"].update_one({"_id": doc["_id"]}, {"$set": {"file_name": sanitize_filename(new_name)}})
    return await get_document(db, document_id, owner_id)


async def delete_document(db, document_id: str, owner_id: str) -> None:
    doc = await get_document(db, document_id, owner_id)
    stored_path = doc.get("stored_path")
    await db["documents"].delete_one({"_id": doc["_id"]})
    await delete_document_index(db, str(doc["_id"]))
    if stored_path and os.path.exists(stored_path):
        os.remove(stored_path)
