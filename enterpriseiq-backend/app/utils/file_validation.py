import os

from fastapi import HTTPException, UploadFile, status

from app.core.config import get_settings

settings = get_settings()


def validate_upload(file: UploadFile, content_length: int | None) -> str:
    """Validates file extension and size. Returns the lowercased extension."""
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must have a name")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in settings.allowed_extensions_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{ext}' is not supported. Allowed types: {settings.allowed_extensions_list}",
        )

    if content_length is not None and content_length > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.max_upload_size_mb}MB upload limit",
        )

    return ext


def sanitize_filename(filename: str) -> str:
    """Strips path components to prevent directory traversal."""
    return os.path.basename(filename).replace("..", "")
