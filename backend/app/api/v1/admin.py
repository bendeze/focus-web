import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlmodel import Session, select, func

from app.api.deps import get_current_admin_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User, UserResponse
from app.models.task import Task
from app.models.project import Project
from app.models.focus import FocusSession
from app.models.admin import (
    AuditLog,
    AuditLogResponse,
    PlatformConfigModel,
    PlatformConfigResponse,
    PlatformConfigUpdate,
    AdminUserDetail,
    AdminCreateUser,
    AdminUpdateUser,
    AdminPasswordReset,
    AdminStatsResponse,
    AdminProjectCreate,
    AdminProjectUpdate,
)

router = APIRouter(prefix="/admin", tags=["Administrator Console"])


from app.services.audit import log_audit_event as _log_audit_event, get_client_ip



def _get_or_create_config(db: Session) -> PlatformConfigModel:
    config = db.exec(select(PlatformConfigModel).where(PlatformConfigModel.id == 1)).first()
    if not config:
        config = PlatformConfigModel(
            id=1,
            allow_registrations=True,
            maintenance_mode=False,
            guest_mode_enabled=True,
            enforce_email_verification=False,
            default_focus_duration=25,
            updated_at=datetime.now(timezone.utc),
        )
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


@router.get("/stats", response_model=AdminStatsResponse, summary="Get global administrative statistics")
def get_admin_stats(
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    db: Annotated[Session, Depends(get_db)],
) -> AdminStatsResponse:
    # User counts
    all_users = db.exec(select(User)).all()
    total_users = len(all_users)
    active_users = sum(1 for u in all_users if u.is_active)
    admin_users = sum(1 for u in all_users if u.is_admin or u.role == "admin")

    # Focus Sessions
    sessions = db.exec(select(FocusSession).where(FocusSession.is_deleted == False)).all()
    total_seconds = sum(s.actual_focus_seconds for s in sessions)
    total_focus_minutes = total_seconds // 60
    if total_focus_minutes == 0 and sessions:
        total_focus_minutes = sum(s.duration_minutes for s in sessions if s.status == "completed")
    total_focus_hours = round(total_focus_minutes / 60, 1)

    # Tasks
    tasks = db.exec(select(Task).where(Task.is_deleted == False)).all()
    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == "completed")
    completion_rate = round((completed_tasks / total_tasks * 100)) if total_tasks > 0 else 0

    # Projects
    projects = db.exec(select(Project).where(Project.is_deleted == False)).all()
    total_projects = len(projects)

    # Daily Focus Activity (Last 7 days)
    now = datetime.now(timezone.utc)
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    daily_focus_activity = []

    for i in range(6, -1, -1):
        target_date = (now - timedelta(days=i)).date()
        day_sessions = [
            s for s in sessions
            if s.started_at and s.started_at.date() == target_date
        ]
        day_minutes = sum(s.actual_focus_seconds // 60 or s.duration_minutes for s in day_sessions)
        day_hours = round(day_minutes / 60, 1)
        day_label = day_names[target_date.weekday()]
        daily_focus_activity.append({
            "day": day_label,
            "focusHours": day_hours,
            "sessions": len(day_sessions),
        })

    # Hourly Focus Distribution (07h to 20h)
    hourly_distribution = []
    for h in range(7, 21):
        hour_label = f"{h:02d}h"
        count = sum(1 for s in sessions if s.started_at and s.started_at.hour == h)
        hourly_distribution.append({
            "hour": hour_label,
            "sessions": count,
        })

    return AdminStatsResponse(
        total_users=total_users,
        active_users=active_users,
        admin_users=admin_users,
        total_focus_minutes=total_focus_minutes,
        total_focus_hours=total_focus_hours,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        completion_rate=completion_rate,
        total_projects=total_projects,
        system_status="healthy",
        daily_focus_activity=daily_focus_activity,
        hourly_distribution=hourly_distribution,
    )


@router.get("/users", response_model=List[AdminUserDetail], summary="List all system users for admin")
def list_admin_users(
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    db: Annotated[Session, Depends(get_db)],
) -> List[AdminUserDetail]:
    users = db.exec(select(User).order_by(User.created_at.desc())).all()
    tasks = db.exec(select(Task).where(Task.is_deleted == False)).all()
    sessions = db.exec(select(FocusSession).where(FocusSession.is_deleted == False)).all()

    # Pre-aggregate tasks by user
    tasks_count_by_user: dict[uuid.UUID, int] = {}
    for t in tasks:
        tasks_count_by_user[t.user_id] = tasks_count_by_user.get(t.user_id, 0) + 1

    # Pre-aggregate focus minutes by user
    focus_minutes_by_user: dict[uuid.UUID, int] = {}
    for s in sessions:
        mins = s.actual_focus_seconds // 60 or (s.duration_minutes if s.status == "completed" else 0)
        focus_minutes_by_user[s.user_id] = focus_minutes_by_user.get(s.user_id, 0) + mins

    results = []
    for u in users:
        is_adm = (
            u.is_admin or
            u.role == "admin" or
            (settings.ADMIN_EMAIL and u.email and u.email.lower() == settings.ADMIN_EMAIL.lower()) or
            (settings.ADMIN_USERNAME and u.username and u.username.lower() == settings.ADMIN_USERNAME.lower())
        )
        results.append(
            AdminUserDetail(
                id=u.id,
                username=u.username,
                email=u.email,
                full_name=u.full_name,
                avatar_url=u.avatar_url,
                is_active=u.is_active,
                role="admin" if is_adm else (u.role or "user"),
                is_admin=is_adm,
                created_at=u.created_at,
                updated_at=u.updated_at,
                total_focus_minutes=focus_minutes_by_user.get(u.id, 0),
                tasks_count=tasks_count_by_user.get(u.id, 0),
                status="active" if u.is_active else "suspended",
                last_active="Active recently",
            )
        )
    return results


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Create a new user as admin")
def create_user_as_admin(
    user_in: AdminCreateUser,
    request: Request,
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserResponse:
    # Check uniqueness
    clean_username = user_in.username.strip().lower()
    clean_email = user_in.email.strip().lower()

    if db.exec(select(User).where(User.username == clean_username)).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")
    if db.exec(select(User).where(User.email == clean_email)).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    is_adm = user_in.role == "admin"
    user = User(
        username=clean_username,
        email=clean_email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        is_active=user_in.is_active,
        role=user_in.role,
        is_admin=is_adm,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    client_ip = request.client.host if request.client else "127.0.0.1"
    _log_audit_event(
        db,
        action="USER_PROVISIONED",
        actor=current_admin.username or "Admin",
        details=f"User @{user.username} created with role '{user.role}'",
        severity="success",
        ip_address=client_ip,
    )

    return UserResponse.model_validate(user)


@router.patch("/users/{user_id}", response_model=UserResponse, summary="Update user role or status as admin")
def update_user_as_admin(
    user_id: uuid.UUID,
    user_update: AdminUpdateUser,
    request: Request,
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserResponse:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    client_ip = request.client.host if request.client else "127.0.0.1"
    changes = []

    if user_update.full_name is not None:
        user.full_name = user_update.full_name
        changes.append("full_name")

    if user_update.role is not None:
        user.role = user_update.role
        user.is_admin = (user_update.role == "admin")
        changes.append(f"role={user.role}")

    if user_update.is_admin is not None:
        user.is_admin = user_update.is_admin
        if user_update.is_admin:
            user.role = "admin"
        changes.append(f"is_admin={user.is_admin}")

    if user_update.is_active is not None:
        user.is_active = user_update.is_active
        action_name = "USER_ACTIVATED" if user.is_active else "USER_SUSPENDED"
        severity = "success" if user.is_active else "warning"
        changes.append(f"is_active={user.is_active}")
        _log_audit_event(
            db,
            action=action_name,
            actor=current_admin.username or "Admin",
            details=f"Account @{user.username} status set to is_active={user.is_active}",
            severity=severity,
            ip_address=client_ip,
        )

    user.updated_at = datetime.now(timezone.utc)
    db.add(user)
    db.commit()
    db.refresh(user)

    if changes and "is_active" not in changes[0]:
        _log_audit_event(
            db,
            action="USER_MODIFIED",
            actor=current_admin.username or "Admin",
            details=f"Account @{user.username} updated: {', '.join(changes)}",
            severity="info",
            ip_address=client_ip,
        )

    return UserResponse.model_validate(user)


@router.post("/users/{user_id}/reset-password", summary="Reset a user password as admin")
def reset_user_password_as_admin(
    user_id: uuid.UUID,
    data: AdminPasswordReset,
    request: Request,
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    new_pwd = data.new_password or f"Fcs!{secrets.token_hex(4)}#"
    user.hashed_password = get_password_hash(new_pwd)
    user.updated_at = datetime.now(timezone.utc)
    db.add(user)
    db.commit()

    client_ip = request.client.host if request.client else "127.0.0.1"
    _log_audit_event(
        db,
        action="PASSWORD_RESET_BY_ADMIN",
        actor=current_admin.username or "Admin",
        details=f"Temporary password generated for user @{user.username}",
        severity="warning",
        ip_address=client_ip,
    )

    return {
        "message": f"Password reset successfully for @{user.username}",
        "temporary_password": new_pwd,
    }


@router.delete("/users/{user_id}", summary="Delete or deactivate user as admin")
def delete_user_as_admin(
    user_id: uuid.UUID,
    request: Request,
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    db: Annotated[Session, Depends(get_db)],
    hard_delete: bool = Query(False, description="If True, permanently deletes user and cascades deletion of tasks, projects, and focus sessions"),
) -> dict:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == current_admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own admin account")

    username = user.username or user.email or str(user_id)
    client_ip = request.client.host if request.client else "127.0.0.1"

    if hard_delete:
        # Cascade delete child records in reverse dependency order
        # 1. Focus sessions
        sessions = db.exec(select(FocusSession).where(FocusSession.user_id == user_id)).all()
        for s in sessions:
            db.delete(s)

        # 2. Tasks
        tasks = db.exec(select(Task).where(Task.user_id == user_id)).all()
        for t in tasks:
            db.delete(t)

        # 3. Projects
        projects = db.exec(select(Project).where(Project.user_id == user_id)).all()
        for p in projects:
            db.delete(p)

        # 4. User record
        db.delete(user)
        db.commit()

        _log_audit_event(
            db,
            action="USER_HARD_DELETED",
            actor=current_admin.username or "Admin",
            details=f"User @{username} permanently expunged from database ({len(tasks)} tasks, {len(projects)} projects, {len(sessions)} focus sessions purged)",
            severity="danger",
            ip_address=client_ip,
        )

        return {
            "message": f"User @{username} permanently deleted from database",
            "hard_deleted": True,
            "purged_records": {
                "tasks": len(tasks),
                "projects": len(projects),
                "focus_sessions": len(sessions),
            },
        }

    # Soft delete / deactivation
    user.is_active = False
    user.updated_at = datetime.now(timezone.utc)
    db.add(user)
    db.commit()

    _log_audit_event(
        db,
        action="USER_DELETED",
        actor=current_admin.username or "Admin",
        details=f"User @{username} deactivated and suspended from workspace",
        severity="warning",
        ip_address=client_ip,
    )

    return {"message": f"User @{username} deactivated", "hard_deleted": False}


@router.get("/tasks", summary="List global tasks across all projects for admin")
def list_all_tasks_for_admin(
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    db: Annotated[Session, Depends(get_db)],
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    limit: int = 100,
    offset: int = 0,
) -> List[dict]:
    statement = select(Task).where(Task.is_deleted == False)
    if status_filter:
        statement = statement.where(Task.status == status_filter)
    if priority_filter:
        statement = statement.where(Task.priority == priority_filter)

    statement = statement.order_by(Task.created_at.desc()).offset(offset).limit(limit)
    tasks = db.exec(statement).all()

    # Pre-fetch projects
    projects = {p.id: p for p in db.exec(select(Project)).all()}
    users = {u.id: u for u in db.exec(select(User)).all()}

    output = []
    for t in tasks:
        p = projects.get(t.project_id) if t.project_id else None
        u = users.get(t.user_id) if t.user_id else None
        output.append({
            "id": str(t.id),
            "user_id": str(t.user_id),
            "username": u.username if u else "unknown",
            "project_id": str(t.project_id) if t.project_id else None,
            "project_title": p.title if p else None,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "priority": t.priority,
            "estimated_minutes": t.estimated_minutes,
            "created_at": t.created_at.isoformat(),
            "updated_at": t.updated_at.isoformat(),
        })
    return output


@router.get("/projects", summary="List global projects across all users for admin")
def list_all_projects_for_admin(
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    db: Annotated[Session, Depends(get_db)],
    status_filter: Annotated[Optional[str], Query(alias="status")] = None,
    user_id_filter: Annotated[Optional[str], Query(alias="user_id")] = None,
    limit: Annotated[int, Query()] = 100,
    offset: Annotated[int, Query()] = 0,
) -> List[dict]:
    statement = select(Project).where(Project.is_deleted == False)
    if status_filter:
        statement = statement.where(Project.status == status_filter)
    if user_id_filter:
        try:
            target_uid = uuid.UUID(user_id_filter)
            statement = statement.where(Project.user_id == target_uid)
        except ValueError:
            pass

    statement = statement.order_by(Project.created_at.desc()).offset(offset).limit(limit)
    projects = db.exec(statement).all()

    users = {u.id: u for u in db.exec(select(User)).all()}
    tasks = db.exec(select(Task).where(Task.is_deleted == False)).all()

    # Pre-fetch completed focus sessions for all tasks to calculate project focus time safely
    sessions = db.exec(
        select(FocusSession).where(
            FocusSession.is_deleted == False,
            FocusSession.status == "completed"
        )
    ).all()
    sessions_by_task: dict[uuid.UUID, int] = {}
    for s in sessions:
        if s.task_id:
            mins = (s.actual_focus_seconds or (s.duration_minutes * 60)) // 60
            sessions_by_task[s.task_id] = sessions_by_task.get(s.task_id, 0) + mins

    output = []
    for p in projects:
        u = users.get(p.user_id) if p.user_id else None
        p_tasks = [t for t in tasks if t.project_id == p.id]
        completed_tasks = sum(1 for t in p_tasks if t.status == "completed")
        total_focus_minutes = sum(
            sessions_by_task.get(t.id, 0) or (t.estimated_minutes if t.status == "completed" else 0)
            for t in p_tasks
        )

        output.append({
            "id": str(p.id),
            "user_id": str(p.user_id),
            "username": u.username if u else "unknown",
            "user_email": u.email if u else None,
            "title": p.title,
            "description": p.description,
            "status": p.status,
            "color": p.color,
            "icon": p.icon,
            "is_deleted": p.is_deleted,
            "deleted_at": p.deleted_at.isoformat() if p.deleted_at else None,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat(),
            "total_tasks": len(p_tasks),
            "completed_tasks": completed_tasks,
            "total_focus_minutes": total_focus_minutes,
        })
    return output


@router.post("/projects", summary="Create project as administrator")
def create_project_for_admin(
    project_in: AdminProjectCreate,
    request: Request,
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    target_user_id = project_in.user_id or current_admin.id
    target_user = db.get(User, target_user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned user not found"
        )

    project = Project(
        user_id=target_user_id,
        title=project_in.title.strip(),
        description=project_in.description.strip() if project_in.description else None,
        status=project_in.status or "active",
        color=project_in.color,
        icon=project_in.icon,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    client_ip = request.client.host if request.client else "127.0.0.1"
    _log_audit_event(
        db,
        action="PROJECT_CREATED",
        actor=current_admin.username or "Admin",
        details=f"Project '{project.title}' provisioned for @{target_user.username}",
        severity="info",
        ip_address=client_ip,
    )

    return {
        "id": str(project.id),
        "user_id": str(project.user_id),
        "username": target_user.username,
        "user_email": target_user.email,
        "title": project.title,
        "description": project.description,
        "status": project.status,
        "color": project.color,
        "icon": project.icon,
        "is_deleted": False,
        "deleted_at": None,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
        "total_tasks": 0,
        "completed_tasks": 0,
        "total_focus_minutes": 0,
    }


@router.patch("/projects/{project_id}", summary="Update project as administrator")
def update_project_for_admin(
    project_id: str,
    project_update: AdminProjectUpdate,
    request: Request,
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    try:
        p_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID format")

    project = db.get(Project, p_uuid)
    if not project or project.is_deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    changes = []
    if project_update.title is not None and project_update.title.strip():
        project.title = project_update.title.strip()
        changes.append("title")
    if project_update.description is not None:
        project.description = project_update.description.strip() if project_update.description.strip() else None
        changes.append("description")
    if project_update.status is not None and project_update.status in {"active", "completed", "archived"}:
        project.status = project_update.status
        changes.append(f"status={project.status}")
    if project_update.color is not None:
        project.color = project_update.color
        changes.append("color")
    if project_update.icon is not None:
        project.icon = project_update.icon
        changes.append("icon")

    project.updated_at = datetime.now(timezone.utc)
    db.add(project)
    db.commit()
    db.refresh(project)

    user = db.get(User, project.user_id)
    tasks = db.exec(select(Task).where(Task.project_id == project.id, Task.is_deleted == False)).all()
    completed_tasks = sum(1 for t in tasks if t.status == "completed")
    task_ids = [t.id for t in tasks]
    total_seconds = 0
    if task_ids:
        sessions = db.exec(
            select(FocusSession).where(
                FocusSession.task_id.in_(task_ids),  # type: ignore
                FocusSession.is_deleted == False,
                FocusSession.status == "completed"
            )
        ).all()
        total_seconds = sum(s.actual_focus_seconds or (s.duration_minutes * 60) for s in sessions)
    total_focus_minutes = total_seconds // 60

    client_ip = request.client.host if request.client else "127.0.0.1"
    _log_audit_event(
        db,
        action="PROJECT_UPDATED",
        actor=current_admin.username or "Admin",
        details=f"Project '{project.title}' modified ({', '.join(changes) if changes else 'no changes'})",
        severity="info",
        ip_address=client_ip,
    )

    return {
        "id": str(project.id),
        "user_id": str(project.user_id),
        "username": user.username if user else "unknown",
        "user_email": user.email if user else None,
        "title": project.title,
        "description": project.description,
        "status": project.status,
        "color": project.color,
        "icon": project.icon,
        "is_deleted": project.is_deleted,
        "deleted_at": project.deleted_at.isoformat() if project.deleted_at else None,
        "created_at": project.created_at.isoformat(),
        "updated_at": project.updated_at.isoformat(),
        "total_tasks": len(tasks),
        "completed_tasks": completed_tasks,
        "total_focus_minutes": total_focus_minutes,
    }


@router.delete("/projects/{project_id}", summary="Delete or archive project as administrator")
def delete_project_for_admin(
    project_id: str,
    request: Request,
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    db: Annotated[Session, Depends(get_db)],
    hard_delete: bool = Query(False, alias="hard_delete"),
) -> dict:
    try:
        p_uuid = uuid.UUID(project_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid project ID format")

    project = db.get(Project, p_uuid)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    client_ip = request.client.host if request.client else "127.0.0.1"
    project_title = project.title

    if hard_delete:
        tasks = db.exec(select(Task).where(Task.project_id == project.id)).all()
        for t in tasks:
            db.delete(t)
        db.delete(project)
        db.commit()

        _log_audit_event(
            db,
            action="PROJECT_HARD_DELETED",
            actor=current_admin.username or "Admin",
            details=f"Project '{project_title}' and {len(tasks)} associated tasks permanently purged",
            severity="danger",
            ip_address=client_ip,
        )
        return {"message": f"Project '{project_title}' permanently purged", "hard_deleted": True}

    project.is_deleted = True
    project.deleted_at = datetime.now(timezone.utc)
    project.updated_at = datetime.now(timezone.utc)
    db.add(project)
    db.commit()

    _log_audit_event(
        db,
        action="PROJECT_DELETED",
        actor=current_admin.username or "Admin",
        details=f"Project '{project_title}' deleted (soft delete)",
        severity="warning",
        ip_address=client_ip,
    )
    return {"message": f"Project '{project_title}' deleted", "hard_deleted": False}


@router.get("/audit-logs", response_model=List[AuditLogResponse], summary="Get system audit trail")
def get_audit_logs(
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    db: Annotated[Session, Depends(get_db)],
    limit: int = 50,
) -> List[AuditLogResponse]:
    logs = db.exec(select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit)).all()
    return [AuditLogResponse.model_validate(l) for l in logs]


@router.delete("/audit-logs", summary="Clear system audit trail")
def clear_audit_logs(
    request: Request,
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    logs = db.exec(select(AuditLog)).all()
    for l in logs:
        db.delete(l)
    db.commit()

    client_ip = request.client.host if request.client else "127.0.0.1"
    _log_audit_event(
        db,
        action="AUDIT_LOGS_PURGED",
        actor=current_admin.username or "Admin",
        details="Security audit logs cleared by administrator",
        severity="warning",
        ip_address=client_ip,
    )
    return {"message": "Audit logs cleared successfully"}


@router.get("/config", response_model=PlatformConfigResponse, summary="Get global platform configuration")
def get_platform_config(
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    db: Annotated[Session, Depends(get_db)],
) -> PlatformConfigResponse:
    config = _get_or_create_config(db)
    return PlatformConfigResponse(
        allow_registrations=config.allow_registrations,
        maintenance_mode=config.maintenance_mode,
        guest_mode_enabled=config.guest_mode_enabled,
        enforce_email_verification=config.enforce_email_verification,
        default_focus_duration=config.default_focus_duration,
    )


@router.patch("/config", response_model=PlatformConfigResponse, summary="Update global platform configuration")
def update_platform_config(
    config_update: PlatformConfigUpdate,
    request: Request,
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    db: Annotated[Session, Depends(get_db)],
) -> PlatformConfigResponse:
    config = _get_or_create_config(db)
    changes = []

    if config_update.allow_registrations is not None:
        config.allow_registrations = config_update.allow_registrations
        changes.append(f"allow_registrations={config.allow_registrations}")

    if config_update.maintenance_mode is not None:
        config.maintenance_mode = config_update.maintenance_mode
        changes.append(f"maintenance_mode={config.maintenance_mode}")

    if config_update.guest_mode_enabled is not None:
        config.guest_mode_enabled = config_update.guest_mode_enabled
        changes.append(f"guest_mode_enabled={config.guest_mode_enabled}")

    if config_update.enforce_email_verification is not None:
        config.enforce_email_verification = config_update.enforce_email_verification
        changes.append(f"enforce_email_verification={config.enforce_email_verification}")

    if config_update.default_focus_duration is not None:
        config.default_focus_duration = config_update.default_focus_duration
        changes.append(f"default_focus_duration={config.default_focus_duration}")

    config.updated_at = datetime.now(timezone.utc)
    db.add(config)
    db.commit()
    db.refresh(config)

    client_ip = request.client.host if request.client else "127.0.0.1"
    _log_audit_event(
        db,
        action="PLATFORM_CONFIG_UPDATED",
        actor=current_admin.username or "Admin",
        details=f"Platform configuration rules updated: {', '.join(changes)}",
        severity="info",
        ip_address=client_ip,
    )

    return PlatformConfigResponse(
        allow_registrations=config.allow_registrations,
        maintenance_mode=config.maintenance_mode,
        guest_mode_enabled=config.guest_mode_enabled,
        enforce_email_verification=config.enforce_email_verification,
        default_focus_duration=config.default_focus_duration,
    )


@router.get("/export", summary="Export full system snapshot as JSON")
def export_system_data(
    current_admin: Annotated[User, Depends(get_current_admin_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    users = db.exec(select(User)).all()
    tasks = db.exec(select(Task)).all()
    projects = db.exec(select(Project)).all()
    sessions = db.exec(select(FocusSession)).all()
    logs = db.exec(select(AuditLog)).all()
    config = _get_or_create_config(db)

    return {
        "export_timestamp": datetime.now(timezone.utc).isoformat(),
        "exported_by": current_admin.username,
        "config": {
            "allow_registrations": config.allow_registrations,
            "maintenance_mode": config.maintenance_mode,
            "guest_mode_enabled": config.guest_mode_enabled,
            "enforce_email_verification": config.enforce_email_verification,
            "default_focus_duration": config.default_focus_duration,
        },
        "users": [
            {
                "id": str(u.id),
                "username": u.username,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat(),
            }
            for u in users
        ],
        "tasks_count": len(tasks),
        "projects_count": len(projects),
        "sessions_count": len(sessions),
        "audit_logs": [
            {
                "id": str(l.id),
                "action": l.action,
                "actor": l.actor,
                "severity": l.severity,
                "details": l.details,
                "timestamp": l.timestamp.isoformat(),
            }
            for l in logs
        ],
    }
