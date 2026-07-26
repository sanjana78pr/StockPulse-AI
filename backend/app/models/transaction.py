"""Transaction model definition."""

from datetime import datetime

from app.database.base import DocumentBase


class Transaction(DocumentBase):
    """MongoDB document model for the 'transactions' collection."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.user_id: str = str(kwargs.get("user_id", ""))
        self.stock_id: str = str(kwargs.get("stock_id", ""))
        self.transaction_type: str = kwargs.get("transaction_type", "")  # 'BUY' or 'SELL'
        self.quantity: float = kwargs.get("quantity", 0.0)
        self.price: float = kwargs.get("price", 0.0)
        self.timestamp: datetime = kwargs.get("timestamp")
