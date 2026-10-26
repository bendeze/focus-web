from datetime import datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select, or_

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.models.user import (
    MessageResponse,
    PasswordChange,
    TokenResponse,
    User,
    UserLogin,
    UserRegister,
    UserResponse,
    UserUpdate,
)
from app.services.audit import log_audit_event, get_client_ip

router = APIRouter(prefix="/auth", tags=["Authentication & Account"])


def _find_user_by_identifier(db: Session, identifier: str) -> User | None:
    cleaned = identifier.strip()
    statement = select(User).where(
        or_(
            User.email == cleaned.lower(),
            User.username == cleaned
        )
    )
    return db.exec(statement).first()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new account"
)
def register(
    user_in: UserRegister,
    request: Request,
    db: Annotated[Session, Depends(get_db)]
) -> TokenResponse:
    """
    Create a new account with minimal requirements:
    Provide an `identifier` (which can be a username or email) and a `password`.
    """
    # Check if username exists
    if user_in.username:
        existing_username = db.exec(
            select(User).where(User.username == user_in.username)
        ).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this username already exists"
            )

    # Check if email exists
    if user_in.email:
        existing_email = db.exec(
            select(User).where(User.email == user_in.email)
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A user with this email already exists"
            )

    # Check if this account matches configured administrator credentials
    is_admin = False
    role = "user"
    clean_email = (user_in.email or "").strip().lower()
    clean_username = (user_in.username or "").strip().lower()
    clean_id = (user_in.identifier or "").strip().lower()
    admin_email = (settings.ADMIN_EMAIL or "").strip().lower()
    admin_username = (settings.ADMIN_USERNAME or "").strip().lower()

    if (admin_email and (clean_email == admin_email or clean_id == admin_email)) or \
       (admin_username and (clean_username == admin_username or clean_id == admin_username)):
        is_admin = True
        role = "admin"

    # Create user
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_pwd,
        is_active=True,
        role=role,
        is_admin=is_admin,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Audit log new registration
    ip = get_client_ip(request)
    actor = user.username or user.email or str(user.id)
    log_audit_event(
        db=db,
        action="AUTH_REGISTER",
        actor=actor,
        details=f"New account registered: @{user.username} ({user.email or 'no email'})",
        severity="info",
        ip_address=ip,
    )

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )



@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with username or email"
)
def login(
    login_data: UserLogin,
    request: Request,
    db: Annotated[Session, Depends(get_db)]
) -> TokenResponse:
    """
    Sign in using either your username OR email address and password.
    """
    ip = get_client_ip(request)
    raw_identifier = (login_data.identifier or "").strip()
    user = _find_user_by_identifier(db, login_data.identifier)
    if not user or not verify_password(login_data.password, user.hashed_password):
        log_audit_event(
            db=db,
            action="AUTH_LOGIN_FAILED",
            actor=raw_identifier or "anonymous",
            details=f"Failed login attempt for identifier: '{raw_identifier}' (incorrect credentials)",
            severity="warning",
            ip_address=ip,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        log_audit_event(
            db=db,
            action="AUTH_LOGIN_FAILED",
            actor=user.username or raw_identifier,
            details=f"Failed login attempt for account @{user.username}: account is deactivated/suspended",
            severity="warning",
            ip_address=ip,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    # Automatically upgrade to admin role if credentials match admin envs
    clean_email = (user.email or "").strip().lower()
    clean_username = (user.username or "").strip().lower()
    admin_email = (settings.ADMIN_EMAIL or "").strip().lower()
    admin_username = (settings.ADMIN_USERNAME or "").strip().lower()

    if (admin_email and clean_email == admin_email) or (admin_username and clean_username == admin_username):
        if not user.is_admin or user.role != "admin":
            user.is_admin = True
            user.role = "admin"
            db.add(user)
            db.commit()
            db.refresh(user)

    actor = user.username or user.email or str(user.id)
    is_admin_session = user.is_admin or user.role == "admin"
    log_audit_event(
        db=db,
        action="AUTH_LOGIN_SUCCESS",
        actor=actor,
        details=f"User signed in successfully{' (administrator privileged session)' if is_admin_session else ''}",
        severity="info",
        ip_address=ip,
    )

    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in_seconds=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )


@router.post(
    "/swagger-login",
    response_model=dict,
    include_in_schema=False
)
def swagger_login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    request: Request,
    db: Annotated[Session, Depends(get_db)]
) -> dict:
    """
    OAuth2 compatible token login for FastAPI interactive documentation (Swagger UI).
    """
    ip = get_client_ip(request)
    raw_identifier = (form_data.username or "").strip()
    user = _find_user_by_identifier(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        log_audit_event(
            db=db,
            action="AUTH_LOGIN_FAILED",
            actor=raw_identifier or "anonymous",
            details=f"Failed Swagger login attempt for identifier: '{raw_identifier}'",
            severity="warning",
            ip_address=ip,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        log_audit_event(
            db=db,
            action="AUTH_LOGIN_FAILED",
            actor=user.username or raw_identifier,
            details=f"Failed Swagger login attempt for @{user.username}: account is deactivated",
            severity="warning",
            ip_address=ip,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    actor = user.username or user.email or str(user.id)
    log_audit_event(
        db=db,
        action="AUTH_LOGIN_SUCCESS",
        actor=actor,
        details="User authenticated via Swagger OAuth2 form",
        severity="info",
        ip_address=ip,
    )

    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile"
)
def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> UserResponse:
    """
    Fetch the authenticated user's profile information.
    """
    clean_email = (current_user.email or "").strip().lower()
    clean_username = (current_user.username or "").strip().lower()
    admin_email = (settings.ADMIN_EMAIL or "").strip().lower()
    admin_username = (settings.ADMIN_USERNAME or "").strip().lower()

    if (admin_email and clean_email == admin_email) or (admin_username and clean_username == admin_username):
        if not current_user.is_admin or current_user.role != "admin":
            current_user.is_admin = True
            current_user.role = "admin"
            db.add(current_user)
            db.commit()
            db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update profile"
)
def update_me(
    user_update: UserUpdate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> UserResponse:
    """
    Update username, email, full name, or avatar URL.
    """
    changes = []
    old_username = current_user.username
    old_email = current_user.email

    # If updating username, check uniqueness
    if user_update.username is not None and user_update.username != current_user.username:
        existing = db.exec(
            select(User).where(User.username == user_update.username)
        ).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username is already in use"
            )
        changes.append(f"username: '@{old_username}' -> '@{user_update.username}'")
        current_user.username = user_update.username

    # If updating email, check uniqueness
    if user_update.email is not None and user_update.email != current_user.email:
        existing = db.exec(
            select(User).where(User.email == user_update.email)
        ).first()
        if existing and existing.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already in use"
            )
        changes.append(f"email: '{old_email}' -> '{user_update.email}'")
        current_user.email = user_update.email

    if user_update.full_name is not None and user_update.full_name != current_user.full_name:
        changes.append("full_name updated")
        current_user.full_name = user_update.full_name

    if user_update.avatar_url is not None and user_update.avatar_url != current_user.avatar_url:
        changes.append("avatar updated")
        current_user.avatar_url = user_update.avatar_url

    current_user.updated_at = datetime.now(timezone.utc)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    if changes:
        ip = get_client_ip(request)
        actor = current_user.username or current_user.email or str(current_user.id)
        log_audit_event(
            db=db,
            action="USER_PROFILE_UPDATED",
            actor=actor,
            details=f"Profile updated ({', '.join(changes)})",
            severity="info",
            ip_address=ip,
        )

    return UserResponse.model_validate(current_user)


