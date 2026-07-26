"""
StockPulse AI – Async MongoDB Session Management.

Configures the async Motor client and provides a FastAPI dependency
for injecting the MongoDB database instance into endpoints.
"""

from typing import AsyncGenerator

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings
from app.core.logging_config import get_logger

logger = get_logger(__name__)
settings = get_settings()

# ---------------------------------------------------------------------------
# Async Motor Client
# ---------------------------------------------------------------------------
client: AsyncIOMotorClient = AsyncIOMotorClient(
    settings.MONGODB_URL,
    maxPoolSize=50,
    minPoolSize=10,
    serverSelectionTimeoutMS=5000,
)


# ---------------------------------------------------------------------------
# FastAPI Dependency
# ---------------------------------------------------------------------------
async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    """
    FastAPI dependency that yields an async MongoDB database instance.

    The database object is lightweight and does not require explicit
    open/close per request – Motor manages the connection pool.

    Usage:
        @router.get("/items")
        async def list_items(db: AsyncIOMotorDatabase = Depends(get_db)):
            ...

    Yields:
        An AsyncIOMotorDatabase instance bound to the application database.
    """
    db = client[settings.MONGODB_NAME]
    yield db
