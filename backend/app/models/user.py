"""User model definition."""

from app.database.base import DocumentBase


class User(DocumentBase):
    """MongoDB document model for the 'users' collection."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.email: str = kwargs.get("email", "")
        self.username: str = kwargs.get("username", "")
        self.hashed_password: str = kwargs.get("hashed_password", "")
        self.is_active: bool = kwargs.get("is_active", True)
        self.full_name: str | None = kwargs.get("full_name")
        self.role: str = kwargs.get("role", "User")