@router.delete(
    "/me",
    response_model=MessageResponse,
    summary="Close current user account"
)
def delete_me(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> MessageResponse:
    """
    Close and permanently purge the current user's account and personal workspace data (GDPR compliant).
    """
    from app.core.config import settings
    clean_email = (current_user.email or "").strip().lower()
    clean_username = (current_user.username or "").strip().lower()
    admin_email = (settings.ADMIN_EMAIL or "").strip().lower()
    admin_username = (settings.ADMIN_USERNAME or "").strip().lower()

    if (admin_email and clean_email == admin_email) or (admin_username and clean_username == admin_username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="System root administrator account cannot be self-deleted"
        )

    ip = get_client_ip(request)
    actor = current_user.username or current_user.email or str(current_user.id)

    # Cascade delete in reverse dependency order
    from app.models.focus import FocusSession
    from app.models.task import Task
    from app.models.project import Project

    sessions = db.exec(select(FocusSession).where(FocusSession.user_id == current_user.id)).all()
    for s in sessions:
        db.delete(s)

    tasks = db.exec(select(Task).where(Task.user_id == current_user.id)).all()
    for t in tasks:
        db.delete(t)

    projects = db.exec(select(Project).where(Project.user_id == current_user.id)).all()
    for p in projects:
        db.delete(p)

    db.delete(current_user)
    db.commit()

    log_audit_event(
        db=db,
        action="USER_ACCOUNT_CLOSED",
        actor=actor,
        details=f"User @{actor} self-closed their account and purged all personal data",
        severity="danger",
        ip_address=ip,
    )

    return MessageResponse(message="Account successfully closed and personal data purged")



@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change account password"
)
def change_password(
    password_data: PasswordChange,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> MessageResponse:
    """
    Change account password by providing the current password and the new password.
    """
    ip = get_client_ip(request)
    actor = current_user.username or current_user.email or str(current_user.id)

    if not verify_password(password_data.current_password, current_user.hashed_password):
        log_audit_event(
            db=db,
            action="AUTH_PASSWORD_CHANGE_FAILED",
            actor=actor,
            details="Password change attempt failed: current password incorrect",
            severity="warning",
            ip_address=ip,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match"
        )

    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    db.add(current_user)
    db.commit()

    log_audit_event(
        db=db,
        action="AUTH_PASSWORD_CHANGED",
        actor=actor,
        details="Account password changed successfully",
        severity="warning",
        ip_address=ip,
    )

    return MessageResponse(message="Password changed successfully")


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Log out of the current session"
)
def logout(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> MessageResponse:
    """
    Logout endpoint for mobile & web clients.
    Client should discard the stored access token.
    """
    ip = get_client_ip(request)
    actor = current_user.username or current_user.email or str(current_user.id)
    log_audit_event(
        db=db,
        action="AUTH_LOGOUT",
        actor=actor,
        details="User logged out of active session",
        severity="info",
        ip_address=ip,
    )
    return MessageResponse(message="Successfully logged out")
