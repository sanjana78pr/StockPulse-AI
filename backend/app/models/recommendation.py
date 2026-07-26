"""Recommendation model definition."""

from datetime import date

from app.database.base import DocumentBase


class Recommendation(DocumentBase):
    """MongoDB document model for the 'recommendations' collection."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.stock_id: str = str(kwargs.get("stock_id", ""))
        self.recommendation_date: date = kwargs.get("recommendation_date")
        self.action: str = kwargs.get("action", "")  # 'BUY', 'SELL', 'HOLD'
        self.reasoning: str | None = kwargs.get("reasoning")
