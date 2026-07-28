"""
StockPulse AI – Portfolio Endpoints.

All routes are JWT-protected. Users can only access and modify their own portfolios.
"""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Path, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.v1.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.portfolio import (
    PortfolioCreate,
    PortfolioListResponse,
    PortfolioResponse,
    PortfolioUpdate,
)
from app.services.portfolio_service import PortfolioService

router = APIRouter()


# ---------------------------------------------------------------------------
# Create Portfolio
# ---------------------------------------------------------------------------
@router.post(
    "/",
    response_model=PortfolioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Portfolio",
)
async def create_portfolio(
    portfolio_in: PortfolioCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Create a new portfolio for the authenticated user.

    - Portfolio name must be unique per user.
    - If `is_default=true`, any existing default portfolio is unset.
    - `initial_balance` must be ≥ 0.
    """
    service = PortfolioService(db)
    return await service.create_portfolio(current_user.id, portfolio_in)


# ---------------------------------------------------------------------------
# List My Portfolios
# ---------------------------------------------------------------------------
@router.get(
    "/",
    response_model=PortfolioListResponse,
    summary="Get My Portfolios",
)
async def list_my_portfolios(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 20,
    sort_by: Annotated[
        Literal[
            "portfolio_name", "created_at", "updated_at",
            "initial_balance", "current_value", "total_profit_loss",
        ],
        Query(description="Field to sort by"),
    ] = "created_at",
    sort_order: Annotated[
        Literal["asc", "desc"],
        Query(description="Sort direction"),
    ] = "desc",
    risk_level: Annotated[
        Literal["low", "medium", "high", "very_high"] | None,
        Query(description="Filter by risk level"),
    ] = None,
    is_default: Annotated[
        bool | None,
        Query(description="Filter by default status"),
    ] = None,
    search: Annotated[
        str | None,
        Query(description="Search by portfolio name or description"),
    ] = None,
):
    """
    Return a paginated list of all portfolios belonging to the authenticated user.

    Supports filtering by `risk_level` and `is_default`, full-text `search`
    across name/description, and multi-field `sort_by`/`sort_order`.
    """
    service = PortfolioService(db)
    return await service.list_portfolios(
        user_id=current_user.id,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
        risk_level=risk_level,
        is_default=is_default,
        search=search,
    )


# ---------------------------------------------------------------------------
# Get Portfolio by ID
# ---------------------------------------------------------------------------
@router.get(
    "/{portfolio_id}",
    response_model=PortfolioResponse,
    summary="Get Portfolio by ID",
)
async def get_portfolio(
    portfolio_id: Annotated[str, Path(..., description="Portfolio ObjectId")],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Return a single portfolio by its ID.

    - Returns 404 if the portfolio does not exist.
    - Returns 403 if the requesting user is not the owner.
    """
    service = PortfolioService(db)
    return await service.get_portfolio_by_id(portfolio_id, current_user.id)


# ---------------------------------------------------------------------------
# Update Portfolio
# ---------------------------------------------------------------------------
@router.patch(
    "/{portfolio_id}",
    response_model=PortfolioResponse,
    summary="Update Portfolio",
)
async def update_portfolio(
    portfolio_id: Annotated[str, Path(..., description="Portfolio ObjectId")],
    update_in: PortfolioUpdate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Partially update an existing portfolio (all fields optional).

    - Returns 403 if the requesting user is not the owner.
    - Returns 409 if the new name conflicts with an existing portfolio name for the user.
    - If `is_default=true`, all other default portfolios for the user are unset.
    """
    service = PortfolioService(db)
    return await service.update_portfolio(portfolio_id, current_user.id, update_in)


# ---------------------------------------------------------------------------
# Delete Portfolio
# ---------------------------------------------------------------------------
@router.delete(
    "/{portfolio_id}",
    summary="Delete Portfolio",
    status_code=status.HTTP_200_OK,
)
async def delete_portfolio(
    portfolio_id: Annotated[str, Path(..., description="Portfolio ObjectId")],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Delete a portfolio by ID.

    - Returns 403 if the requesting user is not the owner.
    - Returns 404 if the portfolio does not exist.
    """
    service = PortfolioService(db)
    return await service.delete_portfolio(portfolio_id, current_user.id)
