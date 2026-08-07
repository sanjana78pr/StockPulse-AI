"""Stock schemas for request/response validation."""

from datetime import datetime

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------
class StockBase(BaseModel):
    """Shared fields across create, update, and response schemas."""

    company_name: str | None = Field(None, max_length=255, examples=["Apple Inc."])
    sector: str | None = Field(None, max_length=100, examples=["Technology"])
    industry: str | None = Field(None, max_length=100, examples=["Consumer Electronics"])
    exchange: str | None = Field(None, max_length=50, examples=["NASDAQ"])
    current_price: float | None = Field(None, ge=0, examples=[150.25])
    market_cap: float | None = Field(None, ge=0, examples=[2500000000000])
    description: str | None = Field(None, max_length=2000)
    logo_url: str | None = Field(None, max_length=500)
    website: str | None = Field(None, max_length=500)
    country: str | None = Field(None, max_length=100, examples=["United States"])
    currency: str | None = Field(None, max_length=20, examples=["USD"])


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------
class StockCreate(StockBase):
    """Schema for creating a new stock."""

    symbol: str = Field(
        ...,
        min_length=1,
        max_length=20,
        pattern=r"^[A-Z0-9.\-]+$",
        examples=["AAPL"],
        description="Ticker symbol (uppercase letters, digits, dots, hyphens).",
    )


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------
class StockUpdate(BaseModel):
    """Schema for updating an existing stock. All fields are optional."""

    company_name: str | None = Field(None, min_length=1, max_length=255)
    sector: str | None = Field(None, max_length=100)
    industry: str | None = Field(None, max_length=100)
    exchange: str | None = Field(None, max_length=50)
    current_price: float | None = Field(None, ge=0)
    market_cap: float | None = Field(None, ge=0)
    description: str | None = Field(None, max_length=2000)
    is_active: bool | None = None
    logo_url: str | None = Field(None, max_length=500)
    website: str | None = Field(None, max_length=500)
    country: str | None = Field(None, max_length=100)
    currency: str | None = Field(None, max_length=20)


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------
class StockResponse(StockBase):
    """Single stock response returned by the API."""

    id: str
    symbol: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# List Response
# ---------------------------------------------------------------------------
class StockListResponse(BaseModel):
    """Paginated list of stocks."""

    stocks: list[StockResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ---------------------------------------------------------------------------
# External Search Response
# ---------------------------------------------------------------------------
class StockExternalSearchResponse(BaseModel):
    """Search result from external provider."""

    symbol: str
    company_name: str
    exchange: str | None = None
    country: str | None = None
    quote_type: str | None = None
