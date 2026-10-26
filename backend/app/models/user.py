import uuid
from datetime import datetime, timezone
import re
from typing import Optional
from sqlmodel import Field, SQLModel
from pydantic import model_validator


# Database Model
class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    username: Optional[str] = Field(default=None, index=True, unique=True, nullable=True)
    email: Optional[str] = Field(default=None, index=True, unique=True, nullable=True)
    hashed_password: str = Field(nullable=False)
    full_name: Optional[str] = Field(default=None, nullable=True)
    avatar_url: Optional[str] = Field(default=None, nullable=True)
    is_active: bool = Field(default=True, nullable=False)
    role: str = Field(default="user", nullable=False)
    is_admin: bool = Field(default=False, nullable=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)


# Schemas
class UserRegister(SQLModel):
    identifier: Optional[str] = None  # Flexible single field (can be username or email)
    username: Optional[str] = None
    email: Optional[str] = None
    password: str = Field(min_length=6, description="Password must be at least 6 characters")
    full_name: Optional[str] = None

    @model_validator(mode="after")
    def resolve_and_validate_identity(self) -> "UserRegister":
        # If identifier is provided, categorize it as email or username
        if self.identifier:
            cleaned_id = self.identifier.strip()
            if "@" in cleaned_id and "." in cleaned_id:
                if not self.email:
                    self.email = cleaned_id.lower()
            else:
                if not self.username:
                    self.username = cleaned_id

        if not self.username and not self.email:
            raise ValueError("Either a username, email, or identifier must be provided")

        if self.username:
            self.username = self.username.strip()
            if len(self.username) < 3:
                raise ValueError("Username must be at least 3 characters long")
            if not re.match(r"^[a-zA-Z0-9_-]+$", self.username):
                raise ValueError("Username can only contain letters, numbers, underscores, and hyphens")

        if self.email:
            self.email = self.email.strip().lower()
            if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", self.email):
                raise ValueError("Invalid email address format")

        return self


class UserLogin(SQLModel):
    identifier: str = Field(description="Can be either username or email address")
    password: str = Field(description="Account password")


class UserResponse(SQLModel):
    id: uuid.UUID
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    role: str = "user"
    is_admin: bool = False
    created_at: datetime
    updated_at: datetime


class UserUpdate(SQLModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

    @model_validator(mode="after")
    def validate_fields(self) -> "UserUpdate":
        if self.username is not None:
            self.username = self.username.strip()
            if len(self.username) < 3:
                raise ValueError("Username must be at least 3 characters long")
            if not re.match(r"^[a-zA-Z0-9_-]+$", self.username):
                raise ValueError("Username can only contain letters, numbers, underscores, and hyphens")

        if self.email is not None:
            self.email = self.email.strip().lower()
            if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", self.email):
                raise ValueError("Invalid email address format")

        return self


class PasswordChange(SQLModel):
    current_password: str
    new_password: str = Field(min_length=6, description="New password must be at least 6 characters")


class TokenResponse(SQLModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    user: UserResponse


class MessageResponse(SQLModel):
    message: str
