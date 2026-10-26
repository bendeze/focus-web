import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlmodel import Field, SQLModel
from app.models.user import UserResponse


class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_logs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), index=True, nullable=False)
    action: str = Field(index=True, nullable=False)
    actor: str = Field(nullable=False)
    severity: str = Field(default="info", nullable=False)  # info, success, warning, danger
    details: str = Field(nullable=False)
    ip_address: str = Field(default="127.0.0.1", nullable=False)


class AuditLogResponse(SQLModel):
    id: uuid.UUID
    timestamp: datetime
    action: str
    actor: str
    severity: str
    details: str
    ip_address: str


class PlatformConfigModel(SQLModel, table=True):
    __tablename__ = "platform_config"

    id: int = Field(default=1, primary_key=True)
    allow_registrations: bool = Field(default=True, nullable=False)
    maintenance_mode: bool = Field(default=False, nullable=False)
    guest_mode_enabled: bool = Field(default=True, nullable=False)
    enforce_email_verification: bool = Field(default=False, nullable=False)
    default_focus_duration: int = Field(default=25, nullable=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)


class PlatformConfigResponse(SQLModel):
    allow_registrations: bool
    maintenance_mode: bool
    guest_mode_enabled: bool
    enforce_email_verification: bool
    default_focus_duration: int


class PlatformConfigUpdate(SQLModel):
    allow_registrations: Optional[bool] = None
    maintenance_mode: Optional[bool] = None
    guest_mode_enabled: Optional[bool] = None
    enforce_email_verification: Optional[bool] = None
    default_focus_duration: Optional[int] = None


class AdminUserDetail(UserResponse):
    total_focus_minutes: int = 0
    tasks_count: int = 0
    status: str = "active"
    last_active: Optional[str] = None


class AdminCreateUser(SQLModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    role: str = "user"
    is_active: bool = True


class AdminUpdateUser(SQLModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None


class AdminPasswordReset(SQLModel):
    new_password: Optional[str] = None


class AdminStatsResponse(SQLModel):
    total_users: int
    active_users: int
    admin_users: int
    total_focus_minutes: int
    total_focus_hours: float
    total_tasks: int
    completed_tasks: int
    completion_rate: int
    total_projects: int
    system_status: str
    daily_focus_activity: List[Dict[str, Any]]
    hourly_distribution: List[Dict[str, Any]]


class AdminProjectCreate(SQLModel):
    title: str
    description: Optional[str] = None
    user_id: Optional[uuid.UUID] = None
    status: Optional[str] = "active"
    color: Optional[str] = None
    icon: Optional[str] = None


class AdminProjectUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None

