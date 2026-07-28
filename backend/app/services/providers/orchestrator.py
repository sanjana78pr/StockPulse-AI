from app.services.providers.base import BaseMarketDataProvider
from app.services.providers.yfinance_provider import YahooFinanceProvider

class MarketDataOrchestrator:
    """
    Acts as the single entry point for all market data requests.
    Responsible for selecting the active provider and routing requests to it.
    """
    
    def __init__(self):
        # Currently defaults to YahooFinance. In the future, this can include failover logic
        # or load balancing across multiple providers.
        self._active_provider: BaseMarketDataProvider = YahooFinanceProvider()

    def get_provider(self) -> BaseMarketDataProvider:
        """Returns the currently active provider."""
        return self._active_provider

    def set_provider(self, provider: BaseMarketDataProvider):
        """Allows switching the active provider at runtime if needed."""
        self._active_provider = provider
