import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import ValidationError

from app.models.live_market import LiveMarketSnapshot

logger = logging.getLogger(__name__)

class LiveMarketRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["live_market_data"]

    async def save_snapshot(self, snapshot: LiveMarketSnapshot) -> Optional[str]:
        """
        Saves a single live market data snapshot into the database.
        Returns the string ID of the inserted document.
        """
        try:
            snapshot_dict = snapshot.model_dump(by_alias=True, exclude={"id"})
            result = await self.collection.insert_one(snapshot_dict)
            return str(result.inserted_id)
        except Exception as exc:
            logger.error("Failed to save live market snapshot for %s: %s", snapshot.symbol, str(exc))
            return None
