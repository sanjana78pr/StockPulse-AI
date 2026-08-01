"""Transaction schemas for request/response validation."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Allowed values
# ---------------------------------------------------------------------------
TransactionType = Literal["BUY", "SELL"]


# ---------------------------------------------------------------------------
# Create (BUY or SELL)
# ---------------------------------------------------------------------------
class TransactionCreate(BaseModel):
    """Schema for creating a new BUY or SELL transaction."""

    portfolio_id: str = Field(..., examples=["64a1b2c3d4e5f6a7b8c9d0e1"])
    stock_symbol: str = Field(..., min_length=1, max_length=20, examples=["AAPL"])
    transaction_type: TransactionType = Field(..., examples=["BUY"])
    quantity: float = Field(..., gt=0, examples=[10.0])
    price_per_share: float = Field(..., gt=0, examples=[175.50])
    fees: float = Field(0.0, ge=0, examples=[1.99])
    notes: str | None = Field(None, max_length=500, examples=["Long-term hold"])
    transaction_date: datetime | None = Field(
        None, examples=["2024-01-15T10:30:00Z"]
    )

    @field_validator("stock_symbol", mode="before")
    @classmethod
    def uppercase_symbol(cls, v: str) -> str:
        return v.upper().strip()


# ---------------------------------------------------------------------------
# Response (single transaction)
# ---------------------------------------------------------------------------
class TransactionResponse(BaseModel):
    """Single transaction returned by the API."""

    id: str
    user_id: str
    portfolio_id: str
    stock_symbol: str
    transaction_type: str
    quantity: float
    price_per_share: float
    total_amount: float
    fees: float
    notes: str | None
    transaction_date: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# List Response (paginated)
# ---------------------------------------------------------------------------
class TransactionListResponse(BaseModel):
    """Paginated list of transactions."""

    transactions: list[TransactionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
