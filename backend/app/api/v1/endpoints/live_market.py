from typing import Annotated

from fastapi import APIRouter, Depends, Path
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.v1.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.market_data import (
    CompanyInformationResponse,
    LiveMarketQuoteResponse,
    MarketStatisticsResponse,
    MarketSummaryResponse,
)
from app.services.live_market_service import LiveMarketService

router = APIRouter()


@router.get("/{symbol}", response_model=LiveMarketQuoteResponse, summary="Get Live Market Quote")
async def get_live_quote(
    symbol: Annotated[str, Path(..., description="Stock ticker symbol (e.g. AAPL)")],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Returns the latest market quote for a given symbol.
    Requires authentication.
    """
    service = LiveMarketService(db)
    return await service.get_live_quote(symbol)


@router.get("/{symbol}/company", response_model=CompanyInformationResponse, summary="Get Company Information")
async def get_company_info(
    symbol: Annotated[str, Path(..., description="Stock ticker symbol (e.g. AAPL)")],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Returns detailed company information for a given symbol.
    Requires authentication.
    """
    service = LiveMarketService(db)
    return await service.get_company_info(symbol)


@router.get("/{symbol}/statistics", response_model=MarketStatisticsResponse, summary="Get Market Statistics")
async def get_market_statistics(
    symbol: Annotated[str, Path(..., description="Stock ticker symbol (e.g. AAPL)")],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Returns live market statistics for a given symbol.
    Requires authentication.
    """
    service = LiveMarketService(db)
    return await service.get_market_statistics(symbol)


@router.get("/{symbol}/summary", response_model=MarketSummaryResponse, summary="Get Complete Market Summary")
async def get_market_summary(
    symbol: Annotated[str, Path(..., description="Stock ticker symbol (e.g. AAPL)")],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Returns a complete market summary including quote, company info, and statistics.
    Requires authentication.
    """
    service = LiveMarketService(db)
    return await service.get_market_summary(symbol)
