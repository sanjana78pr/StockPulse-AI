"""Transaction repository – data access layer for the transactions collection."""

import re
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate


class TransactionRepository:
    """Encapsulates all MongoDB operations for the ``transactions`` collection."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["transactions"]

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------
    async def create(
        self, user_id: str, transaction_in: TransactionCreate, total_amount: float
    ) -> Transaction:
        """Insert a new transaction document and return the created Transaction object."""
        now = datetime.now(timezone.utc)
        doc = {
            "user_id": user_id,
            "portfolio_id": transaction_in.portfolio_id,
            "stock_symbol": transaction_in.stock_symbol.upper(),
            "transaction_type": transaction_in.transaction_type.upper(),
            "quantity": float(transaction_in.quantity),
            "price_per_share": float(transaction_in.price_per_share),
            "total_amount": float(total_amount),
            "fees": float(transaction_in.fees),
            "notes": transaction_in.notes,
            "transaction_date": transaction_in.transaction_date or now,
            "created_at": now,
            "updated_at": now,
        }
        result = await self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return Transaction(**doc)

    # ------------------------------------------------------------------
    # Read – by ID
    # ------------------------------------------------------------------
    async def get_by_id(self, transaction_id: str) -> Transaction | None:
        """Retrieve a transaction by its ObjectId string."""
        if not ObjectId.is_valid(transaction_id):
            return None
        doc = await self.collection.find_one({"_id": ObjectId(transaction_id)})
        return Transaction(**doc) if doc else None

    # ------------------------------------------------------------------
    # List with pagination, sorting, filtering, and search
    # ------------------------------------------------------------------
    async def list_transactions(
        self,
        *,
        user_id: str,
        portfolio_id: str | None = None,
        transaction_type: str | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "transaction_date",
        sort_order: str = "desc",
    ) -> tuple[list[Transaction], int]:
        """
        Return a paginated, sorted, filtered list of transactions for a user.

        Returns:
            A tuple of (list[Transaction], total_count).
        """
        query: dict = {"user_id": user_id}

        if portfolio_id:
            query["portfolio_id"] = portfolio_id

        if transaction_type:
            query["transaction_type"] = transaction_type.upper()

        if search:
            escaped = re.escape(search)
            query["stock_symbol"] = {"$regex": escaped, "$options": "i"}

        allowed_sort_fields = {
            "transaction_date",
            "quantity",
            "price_per_share",
            "total_amount",
            "stock_symbol",
            "created_at",
            "updated_at",
        }
        if sort_by not in allowed_sort_fields:
            sort_by = "transaction_date"

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
        return [Transaction(**doc) for doc in docs], total
