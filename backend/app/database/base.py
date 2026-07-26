"""
StockPulse AI – MongoDB Document Base Class.

Provides a lightweight base class for all MongoDB document models.
Each model inheriting from this base automatically receives:
    - id: String representation of MongoDB ObjectId.
    - created_at: Timestamp set on document creation.
    - updated_at: Timestamp updated on every modification.
"""

from datetime import datetime, timezone


class DocumentBase:
    """
    Abstract base class for all MongoDB document models.

    Converts a raw MongoDB document (dict) into an object with
    attribute-style access, preserving compatibility with the
    existing Service and API layers.

    Usage:
        class User(DocumentBase):
            def __init__(self, **kwargs):
                super().__init__(**kwargs)
                self.email = kwargs.get("email")
    """

    def __init__(self, **kwargs):
        self.id: str = str(kwargs.get("_id", kwargs.get("id", "")))
        self.created_at: datetime = kwargs.get(
            "created_at", datetime.now(timezone.utc)
        )
        self.updated_at: datetime = kwargs.get(
            "updated_at", datetime.now(timezone.utc)
        )
