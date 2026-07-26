"""
StockPulse AI – Health Check Endpoints.

Provides endpoints for monitoring application health and database
connectivity. Used by load balancers, orchestrators, and monitoring tools.
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_settings
from app.core.logging_config import get_logger
from app.database.session import get_db

logger = get_logger(__name__)
settings = get_settings()

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Application Health Check",
    response_description="Application health status with version info.",
)
async def health_check() -> dict:
    """
    Basic health check endpoint.

    Returns the application status, version, and current server timestamp.
    Does not require authentication or database access.
    """
    return {
        "success": True,
        "status": "healthy",
        "version": settings.PROJECT_VERSION,
        "project": settings.PROJECT_NAME,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get(
    "/health/db",
    status_code=status.HTTP_200_OK,
    summary="Database Health Check",
    response_description="Database connectivity status.",
)
async def database_health_check(db: AsyncIOMotorDatabase = Depends(get_db)) -> dict:
    """
    Verify database connectivity by executing a lightweight command.

    Returns database status as 'connected' or 'unreachable' with
    the specific error message if the connection fails.
    """
    try:
        # MongoDB ping command – equivalent to "SELECT 1"
        await db.command("ping")
        db_status = "connected"
        db_error = None
        logger.debug("Database health check passed.")
    except Exception as exc:
        db_status = "unreachable"
        db_error = str(exc)
        logger.error("Database health check failed: %s", db_error)

    response = {
        "success": db_status == "connected",
        "status": db_status,
        "database": settings.MONGODB_NAME,
        "host": settings.MONGODB_URL,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    if db_error:
        response["error"] = db_error

    return response
