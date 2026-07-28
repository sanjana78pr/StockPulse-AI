"""
StockPulse AI – FastAPI Application Entry Point.

Configures and initializes the FastAPI application with:
- CORS middleware for React frontend integration
- Lifespan events for startup/shutdown
- Global exception handlers
- API versioning via router prefixes
- Swagger/ReDoc API documentation
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.api.v1.router import api_v1_router
from app.core.config import get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import get_logger, setup_logging
from app.database.session import client

# ---------------------------------------------------------------------------
# Initialize logging and settings
# ---------------------------------------------------------------------------
setup_logging()
logger = get_logger(__name__)
settings = get_settings()


# ---------------------------------------------------------------------------
# Lifespan: Startup & Shutdown Events
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Manage application startup and shutdown events.

    Startup:
        - Logs the application launch.
        - Verifies database connectivity.

    Shutdown:
        - Closes the Motor client connection pool.
    """
    # --- Startup ---
    logger.info("=" * 60)
    logger.info("%s v%s starting up...", settings.PROJECT_NAME, settings.PROJECT_VERSION)
    logger.info("API Prefix: %s", settings.API_V1_STR)
    logger.info("Database: %s (MongoDB)", settings.MONGODB_NAME)
    logger.info("CORS Origins: %s", settings.CORS_ORIGINS)
    logger.info("=" * 60)

    # Verify database connectivity at startup
    try:
        db = client[settings.MONGODB_NAME]
        await db.command("ping")
        logger.info("MongoDB connection verified successfully.")
    except Exception as exc:
        logger.error("MongoDB connection failed: %s", str(exc))
        logger.warning("Application starting without database connectivity.")

    # Create unique indexes for the users collection
    try:
        users_collection = client[settings.MONGODB_NAME]["users"]
        await users_collection.create_index("email", unique=True)
        await users_collection.create_index("username", unique=True)
        logger.info("MongoDB indexes ensured for 'users' collection.")
    except Exception as exc:
        logger.error("Failed to create MongoDB indexes: %s", str(exc))

    # Create unique index for the stocks collection
    try:
        stocks_collection = client[settings.MONGODB_NAME]["stocks"]
        await stocks_collection.create_index("symbol", unique=True)
        logger.info("MongoDB unique index ensured for 'stocks' collection.")
    except Exception as exc:
        logger.error("Failed to create MongoDB indexes for stocks: %s", str(exc))

    # Create indexes for the historical_prices collection
    try:
        hp_collection = client[settings.MONGODB_NAME]["historical_prices"]
        await hp_collection.create_index("stock_id")
        await hp_collection.create_index("symbol")
        await hp_collection.create_index("date")
        await hp_collection.create_index(
            [("symbol", 1), ("interval", 1), ("date", 1)],
            unique=True
        )
        logger.info("MongoDB indexes ensured for 'historical_prices' collection.")
    except Exception as exc:
        logger.error("Failed to create MongoDB indexes for historical_prices: %s", str(exc))

    # Create indexes for the live_market_data collection
    try:
        lm_collection = client[settings.MONGODB_NAME]["live_market_data"]
        await lm_collection.create_index("symbol")
        await lm_collection.create_index("timestamp")
        logger.info("MongoDB indexes ensured for 'live_market_data' collection.")
    except Exception as exc:
        logger.error("Failed to create MongoDB indexes for live_market_data: %s", str(exc))


    # Create indexes for the portfolios collection
    try:
        portfolios_collection = client[settings.MONGODB_NAME]["portfolios"]
        await portfolios_collection.create_index("user_id")
        await portfolios_collection.create_index([("user_id", 1), ("portfolio_name", 1)], unique=True)
        logger.info("MongoDB indexes ensured for 'portfolios' collection.")
    except Exception as exc:
        logger.error("Failed to create MongoDB indexes for portfolios: %s", str(exc))

    yield


    # --- Shutdown ---
    logger.info("Shutting down %s...", settings.PROJECT_NAME)
    client.close()
    logger.info("MongoDB connection pool closed. Goodbye!")


# ---------------------------------------------------------------------------
# FastAPI Application Instance
# ---------------------------------------------------------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description=(
        "Real-Time Stock Market Analytics and Investment Decision Support "
        "Platform Using Big Data. Provides REST APIs for stock analytics, "
        "portfolio management, AI-powered predictions, and market insights."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Request-ID"],
)


# ---------------------------------------------------------------------------
# Exception Handlers
# ---------------------------------------------------------------------------
register_exception_handlers(app)


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(api_v1_router, prefix=settings.API_V1_STR)


# ---------------------------------------------------------------------------
# Root Endpoint
# ---------------------------------------------------------------------------
@app.get("/", tags=["Root"], summary="API Root")
async def root() -> dict:
    """Root endpoint that provides API information and navigation links."""
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "docs": "/docs",
        "redoc": "/redoc",
        "health": f"{settings.API_V1_STR}/health",
        "api": settings.API_V1_STR,
    }
