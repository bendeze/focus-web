import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel
from pydantic import model_validator


class Task(SQLModel, table=True):
    __tablename__ = "tasks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, nullable=False)
    project_id: Optional[uuid.UUID] = Field(default=None, foreign_key="projects.id", index=True, nullable=True)
    title: str = Field(index=True, nullable=False)
    description: Optional[str] = Field(default=None, nullable=True)
    status: str = Field(default="todo", index=True, nullable=False)  # todo, in_progress, completed, cancelled
    priority: str = Field(default="medium", index=True, nullable=False)  # low, medium, high, urgent
    estimated_minutes: int = Field(default=25, nullable=False)
    order_index: int = Field(default=0, nullable=False)
    completed_at: Optional[datetime] = Field(default=None, nullable=True)
    is_deleted: bool = Field(default=False, index=True, nullable=False)
    deleted_at: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)


class TaskCreate(SQLModel):
    title: str = Field(min_length=1, max_length=255, description="Actionable task title")
    description: Optional[str] = None
    project_id: Optional[uuid.UUID] = None
    priority: Optional[str] = "medium"
    estimated_minutes: Optional[int] = 25
    order_index: Optional[int] = 0

    @model_validator(mode="after")
    def validate_create(self) -> "TaskCreate":
        self.title = self.title.strip()
        if not self.title:
            raise ValueError("Task title cannot be empty")
        valid_priorities = {"low", "medium", "high", "urgent"}
        if self.priority and self.priority not in valid_priorities:
            raise ValueError(f"Priority must be one of {valid_priorities}")
        if self.estimated_minutes is not None and self.estimated_minutes <= 0:
            raise ValueError("Estimated minutes must be greater than 0")
        return self


class TaskUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[uuid.UUID] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    estimated_minutes: Optional[int] = None
    order_index: Optional[int] = None

    @model_validator(mode="after")
    def validate_update(self) -> "TaskUpdate":
        if self.title is not None:
            self.title = self.title.strip()
            if not self.title:
                raise ValueError("Task title cannot be empty")
        if self.status is not None:
            valid_statuses = {"todo", "in_progress", "completed", "cancelled"}
            if self.status not in valid_statuses:
                raise ValueError(f"Status must be one of {valid_statuses}")
        if self.priority is not None:
            valid_priorities = {"low", "medium", "high", "urgent"}
            if self.priority not in valid_priorities:
                raise ValueError(f"Priority must be one of {valid_priorities}")
        if self.estimated_minutes is not None and self.estimated_minutes <= 0:
            raise ValueError("Estimated minutes must be greater than 0")
        return self


class TaskResponse(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    project_id: Optional[uuid.UUID] = None
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    estimated_minutes: int
    order_index: int
    completed_at: Optional[datetime] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    total_focus_minutes: int = 0
    focus_session_count: int = 0



class TaskReorderItem(SQLModel):
    task_id: uuid.UUID
    order_index: int


class TaskReorderRequest(SQLModel):
    items: list[TaskReorderItem]
