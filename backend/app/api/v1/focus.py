import uuid
from datetime import datetime, timezone
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlmodel import Session, select, or_

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.task import Task
from app.models.focus import (
    FocusCompleteRequest,
    FocusSession,
    FocusSessionResponse,
    FocusStartRequest,
    FocusStatsResponse,
)

router = APIRouter(prefix="/focus", tags=["Focus Mode"])


@router.post(
    "/start",
    response_model=FocusSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a timed focus session for a task"
)
def start_focus_session(
    focus_in: FocusStartRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    x_idempotency_key: Annotated[
        Optional[str],
        Header(
            alias="X-Idempotency-Key",
            description="Optional UUID idempotency key for safe offline retry",
        ),
    ] = None,
) -> FocusSessionResponse:
    parsed_id: Optional[uuid.UUID] = None
    if x_idempotency_key:
        try:
            parsed_id = uuid.UUID(x_idempotency_key)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid X-Idempotency-Key format. Must be a valid UUID string."
            )
        # Check if session with this idempotency key was already created for this user
        existing_session = db.get(FocusSession, parsed_id)
        if existing_session:
            if existing_session.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Idempotency key collision with another user's focus session"
                )
            return FocusSessionResponse.model_validate(existing_session)

    # 1. Validate task ownership and active state
    task = db.get(Task, focus_in.task_id)
    if not task or task.user_id != current_user.id or task.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # 2. Check if user already has an active session
    active_session = db.exec(
        select(FocusSession).where(
            FocusSession.user_id == current_user.id,
            FocusSession.is_deleted == False,
            or_(
                FocusSession.status == "active",
                FocusSession.status == "paused"
            )
        )
    ).first()
    if active_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have an active focus session (ID: {active_session.id}). Please complete or cancel it first."
        )

    now = datetime.now(timezone.utc)

    # 3. Automatically transition task to 'in_progress' if currently 'todo'
    if task.status == "todo":
        task.status = "in_progress"
        task.updated_at = now
        db.add(task)

    # 4. Create focus session
    duration = focus_in.duration_minutes or task.estimated_minutes or 25
    auto_complete = True if focus_in.auto_complete_task is None else focus_in.auto_complete_task

    session = FocusSession(
        id=parsed_id or uuid.uuid4(),
        user_id=current_user.id,
        task_id=task.id,
        duration_minutes=duration,
        status="active",
        auto_complete_task=auto_complete,
        is_deleted=False,
        started_at=now,
        created_at=now,
        updated_at=now,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return FocusSessionResponse.model_validate(session)


@router.get(
    "/current",
    response_model=Optional[FocusSessionResponse],
    summary="Get active or paused focus session"
)
def get_current_session(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> Optional[FocusSessionResponse]:
    session = db.exec(
        select(FocusSession).where(
            FocusSession.user_id == current_user.id,
            FocusSession.is_deleted == False,
            or_(
                FocusSession.status == "active",
                FocusSession.status == "paused"
            )
        )
    ).first()
    if not session:
        return None
    return FocusSessionResponse.model_validate(session)


@router.get(
    "/sessions",
    response_model=list[FocusSessionResponse],
    summary="List focus sessions with delta sync support"
)
def list_focus_sessions(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    task_id: Optional[uuid.UUID] = Query(None, description="Filter by task ID"),
    status: Optional[str] = Query(None, description="Filter by status: active, paused, completed, cancelled"),
    updated_after: Optional[datetime] = Query(None, description="ISO-8601 timestamp for delta sync"),
    include_deleted: Optional[bool] = Query(None, description="Include soft-deleted items (defaults to True if updated_after is set, False otherwise)"),
) -> list[FocusSessionResponse]:
    query = select(FocusSession).where(FocusSession.user_id == current_user.id)

    if updated_after is not None:
        query = query.where(FocusSession.updated_at >= updated_after)
        should_include_deleted = True if include_deleted is None else include_deleted
    else:
        should_include_deleted = False if include_deleted is None else include_deleted

    if not should_include_deleted:
        query = query.where(FocusSession.is_deleted == False)

    if task_id is not None:
        query = query.where(FocusSession.task_id == task_id)
    if status:
        query = query.where(FocusSession.status == status)

    query = query.order_by(FocusSession.updated_at.desc()) # type: ignore
    sessions = db.exec(query).all()
    return [FocusSessionResponse.model_validate(s) for s in sessions]


@router.post(
    "/{session_id}/pause",
    response_model=FocusSessionResponse,
    summary="Pause active focus session (Idempotent)"
)
def pause_focus_session(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> FocusSessionResponse:
    session = db.get(FocusSession, session_id)
    if not session or session.user_id != current_user.id or session.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Focus session not found"
        )

    if session.status == "paused":
        return FocusSessionResponse.model_validate(session)

    if session.status != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot pause session in '{session.status}' state"
        )

    session.status = "paused"
    session.updated_at = datetime.now(timezone.utc)
    db.add(session)
    db.commit()
    db.refresh(session)
    return FocusSessionResponse.model_validate(session)


@router.post(
    "/{session_id}/resume",
    response_model=FocusSessionResponse,
    summary="Resume paused focus session (Idempotent)"
)
def resume_focus_session(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> FocusSessionResponse:
    session = db.get(FocusSession, session_id)
    if not session or session.user_id != current_user.id or session.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Focus session not found"
        )

    if session.status == "active":
        return FocusSessionResponse.model_validate(session)

    if session.status != "paused":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot resume session in '{session.status}' state"
        )

    session.status = "active"
    session.updated_at = datetime.now(timezone.utc)
    db.add(session)
    db.commit()
    db.refresh(session)
    return FocusSessionResponse.model_validate(session)


