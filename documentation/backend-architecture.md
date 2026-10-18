# Backend Architecture

This document provides a detailed overview of the backend architecture for the Focus application, covering design patterns, module structure, request lifecycles, and performance optimizations.

---

## Technology Stack

- Language: Python 3.14
- Web Framework: FastAPI 0.142+
- ORM & Validation: SQLModel 0.0.48+ (built on SQLAlchemy 2.0 and Pydantic v2)
- Configuration: Pydantic Settings 2.15+
- Cryptography: pwdlib (Argon2id and Bcrypt), PyJWT 2.15+ (HMAC-SHA256)
- Database Drivers: SQLite (standard library) and psycopg3 (PostgreSQL binary driver)
- Package & Environment Management: Astral `uv`

---

## Directory Structure and Module Responsibilities

The backend source code is organized under `backend/app/` following a clean separation of concerns:

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py              # Dependency injection providers (DB session, current user)
│   │   └── v1/                  # Version 1 API routers
│   │       ├── auth.py          # Account registration, login, profile, credentials
│   │       ├── projects.py      # Project organization and status management
│   │       ├── tasks.py         # Task backlog, prioritization, reordering, status
│   │       ├── focus.py         # Pomodoro timers, focus intervals, analytics
│   │       └── router.py        # Central router combining all v1 endpoints
│   ├── core/
│   │   ├── config.py            # Environment-driven settings and validation
│   │   ├── database.py          # Database engine, connection pooling, table initialization
│   │   └── security.py          # Password hashing, token encoding, and token decoding
│   └── models/
│       ├── user.py              # User database model and authentication schemas
│       ├── project.py           # Project database model and creation/update schemas
│       ├── task.py              # Task database model, backlog ordering, and update schemas
│       └── focus.py             # FocusSession database model and metrics schemas
├── tests/
│   ├── test_auth.py             # Authentication and user account test cases
│   └── test_projects_tasks_focus.py # End-to-end integration and data lifecycle tests
├── main.py                      # Application factory, middleware, and lifespan handlers
└── pyproject.toml               # Build configuration, dependencies, and pytest options
```

---

## Layered Architecture

The backend implements a classic layered architecture pattern:

```
+-------------------------------------------------------------+
|                      HTTP Layer                             |
|  - CORS Middleware (FastAPI / Starlette)                    |
|  - Exception Handlers                                       |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                     Routing Layer                           |
|  - APIRouter modules: auth, projects, tasks, focus          |
|  - URL routing, HTTP verb matching, status codes            |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|               Dependency Injection Layer                    |
|  - get_db: Session provisioning with context teardown       |
|  - get_current_user: Bearer JWT validation and user lookup  |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|             Validation & Domain Logic Layer                 |
|  - Pydantic v2 model validators (schemas)                   |
|  - Idempotency resolution (X-Idempotency-Key)               |
|  - Batch calculations (aggregation of task/session metrics) |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                     Data Access Layer                       |
|  - SQLModel / SQLAlchemy engine                             |
|  - SQLite (development) / PostgreSQL (production)           |
+-------------------------------------------------------------+
```

---

## Request Lifecycle

1. Inbound Request:
   The client issues an HTTP request. The CORS middleware evaluates origin headers against the configured whitelist or localhost patterns.

2. Routing and Parameter Extraction:
   The request is dispatched to the corresponding route handler in `app/api/v1/`. Path parameters, query strings, and request bodies are parsed.

3. Dependency Resolution:
   - `get_db`: Yields an active SQLModel `Session`.
   - `get_current_user`: Extracts the Bearer token from the `Authorization` header, decodes and verifies the JWT signature, and queries the user record. If the token is invalid or the account is deactivated, an HTTP 401 or 403 error is raised immediately.

4. Validation:
   Incoming payloads (such as `TaskCreate` or `UserRegister`) are validated via Pydantic model validators before handler logic executes.

5. Business Execution & Persistence:
   The handler performs required validations (such as verifying project ownership), interacts with the database session, commits changes, and refreshes models.

6. Response Serialization:
   The result is serialized into a designated response model (such as `TaskResponse` or `ProjectResponse`), stripping internal database fields (like `hashed_password`).

7. Session Teardown:
   The database session is closed automatically upon completion of the request context.

---

## Dependency Injection Pattern

FastAPI's dependency injection system (`Depends`) is leveraged throughout the application to decouple components:

### 1. Database Session Injection (`get_db`)
Located in `app/core/database.py`:
```python
def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
```
This guarantees that database connections are returned to the pool or closed, even in the event of unhandled exceptions.

### 2. Authentication Injection (`get_current_user`)
Located in `app/api/deps.py`:
```python
def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)]
) -> User:
    ...
```
Injecting `current_user` into endpoints enforces authentication declaratively. Any route requiring user context declares `current_user: Annotated[User, Depends(get_current_user)]`.

---

## High-Performance Batch Aggregations (Eliminating N+1 Queries)

In productivity backends, listing projects or tasks often requires aggregating associated metrics (such as completed task counts, focus session counts, and total focus minutes). A naive implementation queries these metrics iteratively in a loop, resulting in the N+1 query problem.

The Focus backend avoids N+1 queries by implementing batch aggregation functions:

### Task Stats Batching (`_batch_calculate_task_stats`)
Located in `app/api/v1/tasks.py`:
1. Extracts all task IDs from the retrieved page of tasks.
2. Executes a single query to retrieve all completed focus sessions for the extracted task IDs using SQL `IN (...)`.
3. Groups sessions in memory using a hash map (`defaultdict(list)`).
4. Constructs `TaskResponse` models with aggregated minutes and session counts in a single pass.

### Project Stats Batching (`_batch_calculate_project_stats`)
Located in `app/api/v1/projects.py`:
1. Gathers all project IDs for the authenticated user.
2. Queries all associated tasks across those projects in one query.
3. Queries all associated focus sessions across those tasks in a second query.
4. Assembles `ProjectResponse` models in memory.

This approach maintains a constant database query cost ($O(1)$ database round-trips) regardless of whether 5 or 500 items are being retrieved.

---

## Idempotency Pattern

To support reliable offline-to-online transitions and intermittent connectivity on mobile or web clients, creation endpoints support an optional `X-Idempotency-Key` HTTP header.

When an `X-Idempotency-Key` containing a valid UUID string is passed:
1. The backend verifies whether a record with this primary key already exists.
2. If it exists and belongs to the authenticated user, the existing record is returned with an HTTP 200 or 201 status, preventing duplicate records.
3. If the record exists but belongs to a different user, an HTTP 409 Conflict error is returned to prevent key collisions across tenants.
4. If the key does not exist, a new entity is created using that UUID as its primary key.
