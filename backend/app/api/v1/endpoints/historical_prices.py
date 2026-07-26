"""Historical Market Data API endpoints."""

from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.v1.dependencies import get_current_user
from app.core.logging_config import get_logger
from app.database.session import get_db
from app.models.user import User
from app.schemas.historical_price import (
    BulkInsertResult,
    HistoricalPriceCreate,
    HistoricalPriceListResponse,
    HistoricalPriceResponse,
    HistoricalPriceUpdate,
    ValidationLevel,
)
from app.services.historical_price_service import HistoricalPriceService

logger = get_logger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /historical-prices
# ---------------------------------------------------------------------------
@router.post(
    "/",
    response_model=HistoricalPriceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a historical price record",
)
async def create_price(
    price_in: HistoricalPriceCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    validation_level: ValidationLevel = Query("high", description="Validation strictness level"),
):
    service = HistoricalPriceService(db)
    return await service.create_price(price_in, validation_level)


# ---------------------------------------------------------------------------
# POST /historical-prices/bulk
# ---------------------------------------------------------------------------
@router.post(
    "/bulk",
    response_model=BulkInsertResult,
    status_code=status.HTTP_201_CREATED,
    summary="Bulk insert historical prices",
)
async def bulk_create_prices(
    prices_in: list[HistoricalPriceCreate],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    validation_level: ValidationLevel = Query("high", description="Validation strictness level"),
):
    service = HistoricalPriceService(db)
    return await service.bulk_create_prices(prices_in, validation_level)


# ---------------------------------------------------------------------------
# GET /historical-prices
# ---------------------------------------------------------------------------
@router.get(
    "/",
    response_model=HistoricalPriceListResponse,
    summary="List historical prices",
)
async def list_prices(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    sort_by: str = Query("date"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    symbol: str | None = Query(None),
    interval: str | None = Query(None),
):
    service = HistoricalPriceService(db)
    return await service.list_prices(
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
        symbol=symbol,
        interval=interval,
    )


# ---------------------------------------------------------------------------
# GET /historical-prices/symbol/{symbol}/range
# ---------------------------------------------------------------------------
@router.get(
    "/symbol/{symbol}/range",
    response_model=HistoricalPriceListResponse,
    summary="Get historical prices for a symbol within a date range",
)
async def get_prices_by_range(
    symbol: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    start_date: datetime | None = Query(None, description="Start date (ISO 8601)"),
    end_date: datetime | None = Query(None, description="End date (ISO 8601)"),
    interval: str = Query("1d", description="Time interval (e.g. 1d, 1h)"),
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=1000, description="Results per page"),
):
    service = HistoricalPriceService(db)
    return await service.list_prices(
        page=page,
        page_size=limit,
        sort_by="date",
        sort_order="asc",
        symbol=symbol,
        interval=interval,
        start_date=start_date,
        end_date=end_date,
    )


# ---------------------------------------------------------------------------
# GET /historical-prices/symbol/{symbol}
# ---------------------------------------------------------------------------
@router.get(
    "/symbol/{symbol}",
    response_model=HistoricalPriceListResponse,
    summary="Get historical prices by symbol",
)
async def get_prices_by_symbol(
    symbol: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    interval: str | None = Query(None),
):
    service = HistoricalPriceService(db)
    return await service.list_prices(
        page=page,
        page_size=page_size,
        symbol=symbol,
        interval=interval,
    )


# ---------------------------------------------------------------------------
# GET /historical-prices/stock/{stock_id}
# ---------------------------------------------------------------------------
@router.get(
    "/stock/{stock_id}",
    response_model=HistoricalPriceListResponse,
    summary="Get historical prices by stock ID",
)
async def get_prices_by_stock_id(
    stock_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=1000),
    interval: str | None = Query(None),
):
    service = HistoricalPriceService(db)
    return await service.list_prices(
        page=page,
        page_size=page_size,
        stock_id=stock_id,
        interval=interval,
    )


# ---------------------------------------------------------------------------
# GET /historical-prices/{id}
# ---------------------------------------------------------------------------
@router.get(
    "/{price_id}",
    response_model=HistoricalPriceResponse,
    summary="Get historical price by ID",
)
async def get_price_by_id(
    price_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    service = HistoricalPriceService(db)
    return await service.get_by_id(price_id)


# ---------------------------------------------------------------------------
# PUT /historical-prices/{id}
# ---------------------------------------------------------------------------
@router.put(
    "/{price_id}",
    response_model=HistoricalPriceResponse,
    summary="Update historical price",
)
async def update_price(
    price_id: str,
    update_data: HistoricalPriceUpdate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = HistoricalPriceService(db)
    return await service.update_price(price_id, update_data)


# ---------------------------------------------------------------------------
# DELETE /historical-prices/{id}
# ---------------------------------------------------------------------------
@router.delete(
    "/{price_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete historical price",
)
async def delete_price(
    price_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    service = HistoricalPriceService(db)
    return await service.delete_price(price_id)
