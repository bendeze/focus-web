import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel
from pydantic import model_validator


class Project(SQLModel, table=True):
    __tablename__ = "projects"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, nullable=False)
    title: str = Field(index=True, nullable=False)
    description: Optional[str] = Field(default=None, nullable=True)
    status: str = Field(default="active", index=True, nullable=False)  # active, completed, archived
    color: Optional[str] = Field(default=None, nullable=True)
    icon: Optional[str] = Field(default=None, nullable=True)
    is_deleted: bool = Field(default=False, index=True, nullable=False)
    deleted_at: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)


class ProjectCreate(SQLModel):
    title: str = Field(min_length=1, max_length=200, description="Project title")
    description: Optional[str] = None
    status: Optional[str] = "active"
    color: Optional[str] = None
    icon: Optional[str] = None

    @model_validator(mode="after")
    def validate_create(self) -> "ProjectCreate":
        self.title = self.title.strip()
        if not self.title:
            raise ValueError("Project title cannot be empty")
        valid_statuses = {"active", "completed", "archived"}
        if self.status and self.status not in valid_statuses:
            raise ValueError(f"Status must be one of {valid_statuses}")
        return self


class ProjectUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None

    @model_validator(mode="after")
    def validate_update(self) -> "ProjectUpdate":
        if self.title is not None:
            self.title = self.title.strip()
            if not self.title:
                raise ValueError("Project title cannot be empty")
        if self.status is not None:
            valid_statuses = {"active", "completed", "archived"}
            if self.status not in valid_statuses:
                raise ValueError(f"Status must be one of {valid_statuses}")
        return self


class ProjectResponse(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: Optional[str] = None
    status: str
    color: Optional[str] = None
    icon: Optional[str] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    total_tasks: int = 0
    completed_tasks: int = 0
    total_focus_minutes: int = 0

