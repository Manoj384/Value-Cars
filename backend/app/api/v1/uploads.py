import base64
import io
import os
import re
import uuid
from typing import List, Optional
from PIL import Image, ImageOps

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.uploaded_media import UploadedMedia

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

UPLOAD_DIR = settings.UPLOAD_DIR


def sanitize_brand_slug(brand: Optional[str]) -> str:
    """Normalize and sanitize brand name for clean directory organization."""
    if not brand or not brand.strip():
        return "general"
    clean = brand.strip().lower()
    if "maruti" in clean or "suzuki" in clean:
        return "maruti"
    if "hyundai" in clean:
        return "hyundai"
    if "tata" in clean:
        return "tata"
    if "mahindra" in clean:
        return "mahindra"
    if "toyota" in clean:
        return "toyota"
    if "kia" in clean:
        return "kia"
    if "honda" in clean:
        return "honda"
    if "skoda" in clean:
        return "skoda"
    if "volkswagen" in clean or "vw" in clean:
        return "volkswagen"
    if "nissan" in clean:
        return "nissan"
    if "renault" in clean:
        return "renault"
    # General fallback for any other brand
    slug = re.sub(r"[^a-z0-9_-]", "_", clean).strip("_")
    return slug or "general"


def process_and_save_image(raw_bytes: bytes, base_filename: str, brand_slug: str = "general") -> dict:
    """Process raw image bytes: auto-orient, optimize to WebP, and create thumbnail in brand folder."""
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

    brand_dir = os.path.join(UPLOAD_DIR, brand_slug)
    os.makedirs(brand_dir, exist_ok=True)

    # 1. Main Display Image (WebP format, max 1200x800)
    display_img = img.copy()
    display_img.thumbnail(MAX_DISPLAY_SIZE, Image.Resampling.LANCZOS)
    main_filename = f"{base_filename}.webp"
    main_filepath = os.path.join(brand_dir, main_filename)
    
    out_buf = io.BytesIO()
    display_img.save(out_buf, "WEBP", quality=85, optimize=True)
    webp_bytes = out_buf.getvalue()
    
    with open(main_filepath, "wb") as f:
        f.write(webp_bytes)

    # 2. Card Grid Thumbnail (WebP format, max 400x300)
    thumb_img = img.copy()
    thumb_img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)
    thumb_filename = f"{base_filename}_thumb.webp"
    thumb_filepath = os.path.join(brand_dir, thumb_filename)
    
    thumb_buf = io.BytesIO()
    thumb_img.save(thumb_buf, "WEBP", quality=80, optimize=True)
    thumb_bytes = thumb_buf.getvalue()
    
    with open(thumb_filepath, "wb") as f:
        f.write(thumb_bytes)

    return {
        "file_name": f"{brand_slug}/{main_filename}",
        "thumbnail_file_name": f"{brand_slug}/{thumb_filename}",
        "brand": brand_slug,
        "width": display_img.width,
        "height": display_img.height,
        "thumbnail_width": thumb_img.width,
        "thumbnail_height": thumb_img.height,
        "data_base64": base64.b64encode(webp_bytes).decode("ascii"),
        "thumb_data_base64": base64.b64encode(thumb_bytes).decode("ascii"),
        "size_bytes": len(webp_bytes),
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
    summary="Upload and optimize car images partitioned by brand (WebP + Thumbnails)",
    description=(
        "Accepts jpg/png/webp files and optional brand name, converts and optimizes them to modern WebP "
        "format (1200x800 display image and 400x300 grid thumbnail), partitioned under the brand directory."
    ),
)
async def upload_images(
    request: Request,
    files: List[UploadFile] = File(...),
    brand: Optional[str] = Form(None),
    brand_query: Optional[str] = Query(None, alias="brand"),
    db: AsyncSession = Depends(get_db),
) -> List[dict]:
    """Validate, optimize to WebP, and persist uploaded image files into brand directories and database."""
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No files were provided"
        )
    if len(files) > MAX_FILES_PER_REQUEST:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"At most {MAX_FILES_PER_REQUEST} images per request",
        )

    target_brand = brand or brand_query or "general"
    brand_slug = sanitize_brand_slug(target_brand)
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
        meta = process_and_save_image(data, base_id, brand_slug=brand_slug)

        # Persist image binary into Supabase database to survive container restarts/redeploys
        try:
            media_main = UploadedMedia(
                filename=meta["file_name"],
                brand=brand_slug,
                content_type="image/webp",
                media_type="IMAGE",
                data_base64=meta["data_base64"],
                size_bytes=meta["size_bytes"],
            )
            media_thumb = UploadedMedia(
                filename=meta["thumbnail_file_name"],
                brand=brand_slug,
                content_type="image/webp",
                media_type="IMAGE",
                data_base64=meta["thumb_data_base64"],
                size_bytes=len(meta["thumb_data_base64"]),
            )
            db.add(media_main)
            db.add(media_thumb)
            await db.commit()
        except Exception as e:
            await db.rollback()

        results.append(
            {
                "file_name": meta["file_name"],
                "url": f"/uploads/{meta['file_name']}",
                "thumbnail_url": f"/uploads/{meta['thumbnail_file_name']}",
                "brand": brand_slug,
                "width": meta["width"],
                "height": meta["height"],
            }
        )

    return results


@router.post(
    "/videos",
    response_model=List[dict],
    summary="Upload car walkaround or engine sound videos organized by brand",
    description="Accepts mp4/webm/mov video files up to 100MB organized into brand folders.",
)
async def upload_videos(
    request: Request,
    files: List[UploadFile] = File(...),
    brand: Optional[str] = Form(None),
    brand_query: Optional[str] = Query(None, alias="brand"),
) -> List[dict]:
    """Validate and persist uploaded car video files into brand subdirectories."""
    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No video files provided"
        )

    target_brand = brand or brand_query or "general"
    brand_slug = sanitize_brand_slug(target_brand)
    brand_dir = os.path.join(UPLOAD_DIR, brand_slug)
    os.makedirs(brand_dir, exist_ok=True)

    results: List[dict] = []

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
        filepath = os.path.join(brand_dir, video_filename)
        with open(filepath, "wb") as out_f:
            out_f.write(data)

        rel_path = f"{brand_slug}/{video_filename}"
        results.append(
            {
                "file_name": rel_path,
                "url": f"/uploads/{rel_path}",
                "brand": brand_slug,
                "content_type": content_type,
                "size_bytes": len(data),
            }
        )

    return results