"""Auth service containing business logic for authentication."""

from motor.motor_asyncio import AsyncIOMotorDatabase

from fastapi import HTTPException, status

from app.core.logging_config import get_logger
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.repositories.user_repository import UserRepository
from app.schemas.token import Token
from app.schemas.user import UserCreate

logger = get_logger(__name__)


class AuthService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.repository = UserRepository(db)

    async def register_user(self, user_in: UserCreate):
        user_by_email = await self.repository.get_by_email(user_in.email)
        if user_by_email:
            logger.warning(f"Registration failed: Email {user_in.email} already exists.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered."
            )

        user_by_username = await self.repository.get_by_username(user_in.username)
        if user_by_username:
            logger.warning(f"Registration failed: Username {user_in.username} already exists.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken."
            )

        new_user = await self.repository.create(user_in)
        logger.info(f"User registered successfully: {new_user.email}")
        return new_user

    async def authenticate_user(self, email: str, password: str) -> Token:
        user = await self.repository.get_by_email(email)
        if not user:
            logger.warning(f"Login failed: Email {email} not found.")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        if not verify_password(password, user.hashed_password):
            logger.warning(f"Login failed: Incorrect password for email {email}.")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        logger.info(f"User {email} authenticated successfully.")

        access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
        refresh_token = create_refresh_token(data={"sub": str(user.id), "role": user.role})

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer"
        )
