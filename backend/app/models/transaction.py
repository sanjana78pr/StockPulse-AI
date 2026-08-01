"""Transaction model definition."""

from datetime import datetime

from app.database.base import DocumentBase


class Transaction(DocumentBase):
    """MongoDB document model for the 'transactions' collection."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.user_id: str = str(kwargs.get("user_id", ""))
        self.portfolio_id: str = str(kwargs.get("portfolio_id", ""))
        self.stock_symbol: str = kwargs.get("stock_symbol", "").upper()
        self.transaction_type: str = kwargs.get("transaction_type", "")  # 'BUY' or 'SELL'
        self.quantity: float = float(kwargs.get("quantity", 0.0))
        self.price_per_share: float = float(kwargs.get("price_per_share", 0.0))
        self.total_amount: float = float(kwargs.get("total_amount", 0.0))
        self.fees: float = float(kwargs.get("fees", 0.0))
        self.notes: str | None = kwargs.get("notes")
        self.transaction_date: datetime = kwargs.get("transaction_date") or kwargs.get(
            "created_at"
        )
