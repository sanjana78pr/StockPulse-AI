from abc import ABC, abstractmethod

from app.schemas.market_data import (
    CompanyInformationResponse,
    LiveMarketQuoteResponse,
    MarketStatisticsResponse,
    MarketSummaryResponse,
)


class BaseMarketDataProvider(ABC):
    """
    Abstract interface for all live market data providers.
    Ensures all providers implement the same methods and return the same schemas.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return the name of the provider."""
        pass

    @abstractmethod
    async def get_live_quote(self, symbol: str) -> LiveMarketQuoteResponse:
        """Fetch the current market quote for a symbol."""
        pass

    @abstractmethod
    async def get_company_info(self, symbol: str) -> CompanyInformationResponse:
        """Fetch company information for a symbol."""
        pass

    @abstractmethod
    async def get_market_statistics(self, symbol: str) -> MarketStatisticsResponse:
        """Fetch market statistics for a symbol."""
        pass

    @abstractmethod
    async def get_market_summary(self, symbol: str) -> MarketSummaryResponse:
        """Fetch a complete market summary for a symbol."""
        pass
