"""Stock repository – data access layer for the stocks collection."""

import math
import re
from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.stock import Stock
from app.schemas.stock import StockCreate, StockUpdate


class StockRepository:
    """Encapsulates all MongoDB operations for the ``stocks`` collection."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["stocks"]

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------
    async def create(self, stock_in: StockCreate) -> Stock:
        """Insert a new stock document and return the created Stock object."""
        now = datetime.now(timezone.utc)
        stock_dict = {
            "symbol": stock_in.symbol.upper(),
            "company_name": stock_in.company_name,
            "sector": stock_in.sector,
            "industry": stock_in.industry,
            "exchange": stock_in.exchange,
            "current_price": stock_in.current_price,
            "market_cap": stock_in.market_cap,
            "description": stock_in.description,
            "is_active": True,
            "logo_url": stock_in.logo_url,
            "website": stock_in.website,
            "country": stock_in.country,
            "currency": stock_in.currency,
            "created_at": now,
            "updated_at": now,
        }
        result = await self.collection.insert_one(stock_dict)
        stock_dict["_id"] = result.inserted_id
        return Stock(**stock_dict)

    # ------------------------------------------------------------------
    # Read – by ID
    # ------------------------------------------------------------------
    async def get_by_id(self, stock_id: str) -> Stock | None:
        """Retrieve a stock by its ObjectId string."""
        if not ObjectId.is_valid(stock_id):
            return None
        doc = await self.collection.find_one({"_id": ObjectId(stock_id)})
        return Stock(**doc) if doc else None

    # ------------------------------------------------------------------
    # Read – by Symbol
    # ------------------------------------------------------------------
    async def get_by_symbol(self, symbol: str) -> Stock | None:
        """Retrieve a stock by its ticker symbol (case-insensitive)."""
        doc = await self.collection.find_one(
            {"symbol": symbol.upper()}
        )
        return Stock(**doc) if doc else None

    # ------------------------------------------------------------------
    # List with pagination, sorting, filtering, and search
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
    ) -> tuple[list[Stock], int]:
        """
        Return a paginated, sorted, filtered list of stocks.

        Args:
            page:       1-based page number.
            page_size:  Number of results per page.
            sort_by:    Field name to sort by.
            sort_order: ``asc`` or ``desc``.
            sector:     Filter by sector (exact match).
            industry:   Filter by industry (exact match).
            exchange:   Filter by exchange (exact match).
            is_active:  Filter by active status.
            search:     Case-insensitive substring search on symbol and company_name.

        Returns:
            A tuple of (list[Stock], total_count).
        """
        query: dict = {}

        # --- Filters ---
        if sector:
            query["sector"] = sector
        if industry:
            query["industry"] = industry
        if exchange:
            query["exchange"] = exchange
        if is_active is not None:
            query["is_active"] = is_active

        # --- Search ---
        if search:
            escaped = re.escape(search)
            query["$or"] = [
                {"symbol": {"$regex": escaped, "$options": "i"}},
                {"company_name": {"$regex": escaped, "$options": "i"}},
            ]

        # --- Sorting ---
        allowed_sort_fields = {
            "symbol", "company_name", "sector", "industry",
            "exchange", "current_price", "market_cap",
            "created_at", "updated_at",
        }
        if sort_by not in allowed_sort_fields:
            sort_by = "symbol"

        sort_direction = 1 if sort_order == "asc" else -1

        # --- Total count ---
        total = await self.collection.count_documents(query)

        # --- Paginated results ---
        skip = (page - 1) * page_size
        cursor = (
            self.collection.find(query)
            .sort(sort_by, sort_direction)
            .skip(skip)
            .limit(page_size)
        )
        docs = await cursor.to_list(length=page_size)
        stocks = [Stock(**doc) for doc in docs]

        return stocks, total

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------
    async def update(self, stock_id: str, stock_update: StockUpdate) -> Stock | None:
        """
        Update a stock document and return the updated Stock object.

        Only fields explicitly set (non-None) in ``stock_update`` are written.
        """
        if not ObjectId.is_valid(stock_id):
            return None

        update_data = stock_update.model_dump(exclude_unset=True)
        if not update_data:
            # Nothing to update – return the current document.
            return await self.get_by_id(stock_id)

        update_data["updated_at"] = datetime.now(timezone.utc)

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(stock_id)},
            {"$set": update_data},
            return_document=True,
        )
        return Stock(**result) if result else None

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------
    async def delete(self, stock_id: str) -> bool:
        """Delete a stock document. Returns True if a document was deleted."""
        if not ObjectId.is_valid(stock_id):
            return False
        result = await self.collection.delete_one({"_id": ObjectId(stock_id)})
        return result.deleted_count > 0
