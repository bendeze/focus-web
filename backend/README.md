# Focus Backend API

A high-performance, secure, and modular REST API powering the **Focus & Productivity** application, engineered with modern Python 3.14, FastAPI, SQLModel, and Pydantic v2.

---

## 🏛️ Architecture & Design Patterns

The backend follows a clean, layered architecture emphasizing **separation of concerns**, **strict tenant isolation**, and **high-throughput batch processing**:

```
backend/
├── app/
│   ├── api/
│   │   ├── deps.py              # Dependency Injection (Auth, DB session)
│   │   └── v1/                  # Versioned API routes
│   │       ├── auth.py          # Authentication & profile endpoints
│   │       ├── projects.py      # Project & goal management
│   │       ├── tasks.py         # Task backlog, scheduling & reordering
│   │       ├── focus.py         # Pomodoro & sprint focus sessions
│   │       └── router.py        # Centralized v1 router aggregator
│   ├── core/
│   │   ├── config.py            # Type-safe settings via pydantic-settings
│   │   ├── database.py          # SQLModel engine, session lifecycle & pool
│   │   └── security.py          # Argon2id/Bcrypt hashing & PyJWT token handling
│   └── models/
│       ├── user.py              # User entity & auth DTOs
│       ├── project.py           # Project entity & schema validators
│       ├── task.py              # Task entity, priority & reorder schemas
│       └── focus.py             # FocusSession entity & analytics models
├── tests/
│   ├── test_auth.py             # Unit & integration tests for auth
│   └── test_projects_tasks_focus.py # End-to-end CRUD & sync test suite
├── main.py                      # FastAPI application bootstrap & CORS setup
├── pyproject.toml               # Project metadata, dependencies & tool configs
└── uv.lock                      # Deterministic dependency lockfile
```

### Key Design Patterns & Guarantees

1. **Dependency Injection**:
   - `get_db`: Yields database sessions with automatic context-managed closure.
   - `get_current_user`: Verifies Bearer JWTs, checks token validity, ensures active account status, and injects authenticated user entities into endpoints.

2. **Idempotency & Offline-First Resilience**:
   - Write endpoints (`POST /projects`, `POST /tasks`, `POST /focus/start`) support an optional `X-Idempotency-Key` header with UUID validation. Retried requests safely return existing entities without duplicate side-effects.
   - Transition endpoints (`/pause`, `/resume`, `/complete`, `/cancel`) are fully idempotent.

3. **Delta Sync Protocol**:
   - Read endpoints accept an `updated_after` ISO-8601 parameter and `include_deleted` flag, allowing web and mobile clients to fetch incremental updates since their last sync.

4. **$O(1)$ Batch Aggregations (No N+1 Queries)**:
   - Backlog listings (`GET /tasks`) and project overviews (`GET /projects`) execute unified batch queries to correlate focus duration and session counts in a single database round-trip, avoiding $N+1$ query overhead.

5. **Tenant Isolation & Security**:
   - Every read, update, and soft-delete operation validates that the targeted record belongs strictly to `current_user.id`.
   - Cross-entity foreign keys (e.g. moving a task to a project) verify ownership of the target entity before assignment.

---

## 🔒 Security Specifications

| Feature | Implementation | Description |
|---|---|---|
| **Password Hashing** | `pwdlib[argon2,bcrypt]` | Modern Argon2id hashing with transparent Bcrypt fallback |
| **Authentication** | `pyjwt[crypto]` | Stateless JWT with `HS256`, explicit algorithm verification, and configurable expiration |
| **CORS Protection** | `fastapi.middleware.cors` | Strictly configured origins with regex support for dev and credentials validation |
| **Soft Deletions** | `is_deleted` + `deleted_at` | Non-destructive deletes with cascading deactivation of child tasks and sessions |
| **Input Validation** | `pydantic` v2 validators | Normalized identifiers, trimmed usernames, sanitized email formatting, and boundary checks |

---

## 🚀 Getting Started

### Prerequisites

- Python `>=3.14`
- [uv](https://docs.astral.sh/uv/) (recommended for fast, deterministic environment management)

### 1. Install Dependencies

```bash
uv sync
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
|---|---|---|
| `PROJECT_NAME` | `"Focus & Todo API"` | Name displayed in docs |
| `VERSION` | `"0.1.0"` | API version |
| `API_V1_STR` | `"/api/v1"` | URL prefix for v1 routes |
| `ENVIRONMENT` | `"development"` | Environment (`development` or `production`) |
| `SECRET_KEY` | *(Loaded from `.env`)* | Cryptographically random secret key for signing JWT tokens |
| `ALGORITHM` | `"HS256"` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `10080` (7 days) | Token lifetime |
| `BACKEND_CORS_ORIGINS` | `["http://localhost:5173", ...]` | Allowed CORS origins for web/mobile clients |
| `DATABASE_URL` | `"sqlite:///./focus.db"` | Primary database connection string |
| `DATABASE_URL_POOLED` | `None` | Optional pooled connection string for cloud DBs (e.g. Neon) |

### 3. Run Development Server

```bash
uv run fastapi dev
```

The server will start at `http://127.0.0.1:8000` with hot-reload enabled.

---

## 📖 API Documentation

FastAPI automatically generates interactive, OpenAPI-compliant documentation:

- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- **Health Check**: `GET http://127.0.0.1:8000/`

---

## 🧪 Running the Test Suite

The test suite runs against an isolated in-memory SQLite database via pytest:

```bash
uv run pytest
```

---

## 📜 License

MIT License. Open source and community-friendly.
