import uuid
from datetime import datetime, timezone
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.task import (
    Task,
    TaskCreate,
    TaskReorderRequest,
    TaskResponse,
    TaskUpdate,
)
from app.models.focus import FocusSession

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def _calculate_task_stats(db: Session, task: Task) -> TaskResponse:
    sessions = db.exec(
        select(FocusSession).where(
            FocusSession.task_id == task.id,
            FocusSession.is_deleted == False,
            FocusSession.status == "completed"
        )
    ).all()
    session_count = len(sessions)
    total_seconds = sum(s.actual_focus_seconds or (s.duration_minutes * 60) for s in sessions)
    total_focus_minutes = total_seconds // 60

    return TaskResponse(
        id=task.id,
        user_id=task.user_id,
        project_id=task.project_id,
        title=task.title,
        description=task.description,
        status=task.status,
        priority=task.priority,
        estimated_minutes=task.estimated_minutes,
        order_index=task.order_index,
        completed_at=task.completed_at,
        is_deleted=task.is_deleted,
        deleted_at=task.deleted_at,
        created_at=task.created_at,
        updated_at=task.updated_at,
        total_focus_minutes=total_focus_minutes,
        focus_session_count=session_count,
    )


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task (standalone or under a project)"
)
def create_task(
    task_in: TaskCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> TaskResponse:
    # If project_id is specified, verify ownership
    if task_in.project_id is not None:
        project = db.get(Project, task_in.project_id)
        if not project or project.user_id != current_user.id or project.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )

    now = datetime.now(timezone.utc)
    task = Task(
        user_id=current_user.id,
        project_id=task_in.project_id,
        title=task_in.title,
        description=task_in.description,
        status="todo",
        priority=task_in.priority or "medium",
        estimated_minutes=task_in.estimated_minutes or 25,
        order_index=task_in.order_index or 0,
        is_deleted=False,
        created_at=now,
        updated_at=now,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    return _calculate_task_stats(db, task)


@router.get(
    "",
    response_model=list[TaskResponse],
    summary="List tasks for authenticated user with delta sync support"
)
def list_tasks(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    project_id: Optional[uuid.UUID] = Query(None, description="Filter by project ID"),
    standalone: Optional[bool] = Query(None, description="Filter only standalone tasks without project"),
    status: Optional[str] = Query(None, description="Filter by status: todo, in_progress, completed, cancelled"),
    priority: Optional[str] = Query(None, description="Filter by priority: low, medium, high, urgent"),
    updated_after: Optional[datetime] = Query(None, description="ISO-8601 timestamp for delta sync"),
    include_deleted: Optional[bool] = Query(None, description="Include soft-deleted items (defaults to True if updated_after is set, False otherwise)"),
) -> list[TaskResponse]:
    query = select(Task).where(Task.user_id == current_user.id)

    if updated_after is not None:
        query = query.where(Task.updated_at >= updated_after)
        should_include_deleted = True if include_deleted is None else include_deleted
    else:
        should_include_deleted = False if include_deleted is None else include_deleted

    if not should_include_deleted:
        query = query.where(Task.is_deleted == False)

    if project_id is not None:
        query = query.where(Task.project_id == project_id)
    elif standalone is True:
        query = query.where(Task.project_id == None) # noqa: E711

    if status:
        query = query.where(Task.status == status)
    if priority:
        query = query.where(Task.priority == priority)

    query = query.order_by(Task.order_index.asc(), Task.updated_at.desc()) # type: ignore

    tasks = db.exec(query).all()
    return [_calculate_task_stats(db, t) for t in tasks]


@router.patch(
    "/reorder",
    response_model=list[TaskResponse],
    summary="Bulk reorder task backlog positions"
)
def reorder_tasks(
    reorder_in: TaskReorderRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[TaskResponse]:
    updated_tasks: list[Task] = []
    now = datetime.now(timezone.utc)
    for item in reorder_in.items:
        task = db.get(Task, item.task_id)
        if task and task.user_id == current_user.id and not task.is_deleted:
            task.order_index = item.order_index
            task.updated_at = now
            db.add(task)
            updated_tasks.append(task)

    db.commit()
    return [_calculate_task_stats(db, t) for t in updated_tasks]


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Get task details"
)
def get_task(
    task_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> TaskResponse:
    task = db.get(Task, task_id)
    if not task or task.user_id != current_user.id or task.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return _calculate_task_stats(db, task)


@router.patch(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update task details or status (Idempotent)"
)
def update_task(
    task_id: uuid.UUID,
    task_update: TaskUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> TaskResponse:
    task = db.get(Task, task_id)
    if not task or task.user_id != current_user.id or task.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Check project ownership if moving to another project
    if task_update.project_id is not None:
        project = db.get(Project, task_update.project_id)
        if not project or project.user_id != current_user.id or project.is_deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target project not found"
            )
        task.project_id = task_update.project_id

    if task_update.title is not None:
        task.title = task_update.title
    if task_update.description is not None:
        task.description = task_update.description
    if task_update.priority is not None:
        task.priority = task_update.priority
    if task_update.estimated_minutes is not None:
        task.estimated_minutes = task_update.estimated_minutes
    if task_update.order_index is not None:
        task.order_index = task_update.order_index

    # Idempotent status handling
    if task_update.status is not None:
        if task_update.status == "completed":
            task.status = "completed"
            if not task.completed_at:
                task.completed_at = datetime.now(timezone.utc)
        else:
            task.status = task_update.status
            task.completed_at = None

    task.updated_at = datetime.now(timezone.utc)
    db.add(task)
    db.commit()
    db.refresh(task)

    return _calculate_task_stats(db, task)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete a task"
)
def delete_task(
    task_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    task = db.get(Task, task_id)
    if not task or task.user_id != current_user.id or task.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    now = datetime.now(timezone.utc)
    task.is_deleted = True
    task.deleted_at = now
    task.updated_at = now
    db.add(task)

    sessions = db.exec(select(FocusSession).where(FocusSession.task_id == task_id, FocusSession.is_deleted == False)).all()
    for s in sessions:
        s.is_deleted = True
        s.deleted_at = now
        s.updated_at = now
        db.add(s)

    db.commit()
    return None

