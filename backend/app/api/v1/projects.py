import uuid
from datetime import datetime, timezone
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlmodel import Session, select, func

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.project import (
    Project,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.models.task import Task, TaskResponse
from app.models.focus import FocusSession

router = APIRouter(prefix="/projects", tags=["Projects"])


from collections import defaultdict


def _batch_calculate_project_stats(db: Session, projects: list[Project]) -> list[ProjectResponse]:
    if not projects:
        return []

    project_ids = [p.id for p in projects]
    tasks = db.exec(
        select(Task).where(
            Task.project_id.in_(project_ids),  # type: ignore
            Task.is_deleted == False
        )
    ).all()

    tasks_by_project: dict[uuid.UUID, list[Task]] = defaultdict(list)
    all_task_ids: list[uuid.UUID] = []
    for t in tasks:
        if t.project_id:
            tasks_by_project[t.project_id].append(t)
            all_task_ids.append(t.id)

    sessions_by_task: dict[uuid.UUID, list[FocusSession]] = defaultdict(list)
    if all_task_ids:
        focus_sessions = db.exec(
            select(FocusSession).where(
                FocusSession.task_id.in_(all_task_ids),  # type: ignore
                FocusSession.is_deleted == False,
                FocusSession.status == "completed"
            )
        ).all()
        for s in focus_sessions:
            sessions_by_task[s.task_id].append(s)

    responses: list[ProjectResponse] = []
    for project in projects:
        project_tasks = tasks_by_project.get(project.id, [])
        total_tasks = len(project_tasks)
        completed_tasks = sum(1 for t in project_tasks if t.status == "completed")

        total_seconds = 0
        for t in project_tasks:
            for s in sessions_by_task.get(t.id, []):
                total_seconds += s.actual_focus_seconds or (s.duration_minutes * 60)
        total_focus_minutes = total_seconds // 60

        responses.append(
            ProjectResponse(
                id=project.id,
                user_id=project.user_id,
                title=project.title,
                description=project.description,
                status=project.status,
                color=project.color,
                icon=project.icon,
                is_deleted=project.is_deleted,
                deleted_at=project.deleted_at,
                created_at=project.created_at,
                updated_at=project.updated_at,
                total_tasks=total_tasks,
                completed_tasks=completed_tasks,
                total_focus_minutes=total_focus_minutes,
            )
        )
    return responses


def _calculate_project_stats(db: Session, project: Project) -> ProjectResponse:
    return _batch_calculate_project_stats(db, [project])[0]


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project or planning goal"
)
def create_project(
    project_in: ProjectCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    x_idempotency_key: Annotated[
        Optional[str],
        Header(
            alias="X-Idempotency-Key",
            description="Optional UUID idempotency key for safe offline retry",
        ),
    ] = None,
) -> ProjectResponse:
    parsed_id: Optional[uuid.UUID] = None
    if x_idempotency_key:
        try:
            parsed_id = uuid.UUID(x_idempotency_key)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid X-Idempotency-Key format. Must be a valid UUID string."
            )
        existing_project = db.get(Project, parsed_id)
        if existing_project:
            if existing_project.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Idempotency key collision with another user's project"
                )
            return _calculate_project_stats(db, existing_project)

    now = datetime.now(timezone.utc)
    project = Project(
        id=parsed_id or uuid.uuid4(),
        user_id=current_user.id,
        title=project_in.title,
        description=project_in.description,
        status=project_in.status or "active",
        color=project_in.color,
        icon=project_in.icon,
        is_deleted=False,
        created_at=now,
        updated_at=now,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return _calculate_project_stats(db, project)


@router.get(
    "",
    response_model=list[ProjectResponse],
    summary="List all projects for authenticated user with delta sync support"
)
def list_projects(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    status: Optional[str] = Query(None, description="Filter by status: active, completed, archived"),
    updated_after: Optional[datetime] = Query(None, description="ISO-8601 timestamp for delta sync"),
    include_deleted: Optional[bool] = Query(None, description="Include soft-deleted items (defaults to True if updated_after is set, False otherwise)"),
) -> list[ProjectResponse]:
    query = select(Project).where(Project.user_id == current_user.id)

    if updated_after is not None:
        query = query.where(Project.updated_at >= updated_after)
        should_include_deleted = True if include_deleted is None else include_deleted
    else:
        should_include_deleted = False if include_deleted is None else include_deleted

    if not should_include_deleted:
        query = query.where(Project.is_deleted == False)

    if status:
        query = query.where(Project.status == status)

    query = query.order_by(Project.updated_at.desc()) # type: ignore

    projects = db.exec(query).all()
    return _batch_calculate_project_stats(db, list(projects))


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get project details"
)
def get_project(
    project_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ProjectResponse:
    project = db.get(Project, project_id)
    if not project or project.user_id != current_user.id or project.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return _calculate_project_stats(db, project)


@router.patch(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update project details"
)
def update_project(
    project_id: uuid.UUID,
    project_update: ProjectUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ProjectResponse:
    project = db.get(Project, project_id)
    if not project or project.user_id != current_user.id or project.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    if project_update.title is not None:
        project.title = project_update.title
    if project_update.description is not None:
        project.description = project_update.description
    if project_update.status is not None:
        project.status = project_update.status
    if project_update.color is not None:
        project.color = project_update.color
    if project_update.icon is not None:
        project.icon = project_update.icon

    project.updated_at = datetime.now(timezone.utc)
    db.add(project)
    db.commit()
    db.refresh(project)

    return _calculate_project_stats(db, project)


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete a project"
)
def delete_project(
    project_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    project = db.get(Project, project_id)
    if not project or project.user_id != current_user.id or project.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    now = datetime.now(timezone.utc)
    project.is_deleted = True
    project.deleted_at = now
    project.updated_at = now
    db.add(project)

    # Soft delete associated non-deleted tasks and their focus sessions
    tasks = db.exec(select(Task).where(Task.project_id == project_id, Task.is_deleted == False)).all()
    for t in tasks:
        t.is_deleted = True
        t.deleted_at = now
        t.updated_at = now
        db.add(t)

        sessions = db.exec(select(FocusSession).where(FocusSession.task_id == t.id, FocusSession.is_deleted == False)).all()
        for s in sessions:
            s.is_deleted = True
            s.deleted_at = now
            s.updated_at = now
            db.add(s)

    db.commit()
    return None

