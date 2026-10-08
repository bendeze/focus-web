import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

from app.core.database import get_db
from app.models.user import User
from main import app


# Use in-memory SQLite database for testing
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


def test_health_check(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_register_with_username_only(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={"username": "alexfocus", "password": "securepassword123"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["username"] == "alexfocus"
    assert data["user"]["email"] is None


def test_register_with_email_only(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "focus@example.com", "password": "securepassword123"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "focus@example.com"
    assert data["user"]["username"] is None


def test_register_with_identifier_auto_detect(client: TestClient):
    # Test identifier detected as email
    res1 = client.post(
        "/api/v1/auth/register",
        json={"identifier": "minimal@user.org", "password": "securepassword123"}
    )
    assert res1.status_code == 201
    assert res1.json()["user"]["email"] == "minimal@user.org"

    # Test identifier detected as username
    res2 = client.post(
        "/api/v1/auth/register",
        json={"identifier": "minimal_user", "password": "securepassword123"}
    )
    assert res2.status_code == 201
    assert res2.json()["user"]["username"] == "minimal_user"


def test_duplicate_registration(client: TestClient):
    client.post(
        "/api/v1/auth/register",
        json={"username": "unique_user", "password": "password123"}
    )
    dup = client.post(
        "/api/v1/auth/register",
        json={"username": "unique_user", "password": "password456"}
    )
    assert dup.status_code == 409
    assert "already exists" in dup.json()["detail"]


def test_login_with_username_and_email(client: TestClient):
    # Register a user with both username and email
    client.post(
        "/api/v1/auth/register",
        json={
            "username": "superfocus",
            "email": "superfocus@example.com",
            "password": "mypassword123",
            "full_name": "Super Focus"
        }
    )

    # Login using username
    login_user = client.post(
        "/api/v1/auth/login",
        json={"identifier": "superfocus", "password": "mypassword123"}
    )
    assert login_user.status_code == 200
    assert "access_token" in login_user.json()

    # Login using email
    login_email = client.post(
        "/api/v1/auth/login",
        json={"identifier": "superfocus@example.com", "password": "mypassword123"}
    )
    assert login_email.status_code == 200
    assert "access_token" in login_email.json()

    # Wrong password
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"identifier": "superfocus", "password": "wrongpassword"}
    )
    assert bad_login.status_code == 401


def test_get_profile_and_logout(client: TestClient):
    reg = client.post(
        "/api/v1/auth/register",
        json={"username": "profile_user", "password": "password123", "full_name": "Profile User"}
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch profile
    profile = client.get("/api/v1/auth/me", headers=headers)
    assert profile.status_code == 200
    data = profile.json()
    assert data["username"] == "profile_user"
    assert data["full_name"] == "Profile User"

    # Unauthorized access without token
    no_auth = client.get("/api/v1/auth/me")
    assert no_auth.status_code == 401

    # Logout
    logout_res = client.post("/api/v1/auth/logout", headers=headers)
    assert logout_res.status_code == 200
    assert "Successfully logged out" in logout_res.json()["message"]


def test_update_profile_and_change_password(client: TestClient):
    reg = client.post(
        "/api/v1/auth/register",
        json={"username": "oldusername", "password": "oldpassword123"}
    )
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Update profile
    patch_res = client.patch(
        "/api/v1/auth/me",
        headers=headers,
        json={"username": "newusername", "email": "newemail@example.com", "full_name": "New Name"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["username"] == "newusername"
    assert patch_res.json()["email"] == "newemail@example.com"

    # Change password
    pwd_res = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": "oldpassword123", "new_password": "brandnewpassword456"}
    )
    assert pwd_res.status_code == 200

    # Old password no longer works
    old_login = client.post(
        "/api/v1/auth/login",
        json={"identifier": "newusername", "password": "oldpassword123"}
    )
    assert old_login.status_code == 401

    # New password works
    new_login = client.post(
        "/api/v1/auth/login",
        json={"identifier": "newusername", "password": "brandnewpassword456"}
    )
    assert new_login.status_code == 200


def test_login_with_corrupted_or_legacy_hash(client: TestClient, session: Session):
    # Manually insert a user with a raw/corrupted hash string
    raw_user = User(
        username="legacy_hash_user",
        hashed_password="corrupted_or_legacy_plain_hash",
        is_active=True
    )
    session.add(raw_user)
    session.commit()

    # Attempting login should return 401 instead of crashing with 500
    res = client.post(
        "/api/v1/auth/login",
        json={"identifier": "legacy_hash_user", "password": "anypassword"}
    )
    assert res.status_code == 401
    assert "Incorrect username/email or password" in res.json()["detail"]

