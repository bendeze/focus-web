# Focus Web

A modern productivity ecosystem featuring a minimalist Pomodoro focus sprint timer, real-time focus analytics, backlog management, and offline-first data synchronization across web, mobile, and cloud.

Part of the Focus suite, designed to work alongside the Android client at [focus-app](https://github.com/bendeze/focus-app).

---

## Overview

Focus Web is designed for intentional deep work. It combines a customizable Pomodoro sprint workflow with weekly productivity heatmaps, session analytics, and task tracking.

Key capabilities:
- Pomodoro Sprint Timer: Configurable focus and break durations, progressive session indicators, smart reset, and Web Audio API synthesized audio alerts.
- Weekly Focus Analytics: Recharts-powered 7-day focus duration bar charts with dynamic comparisons against previous week metrics.
- Activity Heatmaps: GitHub-style consistency visualization across active days and task completions.
- Task and Project Management: Priority tags, estimated durations, and real-time completion tracking.
- System Administration & Security Auditing: Comprehensive admin console with auto-syncing metrics, user management (soft and hard deletion), platform runtime toggles, and security audit logs.
- Unified Backend API: FastAPI service with SQLModel, PostgreSQL/SQLite support, and JWT authentication.

---

## Repository Structure

```text
focus-web/
├── backend/                  # FastAPI Backend Service
│   ├── app/
│   │   ├── api/              # REST API routes, admin console, and dependencies
│   │   ├── core/             # Configuration, security, and database engine
│   │   ├── models/           # SQLModel database tables and schemas
│   │   └── services/         # Shared services (security auditing & IP resolution)
│   ├── tests/                # Automated pytest suite (auth, lifecycle, admin, audit)
│   ├── main.py               # Application entrypoint
│   ├── pyproject.toml        # Python project dependencies
│   └── .env.example          # Environment variable template
│
├── web/                      # React Web Dashboard
│   ├── src/
│   │   ├── components/       # UI widgets, charts, and modal views
│   │   ├── services/         # API client integration
│   │   ├── store/            # Zustand global state management
│   │   ├── utils/            # Synthesized Web Audio and helpers
│   │   └── main.tsx          # React application root
│   ├── package.json          # Node dependencies and scripts
│   ├── vite.config.ts        # Vite configuration
│   └── .env.example          # Web environment template
│
├── .github/
│   ├── workflows/ci.yml      # Continuous integration pipeline
│   ├── ISSUE_TEMPLATE/       # Bug and feature request templates
│   └── PULL_REQUEST_TEMPLATE.md
├── CONTRIBUTING.md           # Contribution guidelines
├── CODE_OF_CONDUCT.md        # Community code of conduct
├── SECURITY.md               # Security vulnerability reporting
├── LICENSE                   # MIT License
└── README.md
```

---

## Ecosystem

- Web Dashboard & Backend API: [focus-web](https://github.com/bendeze/focus-web) (this repository)
- Android Mobile Client: [focus-app](https://github.com/bendeze/focus-app)

---

## Prerequisites

Ensure you have the following installed locally:
- Node.js 18+ and npm 9+
- Python 3.12+ (or [uv](https://github.com/astral-sh/uv) package manager)
- Git

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/bendeze/focus-web.git
cd focus-web
```

### 2. Backend Setup

Navigate to the `backend` directory and set up your environment:

```bash
cd backend
cp .env.example .env
```

Install dependencies and start the development server using uv:

```bash
uv sync
uv run fastapi dev
```

Alternatively, using standard pip:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e .
uvicorn main:app --reload
```

The API will be accessible at:
- API Base URL: `http://127.0.0.1:8000`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`

### 3. Web Dashboard Setup

In a new terminal, navigate to the `web` directory:

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

The web interface will launch locally at `http://localhost:5173`.

---

## Running Tests

### Backend Tests

Run the automated pytest test suite:

```bash
cd backend
uv run pytest
```

### Web Validation

Check types and build output:

```bash
cd web
npm run build
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `PROJECT_NAME` | Display name of the API | `Focus & Todo API` |
| `API_V1_STR` | API route prefix | `/api/v1` |
| `SECRET_KEY` | Cryptographic secret for signing JWT tokens | Required in production |
| `DATABASE_URL` | Primary database connection string | `sqlite:///./focus.db` |
| `DATABASE_URL_POOLED` | Optional pooled connection string | None |

### Web (`web/.env`)

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Base endpoint URL for the backend API | `http://127.0.0.1:8000` |

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, development workflow, and pull request process.

---

## Security

For reporting security vulnerabilities, please refer to [SECURITY.md](SECURITY.md).

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
