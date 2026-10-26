import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

from app.core.database import get_db
from app.core.config import settings
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


def test_admin_access_control(client: TestClient):
    # 1. Register regular user
    reg_user = client.post(
        "/api/v1/auth/register",
        json={"username": "normaluser", "password": "password123"}
    )
    assert reg_user.status_code == 201
    user_token = reg_user.json()["access_token"]

    # Regular user attempting admin route must be 403 Forbidden
    res = client.get(
        "/api/v1/admin/stats",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert res.status_code == 403
    assert "Administrator access required" in res.json()["detail"]


def test_admin_registration_and_endpoints(client: TestClient):
    # 1. Register admin as a usual account using admin username
    admin_username = settings.ADMIN_USERNAME or "xxx"
    admin_email = settings.ADMIN_EMAIL or "xxx@xxx.xxx"
    reg_admin = client.post(
        "/api/v1/auth/register",
        json={
            "username": admin_username,
            "email": admin_email,
            "password": "adminpassword123",
            "full_name": "System Administrator",
        }
    )
    assert reg_admin.status_code == 201
    admin_data = reg_admin.json()
    assert admin_data["user"]["role"] == "admin"
    assert admin_data["user"]["is_admin"] is True
    admin_token = admin_data["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Test GET /admin/stats
    stats_res = client.get("/api/v1/admin/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_users"] >= 1
    assert stats["admin_users"] >= 1
    assert "daily_focus_activity" in stats

    # 3. Test GET /admin/users
    users_res = client.get("/api/v1/admin/users", headers=headers)
    assert users_res.status_code == 200
    users_list = users_res.json()
    assert len(users_list) >= 1
    admin_user_entry = next((u for u in users_list if u["username"] == admin_username), None)
    assert admin_user_entry is not None
    assert admin_user_entry["role"] == "admin"

    # 4. Test POST /admin/users (provision user)
    create_res = client.post(
        "/api/v1/admin/users",
        headers=headers,
        json={
            "username": "managed_user",
            "email": "managed@example.com",
            "password": "managedpassword123",
            "full_name": "Managed User",
            "role": "user",
        }
    )
    assert create_res.status_code == 201
    created_user = create_res.json()
    assert created_user["username"] == "managed_user"
    user_id = created_user["id"]

    # 5. Test PATCH /admin/users/{user_id} (toggle status)
    patch_res = client.patch(
        f"/api/v1/admin/users/{user_id}",
        headers=headers,
        json={"is_active": False}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["is_active"] is False

    # 6. Test POST /admin/users/{user_id}/reset-password
    pwd_res = client.post(
        f"/api/v1/admin/users/{user_id}/reset-password",
        headers=headers,
        json={"new_password": "NewSecretPassword123!"}
    )
    assert pwd_res.status_code == 200
    assert "temporary_password" in pwd_res.json()

    # 7. Test GET & PATCH /admin/config
    cfg_get = client.get("/api/v1/admin/config", headers=headers)
    assert cfg_get.status_code == 200
    assert cfg_get.json()["allow_registrations"] is True

    cfg_patch = client.patch(
        "/api/v1/admin/config",
        headers=headers,
        json={"maintenance_mode": True, "default_focus_duration": 50}
    )
    assert cfg_patch.status_code == 200
    assert cfg_patch.json()["maintenance_mode"] is True
    assert cfg_patch.json()["default_focus_duration"] == 50

    # 8. Test GET /admin/audit-logs
    audit_res = client.get("/api/v1/admin/audit-logs", headers=headers)
    assert audit_res.status_code == 200
    assert len(audit_res.json()) >= 1

    # 9. Test GET /admin/export
    export_res = client.get("/api/v1/admin/export", headers=headers)
    assert export_res.status_code == 200
    export_data = export_res.json()
    assert "users" in export_data
    assert "config" in export_data

    # 10. Test Soft DELETE /admin/users/{user_id}
    del_res = client.delete(f"/api/v1/admin/users/{user_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["hard_deleted"] is False

    # 11. Test Hard DELETE /admin/users/{user_id}?hard_delete=true
    user2_res = client.post(
        "/api/v1/admin/users",
        headers=headers,
        json={
            "username": "user_to_purge",
            "email": "purge@example.com",
            "password": "purgepassword123",
            "role": "user",
        }
    )
    assert user2_res.status_code == 201
    user2_id = user2_res.json()["id"]

    hard_del_res = client.delete(f"/api/v1/admin/users/{user2_id}?hard_delete=true", headers=headers)
    assert hard_del_res.status_code == 200
    assert hard_del_res.json()["hard_deleted"] is True

    # Verify user is completely expunged from users list
    check_users = client.get("/api/v1/admin/users", headers=headers)
    assert all(u["id"] != user2_id for u in check_users.json())

    # 12. Test GET, POST, PATCH, DELETE /admin/projects
    create_proj_res = client.post(
        "/api/v1/admin/projects",
        headers=headers,
        json={
            "title": "Admin Created Project",
            "description": "Global enterprise workspace",
            "status": "active",
            "color": "#3B82F6",
        }
    )
    assert create_proj_res.status_code == 200
    created_proj = create_proj_res.json()
    assert created_proj["title"] == "Admin Created Project"
    proj_id = created_proj["id"]

    # List projects
    projs_res = client.get("/api/v1/admin/projects", headers=headers)
    assert projs_res.status_code == 200
    assert any(p["id"] == proj_id for p in projs_res.json())

    # Update project
    patch_proj_res = client.patch(
        f"/api/v1/admin/projects/{proj_id}",
        headers=headers,
        json={"title": "Admin Renamed Project", "status": "completed"}
    )
    assert patch_proj_res.status_code == 200
    assert patch_proj_res.json()["title"] == "Admin Renamed Project"
    assert patch_proj_res.json()["status"] == "completed"

    # Soft delete project
    del_proj_res = client.delete(f"/api/v1/admin/projects/{proj_id}", headers=headers)
    assert del_proj_res.status_code == 200
    assert del_proj_res.json()["hard_deleted"] is False

    # Verify soft deleted project is excluded from active list
    check_projs = client.get("/api/v1/admin/projects", headers=headers)
    assert all(p["id"] != proj_id for p in check_projs.json())


def test_admin_sees_user_projects_and_tasks(client: TestClient):
    # 1. Register a regular user "bob"
    reg_user = client.post(
        "/api/v1/auth/register",
        json={"username": "bob", "email": "bob@example.com", "password": "password123"}
    )
    assert reg_user.status_code == 201
    user_token = reg_user.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 2. Regular user creates a project
    proj_res = client.post(
        "/api/v1/projects",
        headers=user_headers,
        json={"title": "Bob SQL DB management", "description": "Bob's database"}
    )
    assert proj_res.status_code == 201
    bob_proj_id = proj_res.json()["id"]

    # 3. Regular user creates a task in that project
    task_res = client.post(
        "/api/v1/tasks",
        headers=user_headers,
        json={
            "title": "Configure Postgres replication",
            "project_id": bob_proj_id,
            "status": "completed",
            "estimated_minutes": 30
        }
    )
    assert task_res.status_code == 201
    task_id = task_res.json()["id"]
    complete_res = client.patch(f"/api/v1/tasks/{task_id}", headers=user_headers, json={"status": "completed"})
    assert complete_res.status_code == 200

    # 4. Register admin
    admin_username = settings.ADMIN_USERNAME or "xxx"
    admin_email = settings.ADMIN_EMAIL or "xxx@xxx.xxx"
    reg_admin = client.post(
        "/api/v1/auth/register",
        json={
            "username": admin_username,
            "email": admin_email,
            "password": "adminpassword123"
        }
    )
    assert reg_admin.status_code == 201
    admin_token = reg_admin.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 5. Admin lists global projects -> MUST contain Bob's project with task counts
    admin_projs_res = client.get("/api/v1/admin/projects", headers=admin_headers)
    assert admin_projs_res.status_code == 200
    admin_projs = admin_projs_res.json()
    bob_proj = next((p for p in admin_projs if p["id"] == bob_proj_id), None)
    assert bob_proj is not None
    assert bob_proj["title"] == "Bob SQL DB management"
    assert bob_proj["username"] == "bob"
    assert bob_proj["total_tasks"] == 1
    assert bob_proj["completed_tasks"] == 1

