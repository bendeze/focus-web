# Development and Deployment Guide

This document provides setup instructions, local development workflows, testing procedures, and production deployment guidelines for the Focus backend and frontend services.

---

## 1. Prerequisites

Before installing the application, ensure the host system has the following runtimes installed:

- Python: Version `>= 3.14`
- Node.js: Version `>= 20.0.0` (LTS recommended)
- Package Managers:
  - `uv` (Fast Python package and environment manager): [Installation Guide](https://docs.astral.sh/uv/)
  - `npm` (Included with Node.js)
- Git: Version `>= 2.30`

---

## 2. Local Development Setup

### Repository Setup
Clone the repository:
```bash
git clone https://github.com/bendeze/focus-web.git
cd focus-web
```

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies into a localized virtual environment using `uv`:
   ```bash
   uv sync
   ```

3. Configure Environment Variables:
   Create a `.env` file from the provided example:
   ```bash
   cp .env.example .env
   ```

4. Generate a Secure Secret Key:
   Run the following command to generate a cryptographically random 64-character hex key:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
   Paste the generated string into your `backend/.env` file:
   ```env
   SECRET_KEY="<generated_random_64_character_hex_key>"
   ENVIRONMENT="development"
   DATABASE_URL="sqlite:///./focus.db"
   ```

5. Start the Backend Development Server:
   ```bash
   uv run fastapi dev
   ```
   The backend API will start at `http://127.0.0.1:8000` with hot-reloading enabled.
   Interactive Swagger documentation is available at `http://127.0.0.1:8000/docs`.

---

### Frontend Setup

1. Open a new terminal and navigate to the web directory:
   ```bash
   cd web
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables (Optional):
   By default, the frontend connects to `http://localhost:8000/api/v1`. If connecting to a different host or port, create a `.env` file:
   ```env
   VITE_API_URL="http://localhost:8000/api/v1"
   ```

4. Start the Frontend Development Server:
   ```bash
   npm run dev
   ```
   The Vite dev server will launch at `http://localhost:5173`.

---

## 3. Automated Testing and Quality Checks

### Backend Test Suite
The backend incorporates a comprehensive pytest integration test suite that tests authentication, project CRUD, task reordering, focus sessions, and delta sync against an isolated in-memory SQLite database:

```bash
cd backend
uv run pytest
```

Expected output:
```
======================== 18 passed in 3.04s ========================
```

### Frontend Type Checking and Linting
Run the ESLint suite:
```bash
cd web
npm run lint
```

Verify TypeScript compilation and generate the production bundle:
```bash
npm run build
```
The build executes `tsc -b && vite build` and must complete with zero errors.

---

## 4. Production Deployment Guidelines

### Backend Deployment

1. Production Server:
   Deploy using an ASGI server such as `uvicorn` or `gunicorn` managed by a process manager (such as Systemd, Docker, or Kubernetes):
   ```bash
   uv run uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4 --proxy-headers
   ```

2. Production Environment Variables:
   Set the following variables in the production environment or container secrets:
   - `ENVIRONMENT="production"`: Activates strict security assertions (terminates boot if `SECRET_KEY` is missing or default).
   - `SECRET_KEY`: A cryptographically secure random string with minimum 32 bytes of entropy.
   - `DATABASE_URL`: Production PostgreSQL connection string (e.g., Neon, AWS RDS, Supabase):
     ```
     DATABASE_URL="postgresql://user:password@db-host:5432/focus_prod?sslmode=require"
     ```
   - `DATABASE_URL_POOLED`: Optional pooled endpoint for serverless architectures.
   - `BACKEND_CORS_ORIGINS`: JSON array or comma-separated string containing your production frontend domain:
     ```
     BACKEND_CORS_ORIGINS='["https://focus.yourdomain.com"]'
     ```

3. Reverse Proxy Configuration:
   Route incoming traffic through Nginx, Caddy, or Cloudflare with SSL/TLS termination, HTTP/2 or HTTP/3, and rate limiting enabled.

---

### Frontend Deployment

1. Compile Production Assets:
   ```bash
   cd web
   npm run build
   ```
   This generates the optimized static bundle in `web/dist/`.

2. Static Hosting:
   The `web/dist/` directory can be deployed to any static hosting provider or CDN:
   - Cloudflare Pages
   - Vercel / Netlify
   - AWS S3 + CloudFront
   - Nginx static directory serving

3. Single-Page Application (SPA) Fallback:
   Ensure your web server or hosting configuration routes all non-file requests back to `index.html` to support client-side routing.

   Example Nginx configuration:
   ```nginx
   server {
       listen 443 ssl http2;
       server_name focus.yourdomain.com;

       root /var/www/focus-web/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

---

## 5. Pre-Deployment Verification Checklist

Before pushing changes or deploying to a staging/production environment, complete the following verification steps:

- [ ] Run `uv run pytest` in `backend/` (all 18 tests must pass).
- [ ] Run `npm run lint` and `npm run build` in `web/` (must pass with 0 errors).
- [ ] Verify that `backend/.env` is not staged (`git status --ignored` shows `!! backend/.env`).
- [ ] Confirm `SECRET_KEY` is set in production environment variables.
- [ ] Verify that production CORS origins in `BACKEND_CORS_ORIGINS` match the frontend domain.
- [ ] Verify PostgreSQL connection pool settings (`pool_pre_ping=True`, `pool_recycle=300`).
