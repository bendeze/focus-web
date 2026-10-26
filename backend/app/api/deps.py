import uuid
from typing import Annotated
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.services.audit import log_audit_event, get_client_ip

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/swagger-login",
    auto_error=False
)


def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)]
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or session has expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise credentials_exception

    user = db.get(User, user_uuid)
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive account"
        )

    return user


def get_current_admin_user(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    request: Request,
) -> User:
    from app.core.config import settings

    clean_email = (current_user.email or "").strip().lower()
    clean_username = (current_user.username or "").strip().lower()
    admin_email = (settings.ADMIN_EMAIL or "").strip().lower()
    admin_username = (settings.ADMIN_USERNAME or "").strip().lower()

    is_admin = (
        current_user.is_admin or
        current_user.role == "admin" or
        bool(admin_email and clean_email == admin_email) or
        bool(admin_username and clean_username == admin_username)
    )

    if not is_admin:
        ip = get_client_ip(request)
        actor = current_user.username or current_user.email or str(current_user.id)
        log_audit_event(
            db=db,
            action="AUTH_UNAUTHORIZED_ACCESS",
            actor=actor,
            details=f"Unauthorized access attempt to admin endpoint: {request.method} {request.url.path}",
            severity="danger",
            ip_address=ip,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access required"
        )

    return current_user
