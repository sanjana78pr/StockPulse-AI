"""HistoricalPrice repository – data access layer for the historical_prices collection."""

import re
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import BulkWriteError

from app.models.historical_price import HistoricalPrice
from app.schemas.historical_price import HistoricalPriceCreate, HistoricalPriceUpdate


class HistoricalPriceRepository:
    """Encapsulates all MongoDB operations for the ``historical_prices`` collection."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["historical_prices"]

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------
    async def create(self, price_in: HistoricalPriceCreate, stock_id: str) -> HistoricalPrice:
        """Insert a new historical price document and return it."""
        now = datetime.now(timezone.utc)
        price_dict = price_in.model_dump()
        price_dict.update({
            "stock_id": stock_id,
            "created_at": now,
            "updated_at": now,
        })
        result = await self.collection.insert_one(price_dict)
        price_dict["_id"] = result.inserted_id
        return HistoricalPrice(**price_dict)

    # ------------------------------------------------------------------
    # Bulk Create
    # ------------------------------------------------------------------
    async def bulk_create(self, prices_in: list[HistoricalPriceCreate], stock_id_map: dict[str, str]) -> tuple[int, int]:
        """
        Insert multiple records efficiently.
        Returns a tuple of (inserted_count, skipped_duplicate_count).
        Uses unordered insert to continue inserting even if duplicates are found.
        """
        if not prices_in:
            return 0, 0

        now = datetime.now(timezone.utc)
        documents = []
        for p in prices_in:
            doc = p.model_dump()
            doc["stock_id"] = stock_id_map.get(p.symbol.upper(), "")
            doc["created_at"] = now
            doc["updated_at"] = now
            documents.append(doc)

        inserted_count = 0
        skipped_count = 0

        try:
            # ordered=False allows MongoDB to process the remaining inserts even if some fail due to duplicate keys
            result = await self.collection.insert_many(documents, ordered=False)
            inserted_count = len(result.inserted_ids)
        except BulkWriteError as bwe:
            # Catch duplicates (code 11000)
            inserted_count = bwe.details.get("nInserted", 0)
            for err in bwe.details.get("writeErrors", []):
                if err.get("code") == 11000:
                    skipped_count += 1
                else:
                    # Reraise if it's not a duplicate key error
                    raise bwe

        return inserted_count, skipped_count

    # ------------------------------------------------------------------
    # Exists Check
    # ------------------------------------------------------------------
    async def exists(self, symbol: str, interval: str, date_val: datetime) -> bool:
        """Check if a historical record already exists for the given symbol, interval, and date."""
        count = await self.collection.count_documents({
            "symbol": symbol.upper(),
            "interval": interval,
            "date": date_val
        }, limit=1)
        return count > 0

    # ------------------------------------------------------------------
    # Read – by ID
    # ------------------------------------------------------------------
    async def get_by_id(self, price_id: str) -> HistoricalPrice | None:
        """Retrieve a record by its ObjectId string."""
        if not ObjectId.is_valid(price_id):
            return None
        doc = await self.collection.find_one({"_id": ObjectId(price_id)})
        return HistoricalPrice(**doc) if doc else None

    # ------------------------------------------------------------------
    # Read – List / Search / Range
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
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> tuple[list[HistoricalPrice], int]:
        """
        Return a paginated, sorted, filtered list of historical prices.
        """
        query: dict[str, Any] = {}

        if symbol:
            query["symbol"] = symbol.upper()
        if stock_id:
            query["stock_id"] = stock_id
        if interval:
            query["interval"] = interval

        # Date range filtering
        if start_date or end_date:
            date_query: dict[str, Any] = {}
            if start_date:
                date_query["$gte"] = start_date
            if end_date:
                date_query["$lte"] = end_date
            query["date"] = date_query

        # Sorting
        allowed_sort_fields = {"date", "symbol", "close_price", "volume", "created_at"}
        if sort_by not in allowed_sort_fields:
            sort_by = "date"

        sort_direction = 1 if sort_order == "asc" else -1

        total = await self.collection.count_documents(query)

        skip = (page - 1) * page_size
        cursor = (
            self.collection.find(query)
            .sort(sort_by, sort_direction)
            .skip(skip)
            .limit(page_size)
        )
        docs = await cursor.to_list(length=page_size)
        prices = [HistoricalPrice(**doc) for doc in docs]

        return prices, total

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------
    async def update(self, price_id: str, price_update: HistoricalPriceUpdate) -> HistoricalPrice | None:
        """Update a historical price record."""
        if not ObjectId.is_valid(price_id):
            return None

        update_data = price_update.model_dump(exclude_unset=True)
        if not update_data:
            return await self.get_by_id(price_id)

        update_data["updated_at"] = datetime.now(timezone.utc)

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(price_id)},
            {"$set": update_data},
            return_document=True,
        )
        return HistoricalPrice(**result) if result else None

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------
    async def delete(self, price_id: str) -> bool:
        """Delete a record. Returns True if a document was deleted."""
        if not ObjectId.is_valid(price_id):
            return False
        result = await self.collection.delete_one({"_id": ObjectId(price_id)})
        return result.deleted_count > 0
