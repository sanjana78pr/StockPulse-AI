"""Prediction model definition."""

from datetime import date

from app.database.base import DocumentBase


class Prediction(DocumentBase):
    """MongoDB document model for the 'predictions' collection."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.stock_id: str = str(kwargs.get("stock_id", ""))
        self.target_date: date = kwargs.get("target_date")
        self.predicted_price: float = kwargs.get("predicted_price", 0.0)
        self.confidence_score: float | None = kwargs.get("confidence_score")
