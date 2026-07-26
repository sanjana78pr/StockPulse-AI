"""Historical Price service – business logic for historical market data."""

import math

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import BadRequestException, ConflictException, NotFoundException
from app.core.logging_config import get_logger
from app.repositories.historical_price_repository import HistoricalPriceRepository
from app.repositories.stock_repository import StockRepository
from app.schemas.historical_price import (
    BulkInsertResult,
    HistoricalPriceCreate,
    HistoricalPriceListResponse,
    HistoricalPriceResponse,
    HistoricalPriceUpdate,
)

logger = get_logger(__name__)


class HistoricalPriceService:
    """Orchestrates historical price business logic."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.repository = HistoricalPriceRepository(db)
        self.stock_repo = StockRepository(db)

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    @staticmethod
    def _to_response(price) -> HistoricalPriceResponse:
        """Convert a HistoricalPrice model instance to a response schema."""
        return HistoricalPriceResponse(
            id=price.id,
            stock_id=price.stock_id,
            symbol=price.symbol,
            date=price.date,
            open_price=price.open_price,
            high_price=price.high_price,
            low_price=price.low_price,
            close_price=price.close_price,
            adjusted_close=price.adjusted_close,
            volume=price.volume,
            source=price.source,
            interval=price.interval,
            created_at=price.created_at,
            updated_at=price.updated_at,
        )

    def _validate_price(self, price: HistoricalPriceCreate, level: str) -> None:
        """
        Validate prices based on the requested validation level.
        levels: low, medium, high.
        """
        if level == "low":
            return  # Minimal validation provided by Pydantic is sufficient

        if level in ("medium", "high"):
            if price.open_price < 0 or price.close_price < 0 or price.high_price < 0 or price.low_price < 0:
                raise BadRequestException("Prices cannot be negative.")
            if price.volume < 0:
                raise BadRequestException("Volume cannot be negative.")

        if level == "high":
            if price.high_price < price.open_price or price.high_price < price.close_price or price.high_price < price.low_price:
                raise BadRequestException(f"High price {price.high_price} must be the highest value.")
            if price.low_price > price.open_price or price.low_price > price.close_price or price.low_price > price.high_price:
                raise BadRequestException(f"Low price {price.low_price} must be the lowest value.")

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------
    async def create_price(self, price_in: HistoricalPriceCreate, validation_level: str = "high") -> HistoricalPriceResponse:
        """Create a single historical price record."""
        # 1. Validation
        self._validate_price(price_in, validation_level)

        # 2. Check stock exists
        stock = await self.stock_repo.get_by_symbol(price_in.symbol)
        if not stock:
            raise NotFoundException(resource="Stock", identifier=price_in.symbol)

        # 3. Check duplicate
        exists = await self.repository.exists(price_in.symbol, price_in.interval, price_in.date)
        if exists:
            raise ConflictException(f"Record for {price_in.symbol} on {price_in.date.isoformat()} ({price_in.interval}) already exists.")

        # 4. Create
        record = await self.repository.create(price_in, stock.id)
        logger.info("Historical price created for %s on %s", record.symbol, record.date)
        return self._to_response(record)

    # ------------------------------------------------------------------
    # Bulk Create
    # ------------------------------------------------------------------
    async def bulk_create_prices(
        self, prices_in: list[HistoricalPriceCreate], validation_level: str = "high"
    ) -> BulkInsertResult:
        """Batch insert historical records, skipping duplicates."""
        if not prices_in:
            return BulkInsertResult(total_received=0, inserted=0, skipped_duplicates=0, errors=[])

        errors = []
        valid_prices = []

        # Find all requested symbols and their stock IDs
        symbols = {p.symbol.upper() for p in prices_in}
        stock_map = {}
        for sym in symbols:
            stock = await self.stock_repo.get_by_symbol(sym)
            if stock:
                stock_map[sym] = stock.id
            else:
                errors.append(f"Stock '{sym}' not found in database.")

        for p in prices_in:
            if p.symbol.upper() not in stock_map:
                continue
            
            try:
                self._validate_price(p, validation_level)
                valid_prices.append(p)
            except BadRequestException as e:
                errors.append(f"Validation failed for {p.symbol} on {p.date}: {e.message}")

        if not valid_prices:
            return BulkInsertResult(
                total_received=len(prices_in),
                inserted=0,
                skipped_duplicates=0,
                errors=errors
            )

        inserted, skipped = await self.repository.bulk_create(valid_prices, stock_map)
        
        logger.info("Bulk insert complete: %d received, %d inserted, %d skipped duplicates", len(prices_in), inserted, skipped)
        return BulkInsertResult(
            total_received=len(prices_in),
            inserted=inserted,
            skipped_duplicates=skipped,
            errors=errors
        )

    # ------------------------------------------------------------------
    # Get by ID
    # ------------------------------------------------------------------
    async def get_by_id(self, price_id: str) -> HistoricalPriceResponse:
        record = await self.repository.get_by_id(price_id)
        if not record:
            raise NotFoundException(resource="HistoricalPrice", identifier=price_id)
        return self._to_response(record)

    # ------------------------------------------------------------------
    # List
    # ------------------------------------------------------------------
    async def list_prices(
        self,
        *,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "date",
        sort_order: str = "desc",
        symbol: str | None = None,
        stock_id: str | None = None,
        interval: str | None = None,
        start_date=None,
        end_date=None,
    ) -> HistoricalPriceListResponse:
        records, total = await self.repository.list_prices(
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order,
            symbol=symbol,
            stock_id=stock_id,
            interval=interval,
            start_date=start_date,
            end_date=end_date,
        )

        total_pages = math.ceil(total / page_size) if page_size else 0

        return HistoricalPriceListResponse(
            data=[self._to_response(r) for r in records],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------
    async def update_price(self, price_id: str, update_data: HistoricalPriceUpdate) -> HistoricalPriceResponse:
        updated = await self.repository.update(price_id, update_data)
        if not updated:
            raise NotFoundException(resource="HistoricalPrice", identifier=price_id)
        return self._to_response(updated)

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------
    async def delete_price(self, price_id: str) -> dict:
        deleted = await self.repository.delete(price_id)
        if not deleted:
            raise NotFoundException(resource="HistoricalPrice", identifier=price_id)
        return {"message": "Record deleted successfully."}
