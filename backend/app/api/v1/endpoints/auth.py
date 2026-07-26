"""
Authentication API endpoints.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.v1.dependencies import get_current_user
from app.core.logging_config import get_logger
from app.database.session import get_db
from app.models.user import User
from app.schemas.token import Token
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import AuthService

logger = get_logger(__name__)

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Registers a new user in the system.",
)
async def register(
    user_in: UserCreate,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """
    Register a new user.
    """
    auth_service = AuthService(db)
    return await auth_service.register_user(user_in)


@router.post(
    "/login",
    response_model=Token,
    summary="Login user to get access token",
    description="Authenticates a user and returns JWT access and refresh tokens.",
)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """
    OAuth2 compatible token login, getting an access token for future requests.
    """
    auth_service = AuthService(db)
    # The form_data.username can be either an email or a username based on the frontend.
    # In our AuthService it currently checks email. Let's assume it's email.
    return await auth_service.authenticate_user(
        email=form_data.username,
        password=form_data.password
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user",
    description="Returns the currently authenticated user's details.",
)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get current user details.
    """
    return current_user
