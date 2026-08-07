"""Stock service – business logic for stock management."""

import math

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import ConflictException, NotFoundException
from app.core.logging_config import get_logger
from app.repositories.stock_repository import StockRepository
from app.schemas.stock import StockCreate, StockListResponse, StockResponse, StockUpdate

logger = get_logger(__name__)


class StockService:
    """Orchestrates stock business logic on top of ``StockRepository``."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.repository = StockRepository(db)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _to_response(stock) -> StockResponse:
        """Convert a Stock model instance to a StockResponse schema."""
        return StockResponse(
            id=stock.id,
            symbol=stock.symbol,
            company_name=stock.company_name,
            sector=stock.sector,
            industry=stock.industry,
            exchange=stock.exchange,
            current_price=stock.current_price,
            market_cap=stock.market_cap,
            description=stock.description,
            is_active=stock.is_active,
            logo_url=stock.logo_url,
            website=stock.website,
            country=getattr(stock, "country", None),
            currency=getattr(stock, "currency", None),
            created_at=stock.created_at,
            updated_at=stock.updated_at,
        )

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------
    async def create_stock(self, stock_in: StockCreate) -> StockResponse:
        """Create a new stock after validating the symbol is unique and exists in Yahoo Finance."""
        symbol = stock_in.symbol.strip().upper()
        
        # Uniqueness check in repository
        existing = await self.repository.get_by_symbol(symbol)
        if existing:
            logger.warning("Stock creation failed: symbol '%s' already exists.", symbol)
            raise ConflictException(
                message=f"Stock with symbol '{symbol}' already exists."
            )

        # Validate with active market data provider
        from app.services.providers.orchestrator import MarketDataOrchestrator
        from fastapi import HTTPException
        provider = MarketDataOrchestrator().get_provider()
        
        try:
            summary = await provider.get_market_summary(symbol)
            canonical_symbol = summary.quote.symbol.upper()
            
            # Check if canonical symbol matches any already in DB
            if canonical_symbol != symbol:
                existing_canonical = await self.repository.get_by_symbol(canonical_symbol)
                if existing_canonical:
                    raise ConflictException(
                        message=f"Stock with symbol '{canonical_symbol}' already exists."
                    )
            
            # Auto-populate metadata from Yahoo Finance provider
            stock_in.symbol = canonical_symbol
            if not stock_in.company_name:
                stock_in.company_name = summary.company_info.company_name or canonical_symbol
            if not stock_in.sector:
                stock_in.sector = summary.company_info.sector
            if not stock_in.industry:
                stock_in.industry = summary.company_info.industry
            if not stock_in.exchange:
                stock_in.exchange = summary.company_info.exchange
            if not stock_in.current_price:
                stock_in.current_price = summary.quote.price
            if not stock_in.market_cap:
                stock_in.market_cap = summary.statistics.market_cap
            if not stock_in.website:
                # Try to guess web domain or default to Yahoo Finance page
                stock_in.website = f"https://finance.yahoo.com/quote/{canonical_symbol}"
            if not stock_in.country:
                stock_in.country = summary.company_info.country
            if not stock_in.currency:
                stock_in.currency = summary.company_info.currency
                
            # Compute a nice logo url using Clearbit if domain is extractable
            if not stock_in.logo_url and stock_in.website:
                from urllib.parse import urlparse
                parsed = urlparse(stock_in.website)
                domain = parsed.netloc.replace("www.", "")
                if domain and "yahoo.com" not in domain:
                    stock_in.logo_url = f"https://logo.clearbit.com/{domain}"
                    
        except HTTPException as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Validation failed for symbol '{symbol}': {exc.detail}"
            )
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Validation failed for symbol '{symbol}'. Ensure it is active and has data on Yahoo Finance."
            )

        stock = await self.repository.create(stock_in)
        logger.info("Stock created: %s (%s)", stock.symbol, stock.company_name)
        return self._to_response(stock)

    # ------------------------------------------------------------------
    # Get by ID
    # ------------------------------------------------------------------
    async def get_stock_by_id(self, stock_id: str) -> StockResponse:
        """Retrieve a stock by its ID or raise NotFoundException."""
        stock = await self.repository.get_by_id(stock_id)
        if not stock:
            raise NotFoundException(resource="Stock", identifier=stock_id)
        return self._to_response(stock)

    # ------------------------------------------------------------------
    # Get by Symbol
    # ------------------------------------------------------------------
    async def get_stock_by_symbol(self, symbol: str) -> StockResponse:
        """Retrieve a stock by its ticker symbol or raise NotFoundException."""
        stock = await self.repository.get_by_symbol(symbol)
        if not stock:
            raise NotFoundException(resource="Stock", identifier=symbol.upper())
        return self._to_response(stock)

    # ------------------------------------------------------------------
    # List
    # ------------------------------------------------------------------
    async def list_stocks(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "symbol",
        sort_order: str = "asc",
        sector: str | None = None,
        industry: str | None = None,
        exchange: str | None = None,
        is_active: bool | None = None,
        search: str | None = None,
    ) -> StockListResponse:
        """Return a paginated list of stocks."""
        stocks, total = await self.repository.list_stocks(
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

        total_pages = math.ceil(total / page_size) if page_size else 0

        return StockListResponse(
            stocks=[self._to_response(s) for s in stocks],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------
    async def update_stock(
        self, stock_id: str, stock_update: StockUpdate
    ) -> StockResponse:
        """Update a stock by ID or raise NotFoundException."""
        # Ensure the stock exists first.
        existing = await self.repository.get_by_id(stock_id)
        if not existing:
            raise NotFoundException(resource="Stock", identifier=stock_id)

        updated = await self.repository.update(stock_id, stock_update)
        if not updated:
            raise NotFoundException(resource="Stock", identifier=stock_id)

        logger.info("Stock updated: %s", updated.symbol)
        return self._to_response(updated)

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------
    async def delete_stock(self, stock_id: str) -> dict:
        """Delete a stock by ID or raise NotFoundException."""
        existing = await self.repository.get_by_id(stock_id)
        if not existing:
            raise NotFoundException(resource="Stock", identifier=stock_id)

        deleted = await self.repository.delete(stock_id)
        if not deleted:
            raise NotFoundException(resource="Stock", identifier=stock_id)

        logger.info("Stock deleted: %s (%s)", existing.symbol, stock_id)
        return {"message": f"Stock '{existing.symbol}' deleted successfully."}
