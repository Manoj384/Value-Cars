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

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for database initialization and seeding."""
    # Startup: Create tables if they do not exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Seed default admin user & sample cars
    async with AsyncSessionLocal() as session:
        try:
            await seed_database(session)
        except Exception as e:
            print(f"Warning: Database seeding encountered: {e}")

    yield

    # Shutdown: Close database engine connections
    await engine.dispose()


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
- **Valuation Engine**: Intelligent rules-based used-car price estimator.
- **Digital Inspection**: 100+ checkpoint evaluation report with categorical scoring.
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

# Mount static files if directory exists
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


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
