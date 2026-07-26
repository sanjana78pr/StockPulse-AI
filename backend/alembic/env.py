"""
StockPulse AI – Alembic Migration Environment.

Configures Alembic to work with our SQLAlchemy setup.
Supports both online (connected) and offline (SQL generation) modes.
"""

import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import pool
from sqlalchemy import engine_from_config

# ---------------------------------------------------------------------------
# Ensure the 'backend' directory is on the Python path so that
# 'app.core.config' and 'app.database.base' can be imported.
# ---------------------------------------------------------------------------
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import get_settings
from app.database.base import Base

# Alembic Config object (provides access to alembic.ini values)
config = context.config

# Setup Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set the database URL programmatically from our settings
settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.SYNC_DATABASE_URL)

# Target metadata for autogenerate support
target_metadata = Base.metadata

# ---------------------------------------------------------------------------
# Import ALL models here so that Alembic detects them during autogenerate.
# As new models are added in future phases, import them below.
# ---------------------------------------------------------------------------
import app.models  # Imports __init__.py which loads all models


def run_migrations_offline() -> None:
    """
    Run migrations in 'offline' mode.

    Generates SQL statements without requiring a live database connection.
    Useful for reviewing migration SQL before applying it.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """
    Run migrations in 'online' mode with a live database connection.
    
    Uses the synchronous database URL (psycopg2) and engine.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


# ---------------------------------------------------------------------------
# Entry point: choose offline or online mode
# ---------------------------------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
