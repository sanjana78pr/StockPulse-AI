from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class LiveMarketQuoteResponse(BaseModel):
    symbol: str = Field(..., description="Stock ticker symbol")
    price: float = Field(..., description="Current market price")
    open: Optional[float] = Field(None, description="Opening price of the day")
    high: Optional[float] = Field(None, description="Highest price of the day")
    low: Optional[float] = Field(None, description="Lowest price of the day")
    previous_close: Optional[float] = Field(None, description="Previous closing price")
    volume: Optional[int] = Field(None, description="Trading volume")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Time of the quote")
    provider: str = Field(..., description="Data provider used for this quote")


class CompanyInformationResponse(BaseModel):
    symbol: str = Field(..., description="Stock ticker symbol")
    company_name: Optional[str] = Field(None, description="Full name of the company")
    exchange: Optional[str] = Field(None, description="Stock exchange where it is traded")
    currency: Optional[str] = Field(None, description="Trading currency")
    sector: Optional[str] = Field(None, description="Business sector")
    industry: Optional[str] = Field(None, description="Business industry")
    country: Optional[str] = Field(None, description="Country of origin")
    provider: str = Field(..., description="Data provider used")


class MarketStatisticsResponse(BaseModel):
    symbol: str = Field(..., description="Stock ticker symbol")
    market_cap: Optional[float] = Field(None, description="Market capitalization")
    average_volume: Optional[int] = Field(None, description="Average trading volume")
    pe_ratio: Optional[float] = Field(None, description="Price-to-Earnings ratio")
    dividend_yield: Optional[float] = Field(None, description="Dividend yield percentage")
    beta: Optional[float] = Field(None, description="Beta value (volatility relative to market)")
    fifty_two_week_high: Optional[float] = Field(None, description="52-week high price")
    fifty_two_week_low: Optional[float] = Field(None, description="52-week low price")
    provider: str = Field(..., description="Data provider used")


class MarketSummaryResponse(BaseModel):
    quote: LiveMarketQuoteResponse
    company_info: CompanyInformationResponse
    statistics: MarketStatisticsResponse


class LiveMarketBatchResponse(BaseModel):
    quotes: dict[str, LiveMarketQuoteResponse]
    errors: dict[str, str]
