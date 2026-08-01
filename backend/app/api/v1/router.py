"""
StockPulse AI – V1 API Router Aggregator.

Collects all v1 endpoint routers and mounts them under a single
APIRouter that is included in the main application.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import health, auth, stocks, historical_prices, live_market, portfolios, transactions

api_v1_router = APIRouter()

# ---------------------------------------------------------------------------
# Mount endpoint routers
# ---------------------------------------------------------------------------
api_v1_router.include_router(health.router)

# Future phase routers will be added here:
api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
# api_v1_router.include_router(users.router, prefix="/users", tags=["Users"])
api_v1_router.include_router(stocks.router, prefix="/stocks", tags=["Stocks"])
api_v1_router.include_router(historical_prices.router, prefix="/historical-prices", tags=["Historical Prices"])
api_v1_router.include_router(live_market.router, prefix="/live-market", tags=["Live Market"])
api_v1_router.include_router(portfolios.router, prefix="/portfolios", tags=["Portfolio"])
api_v1_router.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
# api_v1_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
# api_v1_router.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])
# api_v1_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
