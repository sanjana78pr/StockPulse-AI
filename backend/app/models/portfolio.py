"""Portfolio model definition."""

from app.database.base import DocumentBase


class Portfolio(DocumentBase):
    """MongoDB document model for the 'portfolios' collection."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.user_id: str = str(kwargs.get("user_id", ""))
        self.stock_id: str = str(kwargs.get("stock_id", ""))
        self.quantity: float = kwargs.get("quantity", 0.0)
        self.average_buy_price: float = kwargs.get("average_buy_price", 0.0)
