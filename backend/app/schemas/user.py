"""User schemas."""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str | None = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)


class UserResponse(UserBase):
    id: str
    is_active: bool
    role: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
