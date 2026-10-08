# PR Focus Monorepo (Backend, Web Dashboard & Mobile)

A high-performance productivity ecosystem featuring an Agile Todo backlog and Focus Mode timer with offline-first synchronization across mobile, web, and cloud.

---

## 📂 Repository Architecture

```text
pr-focus/
├── backend/                  # FastAPI Backend API
│   ├── app/
│   │   ├── api/              # API endpoints & dependency injection
│   │   ├── core/             # Configuration, DB engine & JWT security
│   │   └── models/           # SQLModel database tables & Pydantic schemas
│   ├── tests/                # Automated pytest suite (auth, tasks, sync)
│   ├── main.py               # Application entrypoint & lifespan
│   ├── pyproject.toml        # Dependencies & package configuration
│   └── .env                  # Environment configuration
│
├── web/                      # Web Dashboard (React / Vite)
│   └── ...                   # Metrics, Tasks, Timer, Settings
│
├── mobile/                   # Android Client (Kotlin / Room SQLite)
│   └── ...                   # Offline-first mobile application
│
├── .gitignore                # Root gitignore for Python, Node, & Android
└── README.md
```

---

## ⚡ Backend Development & Deployment

### Run Locally

```bash
cd backend
uv run fastapi dev
```

The API will be available at:
- **API Root**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

### Run Backend Tests

```bash
cd backend
uv run pytest
```

### Deploy to FastAPI Cloud

```bash
cd backend
uv run fastapi deploy
```
