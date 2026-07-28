"""
StockPulse AI – Portfolio Service.

Business logic layer for portfolio management.
Enforces:
  - Portfolio name uniqueness per user
  - Owner-only access and modification
  - Single default portfolio per user
  - Non-negative initial balance (handled by schema)
  - Paginated, filtered, sorted listing
"""

import math

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.core.logging_config import get_logger
from app.repositories.portfolio_repository import PortfolioRepository
from app.schemas.portfolio import (
    PortfolioCreate,
    PortfolioListResponse,
    PortfolioResponse,
    PortfolioUpdate,
)

logger = get_logger(__name__)


class PortfolioService:
    """Orchestrates portfolio business logic on top of ``PortfolioRepository``."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.repository = PortfolioRepository(db)

    # ------------------------------------------------------------------
    # Helper
    # ------------------------------------------------------------------
    @staticmethod
    def _to_response(portfolio) -> PortfolioResponse:
        """Convert a Portfolio model instance to a PortfolioResponse schema."""
        return PortfolioResponse(
            id=portfolio.id,
            user_id=portfolio.user_id,
            portfolio_name=portfolio.portfolio_name,
            description=portfolio.description,
            investment_goal=portfolio.investment_goal,
            risk_level=portfolio.risk_level,
            currency=portfolio.currency,
            initial_balance=portfolio.initial_balance,
            current_value=portfolio.current_value,
            total_profit_loss=portfolio.total_profit_loss,
            total_profit_loss_percentage=portfolio.total_profit_loss_percentage,
            is_default=portfolio.is_default,
            created_at=portfolio.created_at,
            updated_at=portfolio.updated_at,
        )

    def _assert_owner(self, portfolio, user_id: str) -> None:
        """Raise ForbiddenException if the requesting user is not the portfolio owner."""
        if portfolio.user_id != user_id:
            raise ForbiddenException(
                message="You do not have permission to access this portfolio."
            )

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------
    async def create_portfolio(
        self, user_id: str, portfolio_in: PortfolioCreate
    ) -> PortfolioResponse:
        """
        Create a new portfolio for the authenticated user.

        Rules enforced:
          - Portfolio name must be unique per user.
          - If is_default=True, the existing default portfolio is unset first.
        """
        existing = await self.repository.get_by_user_and_name(
            user_id, portfolio_in.portfolio_name
        )
        if existing:
            raise ConflictException(
                message=f"A portfolio named '{portfolio_in.portfolio_name}' already exists."
            )

        # Enforce single default portfolio per user
        if portfolio_in.is_default:
            await self.repository.unset_default_for_user(user_id)

        portfolio = await self.repository.create(user_id, portfolio_in)
        logger.info(
            "Portfolio created: '%s' for user %s", portfolio.portfolio_name, user_id
        )
        return self._to_response(portfolio)

    # ------------------------------------------------------------------
    # Get by ID (owner-only)
    # ------------------------------------------------------------------
    async def get_portfolio_by_id(
        self, portfolio_id: str, user_id: str
    ) -> PortfolioResponse:
        """Return a portfolio by ID, verifying ownership."""
        portfolio = await self.repository.get_by_id(portfolio_id)
        if not portfolio:
            raise NotFoundException(resource="Portfolio", identifier=portfolio_id)
        self._assert_owner(portfolio, user_id)
        return self._to_response(portfolio)

    # ------------------------------------------------------------------
    # List (current user's portfolios)
    # ------------------------------------------------------------------
    async def list_portfolios(
        self,
        user_id: str,
        *,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_order: str = "desc",
        risk_level: str | None = None,
        is_default: bool | None = None,
        search: str | None = None,
    ) -> PortfolioListResponse:
        """Return a paginated list of portfolios belonging to the authenticated user."""
        portfolios, total = await self.repository.list_portfolios(
            user_id=user_id,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order,
            risk_level=risk_level,
            is_default=is_default,
            search=search,
        )

        total_pages = math.ceil(total / page_size) if page_size else 0

        return PortfolioListResponse(
            portfolios=[self._to_response(p) for p in portfolios],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    # ------------------------------------------------------------------
    # Update (owner-only)
    # ------------------------------------------------------------------
    async def update_portfolio(
        self, portfolio_id: str, user_id: str, update_in: PortfolioUpdate
    ) -> PortfolioResponse:
        """
        Update a portfolio, verifying ownership.

        Rules enforced:
          - Only the owner can update.
          - If portfolio_name changes, the new name must be unique for the user.
          - If is_default is set to True, unset all other defaults first.
        """
        portfolio = await self.repository.get_by_id(portfolio_id)
        if not portfolio:
            raise NotFoundException(resource="Portfolio", identifier=portfolio_id)
        self._assert_owner(portfolio, user_id)

        # Check new name uniqueness if name is being changed
        if (
            update_in.portfolio_name is not None
            and update_in.portfolio_name != portfolio.portfolio_name
        ):
            name_conflict = await self.repository.get_by_user_and_name(
                user_id, update_in.portfolio_name
            )
            if name_conflict:
                raise ConflictException(
                    message=f"A portfolio named '{update_in.portfolio_name}' already exists."
                )

        # Enforce single default portfolio per user
        if update_in.is_default is True:
            await self.repository.unset_default_for_user(user_id)

        updated = await self.repository.update(portfolio_id, update_in)
        if not updated:
            raise NotFoundException(resource="Portfolio", identifier=portfolio_id)

        logger.info("Portfolio updated: %s by user %s", portfolio_id, user_id)
        return self._to_response(updated)

    # ------------------------------------------------------------------
    # Delete (owner-only)
    # ------------------------------------------------------------------
    async def delete_portfolio(
        self, portfolio_id: str, user_id: str
    ) -> dict:
        """Delete a portfolio, verifying ownership."""
        portfolio = await self.repository.get_by_id(portfolio_id)
        if not portfolio:
            raise NotFoundException(resource="Portfolio", identifier=portfolio_id)
        self._assert_owner(portfolio, user_id)

        deleted = await self.repository.delete(portfolio_id)
        if not deleted:
            raise NotFoundException(resource="Portfolio", identifier=portfolio_id)

        logger.info(
            "Portfolio deleted: '%s' (%s) by user %s",
            portfolio.portfolio_name, portfolio_id, user_id,
        )
        return {"message": f"Portfolio '{portfolio.portfolio_name}' deleted successfully."}
