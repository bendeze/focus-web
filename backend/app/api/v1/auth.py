from datetime import datetime, timezone
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
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

    # Create user
    hashed_pwd = get_password_hash(user_in.password)
    user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_pwd,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

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
    db: Annotated[Session, Depends(get_db)]
) -> TokenResponse:
    """
    Sign in using either your username OR email address and password.
    """
    user = _find_user_by_identifier(db, login_data.identifier)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
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
    db: Annotated[Session, Depends(get_db)]
) -> dict:
    """
    OAuth2 compatible token login for FastAPI interactive documentation (Swagger UI).
    """
    user = _find_user_by_identifier(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile"
)
def get_me(
    current_user: Annotated[User, Depends(get_current_user)]
) -> UserResponse:
    """
    Fetch the authenticated user's profile information.
    """
    return UserResponse.model_validate(current_user)


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update profile"
)
def update_me(
    user_update: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> UserResponse:
    """
    Update username, email, full name, or avatar URL.
    """
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
        current_user.email = user_update.email

    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name

    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url

    current_user.updated_at = datetime.now(timezone.utc)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change account password"
)
def change_password(
    password_data: PasswordChange,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)]
) -> MessageResponse:
    """
    Change account password by providing the current password and the new password.
    """
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password does not match"
        )

    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.updated_at = datetime.now(timezone.utc)
    db.add(current_user)
    db.commit()

    return MessageResponse(message="Password changed successfully")


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Log out of the current session"
)
def logout(
    current_user: Annotated[User, Depends(get_current_user)]
) -> MessageResponse:
    """
    Logout endpoint for mobile & web clients.
    Client should discard the stored access token.
    """
    return MessageResponse(message="Successfully logged out")
