import io
import os
import uuid
from typing import List
from PIL import Image, ImageOps

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status

router = APIRouter()

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB per file
MAX_FILES_PER_REQUEST = 8

# Target dimensions
MAX_DISPLAY_SIZE = (1200, 800)
THUMBNAIL_SIZE = (400, 300)

UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "uploads"
)


def process_and_save_image(raw_bytes: bytes, base_filename: str) -> dict:
    """Process raw image bytes: auto-orient, optimize to WebP, and create thumbnail."""
    try:
        img = Image.open(io.BytesIO(raw_bytes))
        # Auto-rotate based on EXIF orientation tag from cameras/phones
        img = ImageOps.exif_transpose(img)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted image data: {str(e)}",
        )

    # Convert to RGB (handles RGBA or Palette images for clean WebP conversion)
    if img.mode in ("RGBA", "LA", "P"):
        rgb_img = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        rgb_img.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
        img = rgb_img
    elif img.mode != "RGB":
        img = img.convert("RGB")

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 1. Main Display Image (WebP format, max 1200x800)
    display_img = img.copy()
    display_img.thumbnail(MAX_DISPLAY_SIZE, Image.Resampling.LANCZOS)
    main_filename = f"{base_filename}.webp"
    main_filepath = os.path.join(UPLOAD_DIR, main_filename)
    display_img.save(main_filepath, "WEBP", quality=85, optimize=True)

    # 2. Card Grid Thumbnail (WebP format, max 400x300)
    thumb_img = img.copy()
    thumb_img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
    thumb_filename = f"{base_filename}_thumb.webp"
    thumb_filepath = os.path.join(UPLOAD_DIR, thumb_filename)
    thumb_img.save(thumb_filepath, "WEBP", quality=80, optimize=True)

    return {
        "file_name": main_filename,
        "thumbnail_file_name": thumb_filename,
        "width": display_img.width,
        "height": display_img.height,
        "thumbnail_width": thumb_img.width,
        "thumbnail_height": thumb_img.height,
    }


ALLOWED_VIDEO_TYPES = {
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/quicktime": ".mov",
    "video/x-matroska": ".mkv",
    "video/ogg": ".ogv",
}
MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024  # 100 MB per file


@router.post(
    "/images",
    response_model=List[dict],
    summary="Upload and optimize car images (WebP + Thumbnails)",
    description=(
        "Accepts jpg/png/webp files, converts and optimizes them to modern WebP "
        "format (1200x800 display image and 400x300 grid thumbnail), reducing payload size by ~70%."
    ),
)
async def upload_images(
    request: Request,
    files: List[UploadFile] = File(...),
) -> List[dict]:
    """Validate, optimize to WebP, and persist uploaded image files."""
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No files were provided"
        )
    if len(files) > MAX_FILES_PER_REQUEST:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"At most {MAX_FILES_PER_REQUEST} images per request",
        )

    base = str(request.base_url).rstrip("/")
    results: List[dict] = []

    for f in files:
        content_type = (f.content_type or "").lower()
        if content_type not in ALLOWED_IMAGE_TYPES:
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

        base_id = uuid.uuid4().hex
        meta = process_and_save_image(data, base_id)

        results.append(
            {
                "file_name": meta["file_name"],
                "url": f"{base}/uploads/{meta['file_name']}",
                "thumbnail_url": f"{base}/uploads/{meta['thumbnail_file_name']}",
                "width": meta["width"],
                "height": meta["height"],
            }
        )

    return results


@router.post(
    "/videos",
    response_model=List[dict],
    summary="Upload car walkaround or engine sound videos",
    description="Accepts mp4/webm/mov video files up to 100MB.",
)
async def upload_videos(
    request: Request,
    files: List[UploadFile] = File(...),
) -> List[dict]:
    """Validate and persist uploaded car video files."""
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No video files provided"
        )

    base = str(request.base_url).rstrip("/")
    results: List[dict] = []
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    for f in files:
        content_type = (f.content_type or "").lower()
        ext = ALLOWED_VIDEO_TYPES.get(content_type, ".mp4")
        if content_type not in ALLOWED_VIDEO_TYPES and not f.filename.lower().endswith(tuple(ALLOWED_VIDEO_TYPES.values())):
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported video type '{content_type}'. Allowed: MP4, WebM, MOV",
            )

        data = await f.read()
        if not data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Video file '{f.filename}' is empty",
            )
        if len(data) > MAX_VIDEO_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Video file '{f.filename}' exceeds 100 MB size limit",
            )

        video_filename = f"video_{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(UPLOAD_DIR, video_filename)
        with open(filepath, "wb") as out_f:
            out_f.write(data)

        results.append(
            {
                "file_name": video_filename,
                "url": f"{base}/uploads/{video_filename}",
                "content_type": content_type,
                "size_bytes": len(data),
            }
        )

    return results