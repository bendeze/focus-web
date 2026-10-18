import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel
from pydantic import model_validator


class FocusSession(SQLModel, table=True):
    __tablename__ = "focus_sessions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, nullable=False)
    task_id: uuid.UUID = Field(foreign_key="tasks.id", index=True, nullable=False)
    duration_minutes: int = Field(default=25, nullable=False)
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    ended_at: Optional[datetime] = Field(default=None, nullable=True)
    status: str = Field(default="active", index=True, nullable=False)  # active, paused, completed, cancelled
    actual_focus_seconds: int = Field(default=0, nullable=False)
    auto_complete_task: bool = Field(default=True, nullable=False)
    notes: Optional[str] = Field(default=None, nullable=True)
    is_deleted: bool = Field(default=False, index=True, nullable=False)
    deleted_at: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)


class FocusStartRequest(SQLModel):
    task_id: uuid.UUID
    duration_minutes: Optional[int] = 25
    auto_complete_task: Optional[bool] = True

    @model_validator(mode="after")
    def validate_start(self) -> "FocusStartRequest":
        if self.duration_minutes is not None and self.duration_minutes <= 0:
            raise ValueError("Duration minutes must be greater than 0")
        return self


class FocusCompleteRequest(SQLModel):
    actual_focus_seconds: Optional[int] = None
    notes: Optional[str] = None

    @model_validator(mode="after")
    def validate_complete(self) -> "FocusCompleteRequest":
        if self.actual_focus_seconds is not None and self.actual_focus_seconds < 0:
            raise ValueError("Actual focus seconds cannot be negative")
        return self


class FocusPauseRequest(SQLModel):
    actual_focus_seconds: Optional[int] = None

    @model_validator(mode="after")
    def validate_pause(self) -> "FocusPauseRequest":
        if self.actual_focus_seconds is not None and self.actual_focus_seconds < 0:
            raise ValueError("Actual focus seconds cannot be negative")
        return self


class FocusSessionResponse(SQLModel):
    id: uuid.UUID
    user_id: uuid.UUID
    task_id: uuid.UUID
    duration_minutes: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: str
    actual_focus_seconds: int
    auto_complete_task: bool
    notes: Optional[str] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime



class FocusStatsResponse(SQLModel):
    total_focus_minutes: int
    total_sessions_count: int
    completed_sessions_count: int
    completed_tasks_count: int
    active_session: Optional[FocusSessionResponse] = None
