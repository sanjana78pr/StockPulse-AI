"""User repository."""

from datetime import datetime, timezone

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.security import get_password_hash
from app.models.user import User
from app.schemas.user import UserCreate


class UserRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["users"]

    async def get_by_id(self, user_id: str) -> User | None:
        """Retrieve a user by their ObjectId string."""
        if not ObjectId.is_valid(user_id):
            return None
        doc = await self.collection.find_one({"_id": ObjectId(user_id)})
        return User(**doc) if doc else None

    async def get_by_email(self, email: str) -> User | None:
        """Retrieve a user by their email address."""
        doc = await self.collection.find_one({"email": email})
        return User(**doc) if doc else None

    async def get_by_username(self, username: str) -> User | None:
        """Retrieve a user by their username."""
        doc = await self.collection.find_one({"username": username})
        return User(**doc) if doc else None

    async def create(self, user_in: UserCreate) -> User:
        """Insert a new user document into the users collection."""
        now = datetime.now(timezone.utc)
        user_dict = {
            "email": user_in.email,
            "username": user_in.username,
            "full_name": user_in.full_name,
            "hashed_password": get_password_hash(user_in.password),
            "is_active": True,
            "role": "User",
            "created_at": now,
            "updated_at": now,
        }
        result = await self.collection.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id
        return User(**user_dict)
