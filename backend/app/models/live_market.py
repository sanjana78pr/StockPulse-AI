from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

class LiveMarketSnapshot(BaseModel):
    """
    MongoDB Model for Live Market Data Snapshot.
    Stored in `live_market_data` collection.
    """
    id: Optional[str] = Field(alias="_id", default=None)
    symbol: str
    provider: str
    price: float
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    volume: Optional[int] = None
    market_cap: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
