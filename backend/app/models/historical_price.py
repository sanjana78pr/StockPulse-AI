"""HistoricalPrice model definition."""

from datetime import datetime

from app.database.base import DocumentBase


class HistoricalPrice(DocumentBase):
    """MongoDB document model for the 'historical_prices' collection."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.stock_id: str = str(kwargs.get("stock_id", ""))
        self.symbol: str = kwargs.get("symbol", "")
        
        # Support both datetime and date; storing as datetime is standard in MongoDB for querying
        self.date: datetime = kwargs.get("date")
        
        self.open_price: float = kwargs.get("open_price", 0.0)
        self.high_price: float = kwargs.get("high_price", 0.0)
        self.low_price: float = kwargs.get("low_price", 0.0)
        self.close_price: float = kwargs.get("close_price", 0.0)
        self.adjusted_close: float = kwargs.get("adjusted_close", 0.0)
        self.volume: int = kwargs.get("volume", 0)
        
        # Phase 5 Design Enhancements
        self.source: str = kwargs.get("source", "manual")
        self.interval: str = kwargs.get("interval", "1d")
