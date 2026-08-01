"""Transaction service – business logic layer for transaction management."""

import math
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.core.logging_config import get_logger
from app.repositories.portfolio_repository import PortfolioRepository
from app.repositories.stock_repository import StockRepository
from app.repositories.transaction_repository import TransactionRepository
from app.schemas.transaction import (
    TransactionCreate,
    TransactionListResponse,
    TransactionResponse,
)

logger = get_logger(__name__)


class TransactionService:
    """Orchestrates transaction business logic on top of repositories."""

    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.transaction_repository = TransactionRepository(db)
        self.portfolio_repository = PortfolioRepository(db)
        self.stock_repository = StockRepository(db)

    # ------------------------------------------------------------------
    # Helper
    # ------------------------------------------------------------------
    @staticmethod
    def _to_response(tx) -> TransactionResponse:
        """Convert a Transaction model instance to a TransactionResponse schema."""
        return TransactionResponse(
            id=tx.id,
            user_id=tx.user_id,
            portfolio_id=tx.portfolio_id,
            stock_symbol=tx.stock_symbol,
            transaction_type=tx.transaction_type,
            quantity=tx.quantity,
            price_per_share=tx.price_per_share,
            total_amount=tx.total_amount,
            fees=tx.fees,
            notes=tx.notes,
            transaction_date=tx.transaction_date,
            created_at=tx.created_at,
            updated_at=tx.updated_at,
        )

    def _assert_portfolio_owner(self, portfolio, user_id: str) -> None:
        """Raise ForbiddenException if user is not the portfolio owner."""
        if portfolio.user_id != user_id:
            raise ForbiddenException(
                message="You do not have permission to modify this portfolio."
            )

    # ------------------------------------------------------------------
    # Create Transaction (BUY or SELL)
    # ------------------------------------------------------------------
    async def create_transaction(
        self, user_id: str, transaction_in: TransactionCreate
    ) -> TransactionResponse:
        """
        Execute a stock transaction (BUY or SELL) and update portfolio holdings.
        """
        # 1. Verify portfolio existence and ownership
        portfolio = await self.portfolio_repository.get_by_id(transaction_in.portfolio_id)
        if not portfolio:
            raise NotFoundException(resource="Portfolio", identifier=transaction_in.portfolio_id)
        self._assert_portfolio_owner(portfolio, user_id)

        # 2. Verify stock exists in the system
        stock = await self.stock_repository.get_by_symbol(transaction_in.stock_symbol)
        if not stock:
            raise NotFoundException(resource="Stock", identifier=transaction_in.stock_symbol)

        # 3. (quantity > 0 and price_per_share > 0 are already enforced by Pydantic schema)

        # 4. Initialize portfolio cash and holdings if not set
        cash = getattr(portfolio, "cash", None)
        if cash is None:
            cash = float(portfolio.initial_balance)
        holdings = getattr(portfolio, "holdings", None) or {}

        symbol = transaction_in.stock_symbol.upper()
        total_amount = transaction_in.quantity * transaction_in.price_per_share
        tx_type = transaction_in.transaction_type.upper()

        if tx_type == "BUY":
            # Check if user has sufficient cash
            required_cash = total_amount + transaction_in.fees
            if cash < required_cash:
                raise BadRequestException(
                    f"Insufficient cash balance. Required: ${required_cash:,.2f}, Available: ${cash:,.2f}."
                )

            # Deduct cash
            cash -= required_cash

            # Update holdings and average purchase price
            if symbol in holdings:
                old_qty = float(holdings[symbol].get("quantity", 0.0))
                old_price = float(holdings[symbol].get("average_price", 0.0))
                new_qty = old_qty + float(transaction_in.quantity)
                new_price = ((old_qty * old_price) + total_amount) / new_qty
                holdings[symbol] = {
                    "quantity": new_qty,
                    "average_price": new_price,
                }
            else:
                holdings[symbol] = {
                    "quantity": float(transaction_in.quantity),
                    "average_price": float(transaction_in.price_per_share),
                }

        elif tx_type == "SELL":
            # Epsilon tolerance handles floating-point rounding from prior BUY avg-price math
            _EPSILON = 1e-9
            owned_qty = float(holdings[symbol].get("quantity", 0.0)) if symbol in holdings else 0.0
            if symbol not in holdings or owned_qty < transaction_in.quantity - _EPSILON:
                raise BadRequestException(
                    f"Insufficient shares to sell. Attempted: {transaction_in.quantity}, Owned: {owned_qty}."
                )

            # Add cash (net of fees)
            cash += (total_amount - transaction_in.fees)

            # Update holdings
            old_qty = owned_qty  # already resolved above with epsilon check
            old_price = float(holdings[symbol].get("average_price", 0.0))
            new_qty = old_qty - float(transaction_in.quantity)

            if new_qty <= 0.00001:  # account for floating point inaccuracy
                holdings.pop(symbol, None)
            else:
                holdings[symbol] = {
                    "quantity": new_qty,
                    "average_price": old_price,  # purchase price does not change on SELL
                }

        else:
            raise BadRequestException(f"Unsupported transaction type '{tx_type}'.")

        # 5. Update portfolio in database
        updated_portfolio = await self.portfolio_repository.update_holdings_and_cash(
            portfolio.id, holdings, cash
        )
        if not updated_portfolio:
            raise NotFoundException(resource="Portfolio", identifier=portfolio.id)

        # 6. Save transaction
        tx = await self.transaction_repository.create(
            user_id=user_id,
            transaction_in=transaction_in,
            total_amount=total_amount,
        )
        logger.info(
            "Transaction successful: User %s executed %s for %s shares of %s",
            user_id, tx_type, tx.quantity, symbol
        )

        return self._to_response(tx)

    # ------------------------------------------------------------------
    # Read – by ID
    # ------------------------------------------------------------------
    async def get_transaction_by_id(
        self, transaction_id: str, user_id: str
    ) -> TransactionResponse:
        """Retrieve a transaction by ID, verifying owner-only access."""
        tx = await self.transaction_repository.get_by_id(transaction_id)
        if not tx:
            raise NotFoundException(resource="Transaction", identifier=transaction_id)
        
        if tx.user_id != user_id:
            raise ForbiddenException(
                message="You do not have permission to view this transaction."
            )
        return self._to_response(tx)

    # ------------------------------------------------------------------
    # List (all current user's transactions)
    # ------------------------------------------------------------------
    async def list_my_transactions(
        self,
        user_id: str,
        *,
        portfolio_id: str | None = None,
        transaction_type: str | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "transaction_date",
        sort_order: str = "desc",
    ) -> TransactionListResponse:
        """Return a paginated list of transactions belonging to the user."""
        txs, total = await self.transaction_repository.list_transactions(
            user_id=user_id,
            portfolio_id=portfolio_id,
            transaction_type=transaction_type,
            search=search,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
            sort_order=sort_order,
        )

        total_pages = math.ceil(total / page_size) if page_size else 0

        return TransactionListResponse(
            transactions=[self._to_response(tx) for tx in txs],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )
