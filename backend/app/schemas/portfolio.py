"""Portfolio schemas for request/response validation."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Allowed values
# ---------------------------------------------------------------------------
RiskLevel = Literal["low", "medium", "high", "very_high"]


# ---------------------------------------------------------------------------
# Base
# ---------------------------------------------------------------------------
class PortfolioBase(BaseModel):
    """Shared fields across create, update, and response schemas."""

    portfolio_name: str = Field(
        ..., min_length=1, max_length=100, examples=["My Tech Portfolio"]
    )
    description: str | None = Field(None, max_length=500, examples=["Long-term tech holdings"])
    investment_goal: str | None = Field(None, max_length=255, examples=["Retirement"])
    risk_level: RiskLevel | None = Field(None, examples=["medium"])
    currency: str = Field("USD", min_length=3, max_length=3, examples=["USD"])
    initial_balance: float = Field(0.0, ge=0, examples=[10000.0])
    is_default: bool = Field(False, examples=[False])


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------
class PortfolioCreate(PortfolioBase):
    """Schema for creating a new portfolio."""
    pass


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------
class PortfolioUpdate(BaseModel):
    """Schema for updating an existing portfolio. All fields are optional."""

    portfolio_name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    investment_goal: str | None = Field(None, max_length=255)
    risk_level: RiskLevel | None = None
    currency: str | None = Field(None, min_length=3, max_length=3)
    initial_balance: float | None = Field(None, ge=0)
    is_default: bool | None = None


# ---------------------------------------------------------------------------
# Response
# ---------------------------------------------------------------------------
class PortfolioResponse(PortfolioBase):
    """Single portfolio response returned by the API."""

    id: str
    user_id: str
    current_value: float
    total_profit_loss: float
    total_profit_loss_percentage: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------------------------------------------------------------------------
# List Response
# ---------------------------------------------------------------------------
class PortfolioListResponse(BaseModel):
    """Paginated list of portfolios."""

    portfolios: list[PortfolioResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
