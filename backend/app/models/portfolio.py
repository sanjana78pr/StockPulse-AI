"""Portfolio model definition."""

from app.database.base import DocumentBase


class Portfolio(DocumentBase):
    """MongoDB document model for the 'portfolios' collection."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.user_id: str = str(kwargs.get("user_id", ""))
        self.portfolio_name: str = kwargs.get("portfolio_name", "")
        self.description: str | None = kwargs.get("description")
        self.investment_goal: str | None = kwargs.get("investment_goal")
        self.risk_level: str | None = kwargs.get("risk_level")
        self.currency: str = kwargs.get("currency", "USD")
        self.initial_balance: float = kwargs.get("initial_balance", 0.0)
        self.current_value: float = kwargs.get("current_value", 0.0)
        self.total_profit_loss: float = kwargs.get("total_profit_loss", 0.0)
        self.total_profit_loss_percentage: float = kwargs.get("total_profit_loss_percentage", 0.0)
        self.is_default: bool = kwargs.get("is_default", False)
