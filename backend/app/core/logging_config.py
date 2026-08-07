"""
StockPulse AI – Structured Logging Configuration.

Provides a centralized, configurable logging setup with structured output.
All modules should use `get_logger(__name__)` to obtain a named logger.
"""

import logging
import os
import sys
from typing import Optional

from app.core.config import get_settings


class StructuredFormatter(logging.Formatter):
    """
    Custom log formatter that produces clean, structured log output.

    Format: TIMESTAMP | LEVEL | MODULE | MESSAGE
    Includes exception info when available.
    """

    FORMAT = "%(asctime)s | %(levelname)-8s | %(name)-30s | %(message)s"
    DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

    LEVEL_COLORS = {
        logging.DEBUG: "\033[36m",     # Cyan
        logging.INFO: "\033[32m",      # Green
        logging.WARNING: "\033[33m",   # Yellow
        logging.ERROR: "\033[31m",     # Red
        logging.CRITICAL: "\033[1;31m",  # Bold Red
    }
    RESET = "\033[0m"

    def __init__(self, use_colors: bool = True) -> None:
        """
        Initialize the structured formatter.

        Args:
            use_colors: Whether to use ANSI color codes in output.
        """
        super().__init__(fmt=self.FORMAT, datefmt=self.DATE_FORMAT)
        self.use_colors = use_colors

    def format(self, record: logging.LogRecord) -> str:
        """Format the log record with optional color coding by level."""
        if self.use_colors and record.levelno in self.LEVEL_COLORS:
            color = self.LEVEL_COLORS[record.levelno]
            record.levelname = f"{color}{record.levelname}{self.RESET}"
        return super().format(record)


def setup_logging(log_level: Optional[str] = None) -> None:
    """
    Configure the root application logger and set the global log level.

    This function should be called once during application startup.
    It configures the 'stockpulse' logger hierarchy and suppresses
    noisy third-party loggers.

    Args:
        log_level: Override log level. If None, reads from settings.
    """
    # Set UTF-8 encoding environment variables to fix Windows Unicode issues
    # This must be done before any yfinance imports or HTTP requests
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    os.environ['PYTHONUTF8'] = '1'
    
    settings = get_settings()
    level = getattr(logging, (log_level or settings.LOG_LEVEL).upper(), logging.INFO)

    # Configure the root 'stockpulse' logger
    root_logger = logging.getLogger("stockpulse")
    root_logger.setLevel(level)

    # Avoid duplicate handlers on repeated calls
    if not root_logger.handlers:
        # Ensure UTF-8 encoding for stdout to handle Unicode characters on Windows
        if hasattr(sys.stdout, 'reconfigure'):
            try:
                sys.stdout.reconfigure(encoding='utf-8', errors='replace')
            except Exception:
                pass  # Fallback to default if reconfigure fails
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)

        use_colors = sys.stdout.isatty()
        console_handler.setFormatter(StructuredFormatter(use_colors=use_colors))
        root_logger.addHandler(console_handler)

    # Suppress noisy third-party loggers
    for noisy_logger in ("uvicorn.access", "sqlalchemy.engine", "httpx", "httpcore"):
        logging.getLogger(noisy_logger).setLevel(logging.WARNING)

    # Set uvicorn loggers to use our format
    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_logger.setLevel(level)


def get_logger(name: str) -> logging.Logger:
    """
    Return a named logger under the 'stockpulse' hierarchy.

    Usage:
        from app.core.logging_config import get_logger
        logger = get_logger(__name__)
        logger.info("Something happened")

    Args:
        name: The module name, typically __name__.

    Returns:
        A configured logging.Logger instance.
    """
    return logging.getLogger(f"stockpulse.{name}")
