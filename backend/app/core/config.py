"""
StockPulse AI – Application Configuration.

Centralized configuration management using Pydantic BaseSettings.
All environment variables are validated, typed, and accessible
through a cached singleton Settings instance.
"""

from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables and .env file.

    Attributes:
        PROJECT_NAME: Display name of the application.
        PROJECT_VERSION: Current application version string.
        API_V1_STR: URL prefix for all v1 API routes.
        DEBUG: Enable debug mode (verbose logging, detailed errors).
        MONGODB_URL: MongoDB connection string.
        MONGODB_NAME: MongoDB database name.
        SECRET_KEY: Secret key used for JWT token signing.
        ALGORITHM: JWT signing algorithm (default: HS256).
        ACCESS_TOKEN_EXPIRE_MINUTES: JWT access token lifetime in minutes.
        REFRESH_TOKEN_EXPIRE_DAYS: JWT refresh token lifetime in days.
        CORS_ORIGINS: List of allowed origins for CORS middleware.
        LOG_LEVEL: Application logging level.
    """

    # --- Application ---
    PROJECT_NAME: str = "StockPulse AI"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # --- Database (MongoDB) ---
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_NAME: str = "stockpulse_db"

    # --- JWT Authentication ---
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- CORS ---
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # --- Logging ---
    LOG_LEVEL: str = "INFO"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | List[str]) -> List[str]:
        """Parse CORS origins from a JSON string or return the list as-is."""
        if isinstance(value, str):
            import json

            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
            # Fallback: treat as comma-separated string
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Return a cached singleton instance of the application settings.

    Uses lru_cache to ensure the .env file is read only once during
    the application lifecycle.
    """
    return Settings()
