from typing import Optional
from fastapi import Request
from sqlmodel import Session
from app.models.admin import AuditLog


def get_client_ip(request: Optional[Request]) -> str:
    """Extract real client IP address from Request headers or socket host."""
    if not request:
        return "127.0.0.1"
    
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # First entry in X-Forwarded-For is the original client IP
        return forwarded.split(",")[0].strip()
    
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"


def log_audit_event(
    db: Session,
    action: str,
    actor: str,
    details: str,
    severity: str = "info",
    ip_address: str = "127.0.0.1",
) -> AuditLog:
    """
    Persist an audit trail event for administrative, authentication, or security tracking.
    Severity can be: 'info', 'success', 'warning', 'danger'.
    """
    log_entry = AuditLog(
        action=action,
        actor=actor,
        severity=severity,
        details=details,
        ip_address=ip_address,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
