"""
Stock API endpoints.

Provides CRUD operations for managing stock records.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.v1.dependencies import get_current_user
from app.core.logging_config import get_logger
from app.database.session import get_db
from app.models.user import User
from app.schemas.stock import (
    StockCreate,
    StockListResponse,
    StockResponse,
    StockUpdate,
    StockExternalSearchResponse,
)
from app.services.stock_service import StockService

logger = get_logger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /stocks – Create a new stock
# ---------------------------------------------------------------------------
@router.post(
    "/",
    response_model=StockResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new stock",
    description="Add a new stock to the database. Requires authentication.",
)
async def create_stock(
    stock_in: StockCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Create a new stock record."""
    service = StockService(db)
    return await service.create_stock(stock_in)


# ---------------------------------------------------------------------------
# GET /stocks – List stocks with pagination, sorting, filtering, search
# ---------------------------------------------------------------------------
@router.get(
    "/",
    response_model=StockListResponse,
    summary="List stocks",
    description=(
        "Retrieve a paginated list of stocks with optional sorting, "
        "filtering by sector/industry/exchange/active status, and search."
    ),
)
async def list_stocks(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=1000, description="Results per page"),
    sort_by: str = Query("symbol", description="Field to sort by"),
    sort_order: str = Query("asc", pattern="^(asc|desc)$", description="Sort direction"),
    sector: str | None = Query(None, description="Filter by sector"),
    industry: str | None = Query(None, description="Filter by industry"),
    exchange: str | None = Query(None, description="Filter by exchange"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    search: str | None = Query(None, description="Search symbol or company name"),
):
    """List stocks with pagination."""
    service = StockService(db)
    return await service.list_stocks(
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
        sector=sector,
        industry=industry,
        exchange=exchange,
        is_active=is_active,
        search=search,
    )


# ---------------------------------------------------------------------------
# GET /stocks/search/external – Search external stocks on Yahoo Finance
# ---------------------------------------------------------------------------
@router.get(
    "/search/external",
    response_model=list[StockExternalSearchResponse],
    summary="Search stocks on external provider",
    description="Search Yahoo Finance for matching symbols. Requires authentication.",
)
async def search_external_stocks(
    current_user: Annotated[User, Depends(get_current_user)],
    q: str = Query(..., min_length=1, description="Search query"),
):
    """Search Yahoo Finance for matching tickers."""
    from app.services.providers.orchestrator import MarketDataOrchestrator
    provider = MarketDataOrchestrator().get_provider()
    results = await provider.search_companies(q)
    return results


# ---------------------------------------------------------------------------
# GET /stocks/symbol/{symbol} – Get by ticker symbol
# ---------------------------------------------------------------------------
@router.get(
    "/symbol/{symbol}",
    response_model=StockResponse,
    summary="Get stock by symbol",
    description="Retrieve a stock by its ticker symbol.",
)
async def get_stock_by_symbol(
    symbol: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Retrieve a single stock by ticker symbol."""
    service = StockService(db)
    return await service.get_stock_by_symbol(symbol)


# ---------------------------------------------------------------------------
# GET /stocks/{id} – Get by ID
# ---------------------------------------------------------------------------
@router.get(
    "/{stock_id}",
    response_model=StockResponse,
    summary="Get stock by ID",
    description="Retrieve a stock by its unique identifier.",
)
async def get_stock_by_id(
    stock_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Retrieve a single stock by its ObjectId."""
    service = StockService(db)
    return await service.get_stock_by_id(stock_id)


# ---------------------------------------------------------------------------
# PUT /stocks/{id} – Update
# ---------------------------------------------------------------------------
@router.put(
    "/{stock_id}",
    response_model=StockResponse,
    summary="Update a stock",
    description="Update an existing stock record. Requires authentication.",
)
async def update_stock(
    stock_id: str,
    stock_update: StockUpdate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Update a stock by ID."""
    service = StockService(db)
    return await service.update_stock(stock_id, stock_update)


# ---------------------------------------------------------------------------
# DELETE /stocks/{id} – Delete
# ---------------------------------------------------------------------------
@router.delete(
    "/{stock_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a stock",
    description="Delete a stock record. Requires authentication.",
)
async def delete_stock(
    stock_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Delete a stock by ID."""
    service = StockService(db)
    return await service.delete_stock(stock_id)
