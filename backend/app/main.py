import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
import app.models # Ensure all models are registered with Base metadata
from app.api.v1.api import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("stride")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables asynchronously on startup
    logger.info("Initializing database schemas...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schemas ready.")
    yield
    # Cleanup
    logger.info("Closing database engine...")
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Adaptive AI-Powered Personal Running Coach API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "STRIDE API",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to STRIDE — Adaptive AI Running Coach API",
        "docs_url": "/docs",
        "health": "/health"
    }
