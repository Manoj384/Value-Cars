import os
import uuid
from typing import List

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status

router = APIRouter()

# Allowed image content types mapped to their safe file extensions.
ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB per file
MAX_FILES_PER_REQUEST = 8

# Uploaded files are stored here (backend/uploads) and served at /uploads.
UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "uploads"
)


@router.post(
    "/images",
    response_model=List[dict],
    summary="Upload one or more car images",
    description=(
        "Accepts jpg/png/webp files (max 10 MB each, up to 8 per request), saves them "
        "to local storage, and returns their public URLs for use in car listings."
    ),
)
async def upload_images(
    request: Request,
    files: List[UploadFile] = File(...),
) -> List[dict]:
    """Validate and persist uploaded image files, returning public URLs."""
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No files were provided"
        )
    if len(files) > MAX_FILES_PER_REQUEST:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"At most {MAX_FILES_PER_REQUEST} images per request",
        )

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    base = str(request.base_url).rstrip("/")
    results: List[dict] = []

    for f in files:
        content_type = (f.content_type or "").lower()
        ext = ALLOWED_IMAGE_TYPES.get(content_type)
        if ext is None:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=(
                    f"Unsupported file type '{content_type or 'unknown'}' for "
                    f"'{f.filename}'. Allowed types: jpg, png, webp"
                ),
            )

        data = await f.read()
        if not data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{f.filename}' is empty",
            )
        if len(data) > MAX_IMAGE_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File '{f.filename}' exceeds the 10 MB size limit",
            )

        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        with open(filepath, "wb") as out:
            out.write(data)

        results.append(
            {"file_name": filename, "url": f"{base}/uploads/{filename}"}
        )

    return results