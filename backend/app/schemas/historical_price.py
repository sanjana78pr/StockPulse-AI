"""Historical Price schemas for request/response validation."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


IntervalType = Literal["1m", "5m", "15m", "30m", "1h", "1d", "1wk", "1mo"]
ValidationLevel = Literal["low", "medium", "high"]


class HistoricalPriceBase(BaseModel):
    """Shared fields for historical prices."""
    
    symbol: str = Field(..., min_length=1, max_length=20, examples=["AAPL"])
    date: datetime = Field(..., description="Date and time of the price record.")
    open_price: float = Field(..., examples=[150.0])
    high_price: float = Field(..., examples=[155.0])
    low_price: float = Field(..., examples=[149.0])
    close_price: float = Field(..., examples=[154.0])
    adjusted_close: float = Field(..., examples=[154.0])
    volume: int = Field(..., examples=[1000000])
    source: str = Field("manual", max_length=100, examples=["yahoo_finance", "manual"])
    interval: IntervalType = Field("1d", examples=["1d"])


class HistoricalPriceCreate(HistoricalPriceBase):
    """Schema for creating a new historical price."""
    pass


class HistoricalPriceUpdate(BaseModel):
    """Schema for updating an existing historical price."""
    
    open_price: float | None = Field(None)
    high_price: float | None = Field(None)
    low_price: float | None = Field(None)
    close_price: float | None = Field(None)
    adjusted_close: float | None = Field(None)
    volume: int | None = Field(None)
    source: str | None = Field(None, max_length=100)


class HistoricalPriceResponse(HistoricalPriceBase):
    """Single historical price response."""
    
    id: str
    stock_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HistoricalPriceListResponse(BaseModel):
    """Paginated list response."""
    
    data: list[HistoricalPriceResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class BulkInsertResult(BaseModel):
    """Result of a bulk insert operation."""
    
    total_received: int
    inserted: int
    skipped_duplicates: int
    errors: list[str] = []
