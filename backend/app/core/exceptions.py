"""
StockPulse AI – Global Exception Handlers.

Defines custom exception classes and registers global exception handlers
on the FastAPI application to ensure consistent error responses.
"""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import ORJSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging_config import get_logger

logger = get_logger(__name__)


# =============================================================================
# Custom Exception Classes
# =============================================================================


class StockPulseException(Exception):
    """
    Base exception for all StockPulse AI application errors.

    All custom domain exceptions should inherit from this class
    to allow centralized handling.

    Attributes:
        message: Human-readable error description.
        status_code: HTTP status code to return to the client.
        error_code: Machine-readable error code for frontend consumption.
    """

    def __init__(
        self,
        message: str = "An unexpected error occurred.",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: str = "INTERNAL_ERROR",
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)


class NotFoundException(StockPulseException):
    """Raised when a requested resource is not found."""

    def __init__(self, resource: str = "Resource", identifier: str = "") -> None:
        detail = f"{resource} not found"
        if identifier:
            detail = f"{resource} with identifier '{identifier}' not found"
        super().__init__(
            message=detail,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
        )


class UnauthorizedException(StockPulseException):
    """Raised when authentication fails or credentials are invalid."""

    def __init__(self, message: str = "Invalid authentication credentials.") -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED",
        )


class ForbiddenException(StockPulseException):
    """Raised when a user lacks permission to access a resource."""

    def __init__(self, message: str = "You do not have permission to perform this action.") -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FORBIDDEN",
        )


class BadRequestException(StockPulseException):
    """Raised when the client sends an invalid or malformed request."""

    def __init__(self, message: str = "Invalid request.") -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="BAD_REQUEST",
        )


class ConflictException(StockPulseException):
    """Raised when a resource conflict occurs (e.g., duplicate entry)."""

    def __init__(self, message: str = "Resource already exists.") -> None:
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            error_code="CONFLICT",
        )


# =============================================================================
# Exception Handler Registration
# =============================================================================


def register_exception_handlers(app: FastAPI) -> None:
    """
    Register all global exception handlers on the FastAPI application.

    This function attaches handlers for:
    - StockPulseException (custom domain errors)
    - StarletteHTTPException (standard HTTP errors)
    - RequestValidationError (Pydantic validation errors)
    - Generic Exception (catch-all for unhandled errors)

    Args:
        app: The FastAPI application instance.
    """

    @app.exception_handler(StockPulseException)
    async def stockpulse_exception_handler(
        request: Request, exc: StockPulseException
    ) -> ORJSONResponse:
        """Handle custom StockPulse domain exceptions."""
        logger.warning(
            "StockPulseException: %s | Path: %s | Code: %s",
            exc.message,
            request.url.path,
            exc.error_code,
        )
        return ORJSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": exc.error_code,
                    "message": exc.message,
                },
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> ORJSONResponse:
        """Handle standard HTTP exceptions with a consistent response format."""
        logger.warning(
            "HTTPException: %s | Status: %d | Path: %s",
            exc.detail,
            exc.status_code,
            request.url.path,
        )
        return ORJSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "error": {
                    "code": "HTTP_ERROR",
                    "message": str(exc.detail),
                },
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> ORJSONResponse:
        """Handle Pydantic request validation errors with detailed field info."""
        errors = []
        for error in exc.errors():
            field_path = " → ".join(str(loc) for loc in error.get("loc", []))
            errors.append(
                {
                    "field": field_path,
                    "message": error.get("msg", "Validation error"),
                    "type": error.get("type", "unknown"),
                }
            )

        logger.warning(
            "ValidationError: %d field(s) invalid | Path: %s",
            len(errors),
            request.url.path,
        )
        return ORJSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed.",
                    "details": errors,
                },
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> ORJSONResponse:
        """Catch-all handler for unhandled exceptions. Logs the full traceback."""
        logger.error(
            "Unhandled exception on %s: %s",
            request.url.path,
            str(exc),
            exc_info=True,
        )
        return ORJSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected internal server error occurred.",
                },
            },
        )
