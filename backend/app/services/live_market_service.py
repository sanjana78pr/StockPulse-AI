import logging
from typing import Optional
from datetime import datetime

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.live_market import LiveMarketSnapshot
from app.repositories.live_market_repository import LiveMarketRepository
from app.repositories.stock_repository import StockRepository
from app.schemas.market_data import (
    CompanyInformationResponse,
    LiveMarketQuoteResponse,
    MarketStatisticsResponse,
    MarketSummaryResponse,
)
from app.services.providers.orchestrator import MarketDataOrchestrator

logger = logging.getLogger(__name__)

# Lightweight in-memory cache for live responses
# Cache structure: { "symbol_quote": {"data": ..., "timestamp": ...} }
_cache = {}
CACHE_TTL_SECONDS = 30


class LiveMarketService:
    """
    Service layer for live market data. 
    Coordinates validation, provider calls, caching, and snapshot storage.
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.stock_repo = StockRepository(db)
        self.live_repo = LiveMarketRepository(db)
        self.orchestrator = MarketDataOrchestrator()

    async def _validate_symbol(self, symbol: str):
        """
        Validates if a stock exists in the database.
        Raises 404 if not found.
        """
        stock = await self.stock_repo.get_by_symbol(symbol.upper())
        if not stock:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Stock symbol {symbol} is not tracked in the database."
            )

    def _get_from_cache(self, cache_key: str):
        """Retrieve from cache if not expired."""
        if cache_key in _cache:
            entry = _cache[cache_key]
            age = (datetime.utcnow() - entry["timestamp"]).total_seconds()
            if age < CACHE_TTL_SECONDS:
                return entry["data"]
        return None

    def _set_cache(self, cache_key: str, data):
        """Set cache entry."""
        _cache[cache_key] = {
            "data": data,
            "timestamp": datetime.utcnow()
        }

    async def get_live_quote(self, symbol: str) -> LiveMarketQuoteResponse:
        symbol = symbol.upper()
        await self._validate_symbol(symbol)
        
        cache_key = f"{symbol}_quote"
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            return cached_data

        provider = self.orchestrator.get_provider()
        quote = await provider.get_live_quote(symbol)
        
        # Cache response
        self._set_cache(cache_key, quote)

        # Asynchronously store snapshot
        snapshot = LiveMarketSnapshot(
            symbol=quote.symbol,
            provider=quote.provider,
            price=quote.price,
            open=quote.open,
            high=quote.high,
            low=quote.low,
            volume=quote.volume,
            timestamp=quote.timestamp,
        )
        # Store in background (or await if preferred, we await here for simplicity but it's fast)
        await self.live_repo.save_snapshot(snapshot)

        return quote

    async def get_company_info(self, symbol: str) -> CompanyInformationResponse:
        symbol = symbol.upper()
        await self._validate_symbol(symbol)
        
        cache_key = f"{symbol}_company"
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            return cached_data
            
        provider = self.orchestrator.get_provider()
        info = await provider.get_company_info(symbol)
        self._set_cache(cache_key, info)
        return info

    async def get_market_statistics(self, symbol: str) -> MarketStatisticsResponse:
        symbol = symbol.upper()
        await self._validate_symbol(symbol)
        
        cache_key = f"{symbol}_stats"
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            return cached_data
            
        provider = self.orchestrator.get_provider()
        stats = await provider.get_market_statistics(symbol)
        self._set_cache(cache_key, stats)
        return stats

    async def get_market_summary(self, symbol: str) -> MarketSummaryResponse:
        symbol = symbol.upper()
        await self._validate_symbol(symbol)
        
        cache_key = f"{symbol}_summary"
        cached_data = self._get_from_cache(cache_key)
        if cached_data:
            return cached_data
            
        provider = self.orchestrator.get_provider()
        summary = await provider.get_market_summary(symbol)
        self._set_cache(cache_key, summary)
        
        # Snapshot the quote from the summary
        snapshot = LiveMarketSnapshot(
            symbol=summary.quote.symbol,
            provider=summary.quote.provider,
            price=summary.quote.price,
            open=summary.quote.open,
            high=summary.quote.high,
            low=summary.quote.low,
            volume=summary.quote.volume,
            market_cap=summary.statistics.market_cap,
            timestamp=summary.quote.timestamp,
        )
        await self.live_repo.save_snapshot(snapshot)

        return summary
