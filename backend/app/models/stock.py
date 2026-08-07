"""Stock model definition."""

from app.database.base import DocumentBase


class Stock(DocumentBase):
    """MongoDB document model for the 'stocks' collection."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.symbol: str = kwargs.get("symbol", "")
        self.company_name: str = kwargs.get("company_name", "")
        self.sector: str | None = kwargs.get("sector")
        self.industry: str | None = kwargs.get("industry")
        self.exchange: str | None = kwargs.get("exchange")
        self.current_price: float | None = kwargs.get("current_price")
        self.market_cap: float | None = kwargs.get("market_cap")
        self.description: str | None = kwargs.get("description")
        self.is_active: bool = kwargs.get("is_active", True)
        self.logo_url: str | None = kwargs.get("logo_url")
        self.website: str | None = kwargs.get("website")
        self.country: str | None = kwargs.get("country")
        self.currency: str | None = kwargs.get("currency")