@router.post(
    "/{session_id}/complete",
    response_model=FocusSessionResponse,
    summary="Complete focus session and automatically mark task as completed (Idempotent)"
)
def complete_focus_session(
    session_id: uuid.UUID,
    complete_in: FocusCompleteRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> FocusSessionResponse:
    session = db.get(FocusSession, session_id)
    if not session or session.user_id != current_user.id or session.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Focus session not found"
        )

    # Idempotent: If already completed, gracefully return existing session without throwing error
    if session.status == "completed":
        changed = False
        if complete_in.actual_focus_seconds is not None and complete_in.actual_focus_seconds != session.actual_focus_seconds:
            session.actual_focus_seconds = complete_in.actual_focus_seconds
            changed = True
        if complete_in.notes is not None and complete_in.notes != session.notes:
            session.notes = complete_in.notes
            changed = True
        if changed:
            session.updated_at = datetime.now(timezone.utc)
            db.add(session)
            db.commit()
            db.refresh(session)
        return FocusSessionResponse.model_validate(session)

    if session.status == "cancelled":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot complete a cancelled focus session"
        )

    now = datetime.now(timezone.utc)
    session.status = "completed"
    session.ended_at = now
    session.updated_at = now

    if complete_in.actual_focus_seconds is not None:
        session.actual_focus_seconds = complete_in.actual_focus_seconds
    else:
        session.actual_focus_seconds = session.duration_minutes * 60

    if complete_in.notes:
        session.notes = complete_in.notes

    # Auto-complete the associated task if enabled
    if session.auto_complete_task:
        task = db.get(Task, session.task_id)
        if task and task.user_id == current_user.id and not task.is_deleted:
            task.status = "completed"
            if not task.completed_at:
                task.completed_at = now
            task.updated_at = now
            db.add(task)

    db.add(session)
    db.commit()
    db.refresh(session)

    return FocusSessionResponse.model_validate(session)


@router.post(
    "/{session_id}/cancel",
    response_model=FocusSessionResponse,
    summary="Cancel / abandon active focus session (Idempotent)"
)
def cancel_focus_session(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> FocusSessionResponse:
    session = db.get(FocusSession, session_id)
    if not session or session.user_id != current_user.id or session.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Focus session not found"
        )

    if session.status == "cancelled":
        return FocusSessionResponse.model_validate(session)

    if session.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel an already completed focus session"
        )

    now = datetime.now(timezone.utc)
    session.status = "cancelled"
    session.ended_at = now
    session.updated_at = now

    db.add(session)
    db.commit()
    db.refresh(session)

    return FocusSessionResponse.model_validate(session)


@router.delete(
    "/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft delete a focus session"
)
def delete_focus_session(
    session_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    session = db.get(FocusSession, session_id)
    if not session or session.user_id != current_user.id or session.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Focus session not found"
        )

    now = datetime.now(timezone.utc)
    session.is_deleted = True
    session.deleted_at = now
    session.updated_at = now

    db.add(session)
    db.commit()
    return None


@router.get(
    "/stats",
    response_model=FocusStatsResponse,
    summary="Get user focus statistics and productivity metrics"
)
def get_focus_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> FocusStatsResponse:
    all_sessions = db.exec(
        select(FocusSession).where(
            FocusSession.user_id == current_user.id,
            FocusSession.is_deleted == False
        )
    ).all()

    completed_sessions = [s for s in all_sessions if s.status == "completed"]
    total_seconds = sum(s.actual_focus_seconds or (s.duration_minutes * 60) for s in completed_sessions)
    total_focus_minutes = total_seconds // 60

    completed_tasks = db.exec(
        select(Task).where(
            Task.user_id == current_user.id,
            Task.status == "completed",
            Task.is_deleted == False
        )
    ).all()

    active_session = next(
        (s for s in all_sessions if s.status in {"active", "paused"}),
        None
    )

    return FocusStatsResponse(
        total_focus_minutes=total_focus_minutes,
        total_sessions_count=len(all_sessions),
        completed_sessions_count=len(completed_sessions),
        completed_tasks_count=len(completed_tasks),
        active_session=FocusSessionResponse.model_validate(active_session) if active_session else None,
    )

