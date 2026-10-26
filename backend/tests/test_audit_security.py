import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine, select
from sqlmodel.pool import StaticPool

from app.core.database import get_db
from app.models.user import User
from app.models.admin import AuditLog
from main import app


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_db_override():
        return session

    app.dependency_overrides[get_db] = get_db_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_audit_register(client: TestClient, session: Session):
    """Verify that user registration generates an AUTH_REGISTER audit event with actor and IP."""
    res = client.post(
        "/api/v1/auth/register",
        json={
            "username": "reguser",
            "email": "reg@example.com",
            "password": "securepass123",
            "full_name": "Registered User",
        },
    )
    assert res.status_code == 201

    log = session.exec(
        select(AuditLog).where(AuditLog.action == "AUTH_REGISTER")
    ).first()
    assert log is not None
    assert log.actor == "reguser"
    assert log.severity == "info"
    assert "@reguser" in log.details
    assert log.ip_address is not None


def test_audit_login_success_and_failure(client: TestClient, session: Session):
    """Verify AUTH_LOGIN_SUCCESS and AUTH_LOGIN_FAILED audit records."""
    # Register user
    client.post(
        "/api/v1/auth/register",
        json={"username": "loginuser", "email": "login@example.com", "password": "correctpassword"},
    )

    # 1. Failed login with bad password
    fail_res = client.post(
        "/api/v1/auth/login",
        json={"identifier": "loginuser", "password": "wrongpassword"},
    )
    assert fail_res.status_code == 401

    fail_log = session.exec(
        select(AuditLog).where(AuditLog.action == "AUTH_LOGIN_FAILED")
    ).first()
    assert fail_log is not None
    assert fail_log.actor == "loginuser"
    assert fail_log.severity == "warning"

    # 2. Successful login
    succ_res = client.post(
        "/api/v1/auth/login",
        json={"identifier": "loginuser", "password": "correctpassword"},
    )
    assert succ_res.status_code == 200

    succ_log = session.exec(
        select(AuditLog).where(AuditLog.action == "AUTH_LOGIN_SUCCESS")
    ).first()
    assert succ_log is not None
    assert succ_log.actor == "loginuser"
    assert succ_log.severity == "info"


def test_audit_password_change(client: TestClient, session: Session):
    """Verify AUTH_PASSWORD_CHANGE_FAILED and AUTH_PASSWORD_CHANGED audit events."""
    reg = client.post(
        "/api/v1/auth/register",
        json={"username": "pwduser", "email": "pwd@example.com", "password": "initialpassword"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Failed change
    fail_res = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": "wrong_current", "new_password": "nextpassword123"},
    )
    assert fail_res.status_code == 400

    fail_log = session.exec(
        select(AuditLog).where(AuditLog.action == "AUTH_PASSWORD_CHANGE_FAILED")
    ).first()
    assert fail_log is not None
    assert fail_log.actor == "pwduser"
    assert fail_log.severity == "warning"

    # Successful change
    succ_res = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": "initialpassword", "new_password": "nextpassword123"},
    )
    assert succ_res.status_code == 200

    succ_log = session.exec(
        select(AuditLog).where(AuditLog.action == "AUTH_PASSWORD_CHANGED")
    ).first()
    assert succ_log is not None
    assert succ_log.actor == "pwduser"
    assert succ_log.severity == "warning"


def test_audit_logout(client: TestClient, session: Session):
    """Verify AUTH_LOGOUT audit event."""
    reg = client.post(
        "/api/v1/auth/register",
        json={"username": "logoutuser", "password": "password123"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/auth/logout", headers=headers)
    assert res.status_code == 200

    log = session.exec(
        select(AuditLog).where(AuditLog.action == "AUTH_LOGOUT")
    ).first()
    assert log is not None
    assert log.actor == "logoutuser"
    assert log.severity == "info"


def test_audit_unauthorized_access(client: TestClient, session: Session):
    """Verify AUTH_UNAUTHORIZED_ACCESS event when regular user accesses admin endpoint."""
    reg = client.post(
        "/api/v1/auth/register",
        json={"username": "regularuser", "password": "password123"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/admin/stats", headers=headers)
    assert res.status_code == 403

    log = session.exec(
        select(AuditLog).where(AuditLog.action == "AUTH_UNAUTHORIZED_ACCESS")
    ).first()
    assert log is not None
    assert log.actor == "regularuser"
    assert log.severity == "danger"
    assert "/api/v1/admin/stats" in log.details


def test_audit_user_profile_updated(client: TestClient, session: Session):
    """Verify USER_PROFILE_UPDATED audit event records before/after values."""
    reg = client.post(
        "/api/v1/auth/register",
        json={"username": "oldusername", "email": "old@example.com", "password": "password123"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.patch(
        "/api/v1/auth/me",
        headers=headers,
        json={"username": "brandnewusername", "email": "brandnew@example.com"},
    )
    assert res.status_code == 200

    log = session.exec(
        select(AuditLog).where(AuditLog.action == "USER_PROFILE_UPDATED")
    ).first()
    assert log is not None
    assert log.severity == "info"
    assert "oldusername" in log.details
    assert "brandnewusername" in log.details
    assert "brandnew@example.com" in log.details


def test_audit_user_account_closed(client: TestClient, session: Session):
    """Verify USER_ACCOUNT_CLOSED audit event when a user deletes their own account."""
    reg = client.post(
        "/api/v1/auth/register",
        json={"username": "deleteuser", "password": "password123"},
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.delete("/api/v1/auth/me", headers=headers)
    assert res.status_code == 200

    log = session.exec(
        select(AuditLog).where(AuditLog.action == "USER_ACCOUNT_CLOSED")
    ).first()
    assert log is not None
    assert log.actor == "deleteuser"
    assert log.severity == "danger"
