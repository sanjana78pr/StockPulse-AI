"""
StockPulse AI – V1 API Router Aggregator.

Collects all v1 endpoint routers and mounts them under a single
APIRouter that is included in the main application.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import health, auth, stocks, historical_prices

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
# api_v1_router.include_router(portfolio.router, prefix="/portfolio", tags=["Portfolio"])
# api_v1_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
# api_v1_router.include_router(predictions.router, prefix="/predictions", tags=["Predictions"])
# api_v1_router.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
