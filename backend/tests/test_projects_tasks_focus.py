import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

from app.core.database import get_db
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


def _get_auth_headers(client: TestClient, username: str) -> tuple[dict[str, str], str]:
    res = client.post(
        "/api/v1/auth/register",
        json={"username": username, "password": "password123"}
    )
    assert res.status_code == 201
    data = res.json()
    token = data["access_token"]
    user_id = data["user"]["id"]
    return {"Authorization": f"Bearer {token}"}, user_id


def test_projects_crud(client: TestClient):
    headers, _ = _get_auth_headers(client, "project_master")

    # 1. Create project
    res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={
            "title": "PR Focus Mobile MVP",
            "description": "Build mobile frontend and backend",
            "color": "#4F46E5",
            "icon": "rocket"
        }
    )
    assert res.status_code == 201
    project = res.json()
    project_id = project["id"]
    assert project["title"] == "PR Focus Mobile MVP"
    assert project["status"] == "active"
    assert project["total_tasks"] == 0

    # 2. List projects
    list_res = client.get("/api/v1/projects", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # 3. Get single project
    get_res = client.get(f"/api/v1/projects/{project_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == project_id

    # 4. Update project
    patch_res = client.patch(
        f"/api/v1/projects/{project_id}",
        headers=headers,
        json={"title": "PR Focus App v2", "status": "completed"}
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "PR Focus App v2"
    assert patch_res.json()["status"] == "completed"

    # 5. Delete project
    del_res = client.delete(f"/api/v1/projects/{project_id}", headers=headers)
    assert del_res.status_code == 204

    # Verify not found after deletion
    get_after = client.get(f"/api/v1/projects/{project_id}", headers=headers)
    assert get_after.status_code == 404


def test_standalone_and_project_tasks(client: TestClient):
    headers, _ = _get_auth_headers(client, "task_ninja")

    # 1. Create a Project
    proj_res = client.post(
        "/api/v1/projects",
        headers=headers,
        json={"title": "Sprint 1 Planning"}
    )
    proj_id = proj_res.json()["id"]

    # 2. Create Standalone Task (Inbox item)
    task1 = client.post(
        "/api/v1/tasks",
        headers=headers,
        json={
            "title": "Quick Idea Note",
            "description": "Write down some ideas",
            "priority": "low"
        }
    )
    assert task1.status_code == 201
    assert task1.json()["project_id"] is None
    assert task1.json()["status"] == "todo"

    # 3. Create Project Task
    task2 = client.post(
        "/api/v1/tasks",
        headers=headers,
        json={
            "title": "Design Database Schema",
            "description": "SQLModel tables for tasks and focus sessions",
            "project_id": proj_id,
            "priority": "urgent",
            "estimated_minutes": 30,
            "order_index": 1
        }
    )
    assert task2.status_code == 201
    assert task2.json()["project_id"] == proj_id
    assert task2.json()["priority"] == "urgent"

    # 4. Filter tasks by project
    filter_proj = client.get(f"/api/v1/tasks?project_id={proj_id}", headers=headers)
    assert filter_proj.status_code == 200
    assert len(filter_proj.json()) == 1
    assert filter_proj.json()[0]["title"] == "Design Database Schema"

    # 5. Filter standalone tasks
    filter_standalone = client.get("/api/v1/tasks?standalone=true", headers=headers)
    assert filter_standalone.status_code == 200
    assert len(filter_standalone.json()) == 1
    assert filter_standalone.json()[0]["title"] == "Quick Idea Note"

    # 6. Test limit and offset pagination
    page1 = client.get("/api/v1/tasks?limit=1&offset=0", headers=headers)
    assert page1.status_code == 200
    assert len(page1.json()) == 1

    page2 = client.get("/api/v1/tasks?limit=1&offset=1", headers=headers)
    assert page2.status_code == 200
    assert len(page2.json()) == 1
    assert page1.json()[0]["id"] != page2.json()[0]["id"]


def test_task_reordering(client: TestClient):
    headers, _ = _get_auth_headers(client, "agile_scrum")

    t1 = client.post("/api/v1/tasks", headers=headers, json={"title": "Task 1", "order_index": 0}).json()
    t2 = client.post("/api/v1/tasks", headers=headers, json={"title": "Task 2", "order_index": 1}).json()

    reorder_res = client.patch(
        "/api/v1/tasks/reorder",
        headers=headers,
        json={
            "items": [
                {"task_id": t1["id"], "order_index": 10},
                {"task_id": t2["id"], "order_index": 5}
            ]
        }
    )
    assert reorder_res.status_code == 200

    tasks_list = client.get("/api/v1/tasks", headers=headers).json()
    # Ordered by order_index ascending: Task 2 (order 5) then Task 1 (order 10)
    assert tasks_list[0]["id"] == t2["id"]
    assert tasks_list[1]["id"] == t1["id"]


def test_focus_session_flow_and_auto_completion(client: TestClient):
    headers, _ = _get_auth_headers(client, "focus_runner")

    # 1. Create a task
    task = client.post(
        "/api/v1/tasks",
        headers=headers,
        json={"title": "Write Unit Tests", "estimated_minutes": 25}
    ).json()
    task_id = task["id"]
    assert task["status"] == "todo"

    # 2. Start Focus Session
    start_res = client.post(
        "/api/v1/focus/start",
        headers=headers,
        json={
            "task_id": task_id,
            "duration_minutes": 25,
            "auto_complete_task": True
        }
    )
    assert start_res.status_code == 201
    session = start_res.json()
    session_id = session["id"]
    assert session["status"] == "active"
    assert session["task_id"] == task_id

    # Task remains todo while focus session is running
    task_check = client.get(f"/api/v1/tasks/{task_id}", headers=headers).json()
    assert task_check["status"] == "todo"

    # 3. Check /current endpoint
    curr_res = client.get("/api/v1/focus/current", headers=headers)
    assert curr_res.status_code == 200
    assert curr_res.json()["id"] == session_id

    # 4. Cannot start another session while one is running
    dup_res = client.post(
        "/api/v1/focus/start",
        headers=headers,
        json={"task_id": task_id}
    )
    assert dup_res.status_code == 400
    assert "already have an active focus session" in dup_res.json()["detail"]

    # 5. Pause and Resume
    pause_res = client.post(f"/api/v1/focus/{session_id}/pause", headers=headers)
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "paused"
    task_paused = client.get(f"/api/v1/tasks/{task_id}", headers=headers).json()
    assert task_paused["status"] == "todo"

    resume_res = client.post(f"/api/v1/focus/{session_id}/resume", headers=headers)
    assert resume_res.status_code == 200
    assert resume_res.json()["status"] == "active"
    task_resumed = client.get(f"/api/v1/tasks/{task_id}", headers=headers).json()
    assert task_resumed["status"] == "todo"

    # 6. Complete Session (Timer finishes)
    comp_res = client.post(
        f"/api/v1/focus/{session_id}/complete",
        headers=headers,
        json={"actual_focus_seconds": 1500, "notes": "Completed all test cases!"}
    )
    assert comp_res.status_code == 200
    assert comp_res.json()["status"] == "completed"
    assert comp_res.json()["notes"] == "Completed all test cases!"

    # 7. Verify Task is automatically marked as 'completed'
    task_after = client.get(f"/api/v1/tasks/{task_id}", headers=headers).json()
    assert task_after["status"] == "completed"
    assert task_after["completed_at"] is not None
    assert task_after["total_focus_minutes"] == 25
    assert task_after["focus_session_count"] == 1

    # 8. Check Focus Stats
    stats_res = client.get("/api/v1/focus/stats", headers=headers)
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_focus_minutes"] == 25
    assert stats["completed_sessions_count"] == 1
    assert stats["completed_tasks_count"] == 1
    assert stats["active_session"] is None


def test_multi_user_data_isolation(client: TestClient):
    # Register User A and User B
    headers_a, _ = _get_auth_headers(client, "user_a")
    headers_b, _ = _get_auth_headers(client, "user_b")

    # User A creates a project and a task
    proj_a = client.post("/api/v1/projects", headers=headers_a, json={"title": "User A Project"}).json()
    task_a = client.post(
        "/api/v1/tasks",
        headers=headers_a,
        json={"title": "User A Task", "project_id": proj_a["id"]}
    ).json()

    # User B tries to view User A's project
    res1 = client.get(f"/api/v1/projects/{proj_a['id']}", headers=headers_b)
    assert res1.status_code == 404

    # User B tries to view User A's task
    res2 = client.get(f"/api/v1/tasks/{task_a['id']}", headers=headers_b)
    assert res2.status_code == 404

    # User B tries to start a focus session on User A's task
    res3 = client.post("/api/v1/focus/start", headers=headers_b, json={"task_id": task_a["id"]})
    assert res3.status_code == 404

    # User B tries to create a task assigned to User A's project
    res4 = client.post("/api/v1/tasks", headers=headers_b, json={"title": "Hacker Task", "project_id": proj_a["id"]})
    assert res4.status_code == 404

    # User B's list endpoints should be completely empty
    assert len(client.get("/api/v1/projects", headers=headers_b).json()) == 0
    assert len(client.get("/api/v1/tasks", headers=headers_b).json()) == 0


def test_delta_sync_and_soft_deletes(client: TestClient):
    headers, _ = _get_auth_headers(client, "sync_user")

    # Create project and task
    proj = client.post("/api/v1/projects", headers=headers, json={"title": "Sync Project"}).json()
    task = client.post("/api/v1/tasks", headers=headers, json={"title": "Sync Task", "project_id": proj["id"]}).json()

    sync_timestamp = "2026-01-01T00:00:00Z"

    # Soft delete the task
    del_res = client.delete(f"/api/v1/tasks/{task['id']}", headers=headers)
    assert del_res.status_code == 204

    # Regular list should not return the deleted task
    regular_list = client.get("/api/v1/tasks", headers=headers).json()
    assert len(regular_list) == 0

    # Delta sync query with updated_after MUST return the deleted task (tombstone)
    sync_list = client.get(f"/api/v1/tasks?updated_after={sync_timestamp}", headers=headers).json()
    assert len(sync_list) == 1
    assert sync_list[0]["id"] == task["id"]
    assert sync_list[0]["is_deleted"] is True
    assert sync_list[0]["deleted_at"] is not None

    # Soft delete project and check delta sync on projects
    client.delete(f"/api/v1/projects/{proj['id']}", headers=headers)
    assert len(client.get("/api/v1/projects", headers=headers).json()) == 0

    proj_sync = client.get(f"/api/v1/projects?updated_after={sync_timestamp}", headers=headers).json()
    assert len(proj_sync) == 1
    assert proj_sync[0]["id"] == proj["id"]
    assert proj_sync[0]["is_deleted"] is True
    assert proj_sync[0]["deleted_at"] is not None


def test_idempotency_focus_and_tasks(client: TestClient):
    headers, _ = _get_auth_headers(client, "idempotent_user")

    task = client.post("/api/v1/tasks", headers=headers, json={"title": "Idempotent Task"}).json()
    task_id = task["id"]

    # Start session
    session = client.post("/api/v1/focus/start", headers=headers, json={"task_id": task_id}).json()
    session_id = session["id"]

    # Pause twice (idempotent)
    p1 = client.post(f"/api/v1/focus/{session_id}/pause", headers=headers)
    assert p1.status_code == 200
    p2 = client.post(f"/api/v1/focus/{session_id}/pause", headers=headers)
    assert p2.status_code == 200

    # Resume twice (idempotent)
    r1 = client.post(f"/api/v1/focus/{session_id}/resume", headers=headers)
    assert r1.status_code == 200
    r2 = client.post(f"/api/v1/focus/{session_id}/resume", headers=headers)
    assert r2.status_code == 200

    # Complete twice (idempotent - network retry simulation)
    c1 = client.post(
        f"/api/v1/focus/{session_id}/complete",
        headers=headers,
        json={"actual_focus_seconds": 1200, "notes": "Done"}
    )
    assert c1.status_code == 200
    assert c1.json()["status"] == "completed"

    c2 = client.post(
        f"/api/v1/focus/{session_id}/complete",
        headers=headers,
        json={"actual_focus_seconds": 1200, "notes": "Done"}
    )
    assert c2.status_code == 200
    assert c2.json()["status"] == "completed"

    # Task completion timestamp idempotency
    t1 = client.patch(f"/api/v1/tasks/{task_id}", headers=headers, json={"status": "completed"}).json()
    first_completed_at = t1["completed_at"]
    assert first_completed_at is not None

    t2 = client.patch(f"/api/v1/tasks/{task_id}", headers=headers, json={"status": "completed"}).json()
    assert t2["completed_at"] == first_completed_at

    # Focus session listing & soft delete
    all_sessions = client.get("/api/v1/focus/sessions", headers=headers).json()
    assert len(all_sessions) == 1

    del_sess = client.delete(f"/api/v1/focus/{session_id}", headers=headers)
    assert del_sess.status_code == 204

    # Normal list ignores deleted session
    assert len(client.get("/api/v1/focus/sessions", headers=headers).json()) == 0

    # Delta sync includes deleted session
    sync_sess = client.get("/api/v1/focus/sessions?updated_after=2026-01-01T00:00:00Z", headers=headers).json()
    assert len(sync_sess) == 1
    assert sync_sess[0]["is_deleted"] is True


def test_x_idempotency_key_creation_endpoints(client: TestClient):
    import uuid
    headers, _ = _get_auth_headers(client, "idempotency_tester")

    # 1. Project creation idempotency
    proj_key = str(uuid.uuid4())
    headers_proj = {**headers, "X-Idempotency-Key": proj_key}

    res1 = client.post(
        "/api/v1/projects",
        headers=headers_proj,
        json={"title": "Idempotent Project", "description": "Safe retry"}
    )
    assert res1.status_code == 201
    proj1 = res1.json()
    assert proj1["id"] == proj_key
    assert proj1["title"] == "Idempotent Project"

    # Retry project creation with the exact same X-Idempotency-Key
    res2 = client.post(
        "/api/v1/projects",
        headers=headers_proj,
        json={"title": "Idempotent Project", "description": "Safe retry"}
    )
    assert res2.status_code == 201
    proj2 = res2.json()
    assert proj2["id"] == proj_key
    assert proj2["title"] == "Idempotent Project"

    # 2. Task creation idempotency
    task_key = str(uuid.uuid4())
    headers_task = {**headers, "X-Idempotency-Key": task_key}

    t_res1 = client.post(
        "/api/v1/tasks",
        headers=headers_task,
        json={"title": "Idempotent Task", "project_id": proj_key, "estimated_minutes": 30}
    )
    assert t_res1.status_code == 201
    task1 = t_res1.json()
    assert task1["id"] == task_key

    # Retry task creation with the exact same X-Idempotency-Key
    t_res2 = client.post(
        "/api/v1/tasks",
        headers=headers_task,
        json={"title": "Idempotent Task", "project_id": proj_key, "estimated_minutes": 30}
    )
    assert t_res2.status_code == 201
    task2 = t_res2.json()
    assert task2["id"] == task_key

    # 3. Focus session start idempotency
    sess_key = str(uuid.uuid4())
    headers_sess = {**headers, "X-Idempotency-Key": sess_key}

    s_res1 = client.post(
        "/api/v1/focus/start",
        headers=headers_sess,
        json={"task_id": task_key, "duration_minutes": 30}
    )
    assert s_res1.status_code == 201
    sess1 = s_res1.json()
    assert sess1["id"] == sess_key
    assert sess1["status"] == "active"

    # Retry focus session start with the exact same X-Idempotency-Key (should return same session without 400 error)
    s_res2 = client.post(
        "/api/v1/focus/start",
        headers=headers_sess,
        json={"task_id": task_key, "duration_minutes": 30}
    )
    assert s_res2.status_code == 201
    sess2 = s_res2.json()
    assert sess2["id"] == sess_key
    assert sess2["status"] == "active"

    # 4. Invalid X-Idempotency-Key format should return 400 Bad Request
    invalid_headers = {**headers, "X-Idempotency-Key": "invalid-uuid-string"}
    inv_res = client.post(
        "/api/v1/projects",
        headers=invalid_headers,
        json={"title": "Invalid Key Project"}
    )
    assert inv_res.status_code == 400
    assert "Invalid X-Idempotency-Key format" in inv_res.json()["detail"]


def test_task_pause_and_resume_endpoints(client: TestClient):
    headers, _ = _get_auth_headers(client, "pause_tester")

    # 1. Create a task
    t_res = client.post(
        "/api/v1/tasks",
        headers=headers,
        json={"title": "Test Pausing Task", "estimated_minutes": 25}
    )
    assert t_res.status_code == 201
    task_id = t_res.json()["id"]

    # 2. Start a focus session for this task
    s_res = client.post(
        "/api/v1/focus/start",
        headers=headers,
        json={"task_id": task_id, "duration_minutes": 25}
    )
    assert s_res.status_code == 201
    assert s_res.json()["status"] == "active"

    # Task remains todo while focus session is active
    check_task = client.get(f"/api/v1/tasks/{task_id}", headers=headers).json()
    assert check_task["status"] == "todo"

    # 3. Post to /api/v1/tasks/{task_id}/pause
    pause_res = client.post(f"/api/v1/tasks/{task_id}/pause", headers=headers)
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "todo"

    # Verify session is also paused
    curr_sess = client.get("/api/v1/focus/current", headers=headers).json()
    assert curr_sess["status"] == "paused"

    # 4. Post to /api/v1/tasks/{task_id}/resume
    resume_res = client.post(f"/api/v1/tasks/{task_id}/resume", headers=headers)
    assert resume_res.status_code == 200
    assert resume_res.json()["status"] == "todo"

    # Verify session is also active
    curr_sess_after = client.get("/api/v1/focus/current", headers=headers).json()
    assert curr_sess_after["status"] == "active"



