from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Query, UploadFile, status
from fastapi.responses import FileResponse

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.schemas.document import DocumentListResponse, DocumentOut, DocumentUpdate
from app.services import document_service

router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    workspace_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    return await document_service.save_document(
        db, file, str(current_user["_id"]), workspace_id, background_tasks
    )


@router.get("", response_model=DocumentListResponse)
async def list_my_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    workspace_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    documents, total = await document_service.list_documents(
        db, str(current_user["_id"]), page, page_size, search, workspace_id
    )
    return DocumentListResponse(total=total, page=page, page_size=page_size, documents=documents)


@router.get("/{document_id}", response_model=DocumentOut)
async def get_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    return await document_service.get_document(db, document_id, str(current_user["_id"]))


@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    doc = await document_service.get_document(db, document_id, str(current_user["_id"]))
    return FileResponse(doc["stored_path"], filename=doc["file_name"])


@router.patch("/{document_id}", response_model=DocumentOut)
async def rename_document(
    document_id: str,
    payload: DocumentUpdate,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    return await document_service.rename_document(db, document_id, str(current_user["_id"]), payload.file_name)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_db),
):
    await document_service.delete_document(db, document_id, str(current_user["_id"]))
    return None
