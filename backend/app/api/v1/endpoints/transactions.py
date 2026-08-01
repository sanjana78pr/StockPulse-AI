"""
StockPulse AI – Transaction Endpoints.

All routes are JWT-protected. Users can only access and view their own transactions.
"""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Path, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.v1.dependencies import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.transaction import (
    TransactionCreate,
    TransactionListResponse,
    TransactionResponse,
)
from app.services.transaction_service import TransactionService

router = APIRouter()


# ---------------------------------------------------------------------------
# Create Transaction (BUY or SELL)
# ---------------------------------------------------------------------------
@router.post(
    "/",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Execute Transaction (BUY/SELL)",
)
async def create_transaction(
    transaction_in: TransactionCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Execute a new transaction (BUY or SELL) for the authenticated user.

    - Validates portfolio ownership.
    - Validates stock exists in the system.
    - Validates that quantity and price are greater than zero.
    - Updates portfolio holdings and available cash.
    - Persists the transaction and returns the details.
    """
    service = TransactionService(db)
    return await service.create_transaction(current_user.id, transaction_in)


# ---------------------------------------------------------------------------
# List My Transactions
# ---------------------------------------------------------------------------
@router.get(
    "/my",
    response_model=TransactionListResponse,
    summary="Get My Transactions",
)
async def list_my_transactions(
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 20,
    sort_by: Annotated[
        Literal[
            "transaction_date", "quantity", "price_per_share",
            "total_amount", "stock_symbol", "created_at", "updated_at",
        ],
        Query(description="Field to sort by"),
    ] = "transaction_date",
    sort_order: Annotated[
        Literal["asc", "desc"],
        Query(description="Sort direction"),
    ] = "desc",
    transaction_type: Annotated[
        Literal["BUY", "SELL"] | None,
        Query(description="Filter by transaction type"),
    ] = None,
    search: Annotated[
        str | None,
        Query(description="Search by stock symbol"),
    ] = None,
):
    """
    Return a paginated list of all transactions belonging to the authenticated user.
    """
    service = TransactionService(db)
    return await service.list_my_transactions(
        user_id=current_user.id,
        portfolio_id=None,
        transaction_type=transaction_type,
        search=search,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


# ---------------------------------------------------------------------------
# List Portfolio Transactions
# ---------------------------------------------------------------------------
@router.get(
    "/portfolio/{portfolio_id}",
    response_model=TransactionListResponse,
    summary="Get Portfolio Transactions",
)
async def list_portfolio_transactions(
    portfolio_id: Annotated[str, Path(..., description="Portfolio ObjectId")],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Items per page")] = 20,
    sort_by: Annotated[
        Literal[
            "transaction_date", "quantity", "price_per_share",
            "total_amount", "stock_symbol", "created_at", "updated_at",
        ],
        Query(description="Field to sort by"),
    ] = "transaction_date",
    sort_order: Annotated[
        Literal["asc", "desc"],
        Query(description="Sort direction"),
    ] = "desc",
    transaction_type: Annotated[
        Literal["BUY", "SELL"] | None,
        Query(description="Filter by transaction type"),
    ] = None,
    search: Annotated[
        str | None,
        Query(description="Search by stock symbol"),
    ] = None,
):
    """
    Return a paginated list of transactions for a specific portfolio.
    """
    service = TransactionService(db)
    return await service.list_my_transactions(
        user_id=current_user.id,
        portfolio_id=portfolio_id,
        transaction_type=transaction_type,
        search=search,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_order=sort_order,
    )


# ---------------------------------------------------------------------------
# Get Transaction by ID
# ---------------------------------------------------------------------------
@router.get(
    "/{transaction_id}",
    response_model=TransactionResponse,
    summary="Get Transaction by ID",
)
async def get_transaction(
    transaction_id: Annotated[str, Path(..., description="Transaction ObjectId")],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """
    Retrieve a transaction by ID.
    """
    service = TransactionService(db)
    return await service.get_transaction_by_id(transaction_id, current_user.id)
