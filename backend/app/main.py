import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.api_router import api_router
from app.core.config import settings
from app.core.database import Base, engine, AsyncSessionLocal
from app.services.seed_service import seed_database

logger = logging.getLogger("valuecars")
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for database initialization and seeding."""
    # Startup: Connect to DB and ensure tables exist
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Connected to database successfully. Tables initialized.")
    except Exception as e:
        print(f"Warning during database table sync on startup: {e}")

    # Startup: Seed initial data if empty
    try:
        async with AsyncSessionLocal() as session:
            await seed_database(session)
    except Exception as e:
        print(f"Notice during initial seeding: {e}")

    yield

    # Shutdown: Close database engine connections gracefully
    try:
        await engine.dispose()
    except Exception:
        pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    description="""
# 🚗 Value Cars REST API

Production-ready backend for a modern Spinny-inspired used-car marketplace and inventory platform.

### Core Capabilities:
- **Car Catalog & Search**: Multi-criteria filters, high-resolution galleries, and 360 specs.
- **Brand Selector**: 12-brand visual selection grid.
- **Valuation Engine**: Intelligent rules-based used-car price estimator.
- **Digital Inspection**: 200-point checkpoint evaluation report with categorical scoring.
- **Seller Submissions**: Online car addition with Admin Email Verification & Whitelist approval.
- **CRM & Leads**: Sell car requests, test drive bookings, and conversion pipeline.
- **Orders & Payments**: Token reservations and checkout handling.
""",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Mount static files if directory exists
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/uploads/{path:path}", summary="Serve Media with Permanent Database Recovery")
async def serve_uploaded_media(path: str):
    """Serves uploaded car media from local disk or automatically recovers it from Supabase DB."""
    import base64
    from sqlalchemy import select
    from app.models.uploaded_media import UploadedMedia
    from fastapi.responses import Response

    clean_path = path.replace("\\", "/").strip("/")
    local_path = os.path.join(settings.UPLOAD_DIR, clean_path)

    # 1. Fast path: If file is cached on local disk
    if os.path.exists(local_path) and os.path.isfile(local_path):
        return FileResponse(local_path)

    # 2. Check flat filename without brand directory
    flat_name = os.path.basename(clean_path)
    flat_path = os.path.join(settings.UPLOAD_DIR, flat_name)
    if os.path.exists(flat_path) and os.path.isfile(flat_path):
        return FileResponse(flat_path)

    # 3. Persistent Database Fallback: Retrieve binary from Supabase PostgreSQL (survives Render restarts)
    try:
        async with AsyncSessionLocal() as db:
            query = select(UploadedMedia).where(
                (UploadedMedia.filename == clean_path) |
                (UploadedMedia.filename == flat_name) |
                (UploadedMedia.filename.like(f"%{flat_name}"))
            )
            result = await db.execute(query)
            media = result.scalar_one_or_none()

            if media and media.data_base64:
                os.makedirs(os.path.dirname(local_path), exist_ok=True)
                raw_bytes = base64.b64decode(media.data_base64)
                with open(local_path, "wb") as f:
                    f.write(raw_bytes)
                return Response(content=raw_bytes, media_type=media.content_type)
    except Exception as e:
        logger.error(f"Error fetching media '{clean_path}' from database: {e}")

    # 4. Graceful Fallback Placeholder if media not found
    default_car_img = os.path.join(STATIC_DIR, "logo_black_clean.png")
    if os.path.exists(default_car_img):
        return FileResponse(default_car_img)

    return JSONResponse(status_code=404, content={"detail": "Media file not found"})


@app.get("/", summary="Web Application Home")
async def root():
    """Serves the Value Cars Interactive Web Application UI."""
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return JSONResponse(
        content={
            "app": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "online",
            "docs_url": "/docs",
            "api_v1": settings.API_V1_STR,
            "health_check": f"{settings.API_V1_STR}/health",
        }
    )
