# Focus & Todo Mobile Backend API

A high-performance FastAPI backend built for an Agile Todo and Focus Mode mobile application with streamlined authentication, project planning, standalone/project tasks, and timed focus sessions.

## 🚀 Features

- **Minimalist Registration & Login**: Users can register or sign in with either a **username** OR an **email address** + password.
- **UUID Everywhere**: All entity IDs (`User`, `Project`, `Task`, `FocusSession`) are standardized to UUIDv4.
- **JWT Authentication & Multi-Tenancy**: Secure token generation with Argon2/Bcrypt password hashing and PyJWT. Complete per-user data isolation.
- **Project Planning & Goals**:
  - `POST /api/v1/projects`: Create project / plan with title, description, color, and icon.
  - `GET /api/v1/projects`: List projects with live task progress counts and total focus time spent.
  - `GET /api/v1/projects/{id}`: View project details.
  - `PATCH /api/v1/projects/{id}`: Update project details or status (`active`, `completed`, `archived`).
  - `DELETE /api/v1/projects/{id}`: Delete project and associated tasks.
- **Agile Task Backlog (Standalone & Project Tasks)**:
  - `POST /api/v1/tasks`: Create tasks (supports standalone inbox tasks or project tasks, priority `low`|`medium`|`high`|`urgent`, estimated sprint minutes, and backlog ordering).
  - `GET /api/v1/tasks`: Filter tasks by `project_id`, `standalone=true`, `status`, or `priority`.
  - `PATCH /api/v1/tasks/{id}`: Update task details or toggle status (`todo`, `in_progress`, `completed`, `cancelled`).
  - `PATCH /api/v1/tasks/reorder`: Bulk reorder backlog positions.
  - `DELETE /api/v1/tasks/{id}`: Delete task.
- **Timed Focus Mode (Pomodoro / Focus Sprints)**:
  - `POST /api/v1/focus/start`: Start a timed focus session for a task (automatically transitions task to `in_progress`).
  - `GET /api/v1/focus/current`: Retrieve currently active or paused focus session.
  - `POST /api/v1/focus/{id}/pause`: Pause timer.
  - `POST /api/v1/focus/{id}/resume`: Resume timer.
  - `POST /api/v1/focus/{id}/complete`: Complete session -> **automatically sets task to `completed`**.
  - `POST /api/v1/focus/{id}/cancel`: Cancel/abandon active session.
  - `GET /api/v1/focus/stats`: User productivity stats (total focus minutes, completed sessions, completed tasks).
- **Interactive Documentation**: Swagger UI at `/docs` and ReDoc at `/redoc`.

---

## 🛠️ Getting Started

### 1. Run the Development Server

```bash
uv run fastapi dev
```

The API will be available at **`http://127.0.0.1:8000`**.
Interactive API documentation: **`http://127.0.0.1:8000/docs`**

### 2. Run Automated Tests

```bash
uv run pytest
```

---

## 📂 Project Architecture

```
pr-focus/
├── app/
│   ├── api/
│   │   ├── deps.py          # Auth and DB dependency injections
│   │   └── v1/
│   │       ├── auth.py      # Account & Auth endpoints
│   │       ├── projects.py  # Projects CRUD & stats endpoints
│   │       ├── tasks.py     # Agile Tasks & backlog reorder endpoints
│   │       ├── focus.py     # Timed Focus session & auto-completion
│   │       └── router.py    # V1 API router
│   ├── core/
│   │   ├── config.py        # Environment & App Settings
│   │   ├── database.py      # SQLModel engine & session management
│   │   └── security.py      # Password hashing & JWT helpers
│   └── models/
│       ├── user.py          # User model & schemas (UUID primary key)
│       ├── project.py       # Project model & schemas
│       ├── task.py          # Task model & schemas
│       └── focus.py         # FocusSession model & schemas
├── tests/
│   ├── test_auth.py         # Authentication test suite
│   └── test_projects_tasks_focus.py # Core workflow & isolation tests
├── main.py                  # FastAPI application entrypoint
└── pyproject.toml           # uv project configuration
```
