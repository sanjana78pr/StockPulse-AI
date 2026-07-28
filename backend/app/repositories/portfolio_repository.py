"""Portfolio repository – data access layer for the portfolios collection."""

import math
import re
from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.portfolio import Portfolio
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate


class PortfolioRepository:
    """Encapsulates all MongoDB operations for the ``portfolios`` collection."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["portfolios"]

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------
    async def create(self, user_id: str, portfolio_in: PortfolioCreate) -> Portfolio:
        """Insert a new portfolio document and return the created Portfolio object."""
        now = datetime.now(timezone.utc)
        doc = {
            "user_id": user_id,
            "portfolio_name": portfolio_in.portfolio_name,
            "description": portfolio_in.description,
            "investment_goal": portfolio_in.investment_goal,
            "risk_level": portfolio_in.risk_level,
            "currency": portfolio_in.currency.upper(),
            "initial_balance": portfolio_in.initial_balance,
            "current_value": portfolio_in.initial_balance,
            "total_profit_loss": 0.0,
            "total_profit_loss_percentage": 0.0,
            "is_default": portfolio_in.is_default,
            "created_at": now,
            "updated_at": now,
        }
        result = await self.collection.insert_one(doc)
        doc["_id"] = result.inserted_id
        return Portfolio(**doc)

    # ------------------------------------------------------------------
    # Read – by ID
    # ------------------------------------------------------------------
    async def get_by_id(self, portfolio_id: str) -> Portfolio | None:
        """Retrieve a portfolio by its ObjectId string."""
        if not ObjectId.is_valid(portfolio_id):
            return None
        doc = await self.collection.find_one({"_id": ObjectId(portfolio_id)})
        return Portfolio(**doc) if doc else None

    # ------------------------------------------------------------------
    # Read – by user and name (for duplicate checking)
    # ------------------------------------------------------------------
    async def get_by_user_and_name(
        self, user_id: str, portfolio_name: str
    ) -> Portfolio | None:
        """Retrieve a portfolio by user_id and portfolio_name."""
        doc = await self.collection.find_one(
            {"user_id": user_id, "portfolio_name": portfolio_name}
        )
        return Portfolio(**doc) if doc else None

    # ------------------------------------------------------------------
    # List with pagination, sorting, filtering, search
    # ------------------------------------------------------------------
    async def list_portfolios(
        self,
        *,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        risk_level: str | None = None,
        is_default: bool | None = None,
        search: str | None = None,
    ) -> tuple[list[Portfolio], int]:
        """
        Return a paginated, sorted, filtered list of portfolios for a user.

        Returns:
            A tuple of (list[Portfolio], total_count).
        """
        query: dict = {"user_id": user_id}

        if risk_level:
            query["risk_level"] = risk_level
        if is_default is not None:
            query["is_default"] = is_default

        if search:
            escaped = re.escape(search)
            query["$or"] = [
                {"portfolio_name": {"$regex": escaped, "$options": "i"}},
                {"description": {"$regex": escaped, "$options": "i"}},
            ]

        allowed_sort_fields = {
            "portfolio_name", "created_at", "updated_at",
            "initial_balance", "current_value", "total_profit_loss",
        }
        if sort_by not in allowed_sort_fields:
            sort_by = "created_at"

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
        return [Portfolio(**doc) for doc in docs], total

    # ------------------------------------------------------------------
    # Unset existing default portfolio for user
    # ------------------------------------------------------------------
    async def unset_default_for_user(self, user_id: str) -> None:
        """Remove the is_default flag from all portfolios of a user."""
        await self.collection.update_many(
            {"user_id": user_id, "is_default": True},
            {"$set": {"is_default": False, "updated_at": datetime.now(timezone.utc)}},
        )

    # ------------------------------------------------------------------
    # Update
    # ------------------------------------------------------------------
    async def update(
        self, portfolio_id: str, update_in: PortfolioUpdate
    ) -> Portfolio | None:
        """Update a portfolio document and return the updated Portfolio object."""
        if not ObjectId.is_valid(portfolio_id):
            return None

        update_data = update_in.model_dump(exclude_unset=True)
        if not update_data:
            return await self.get_by_id(portfolio_id)

        if "currency" in update_data and update_data["currency"]:
            update_data["currency"] = update_data["currency"].upper()

        update_data["updated_at"] = datetime.now(timezone.utc)

        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(portfolio_id)},
            {"$set": update_data},
            return_document=True,
        )
        return Portfolio(**result) if result else None

    # ------------------------------------------------------------------
    # Delete
    # ------------------------------------------------------------------
    async def delete(self, portfolio_id: str) -> bool:
        """Delete a portfolio document. Returns True if deleted."""
        if not ObjectId.is_valid(portfolio_id):
            return False
        result = await self.collection.delete_one({"_id": ObjectId(portfolio_id)})
        return result.deleted_count > 0
