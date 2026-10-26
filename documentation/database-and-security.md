# Database and Security Specification

This document details the database schema, indexing strategy, data lifecycle management, cryptographic implementation, and security policies governing the Focus platform.

---

## 1. Relational Database Schema

The database schema is modeled using SQLModel (SQLAlchemy 2.0). All primary identifiers are UUIDv4 to eliminate enumeration vulnerabilities and facilitate offline ID generation by client applications.

### Entity-Relationship Overview

```
+-------------------------------------------------------+
|                        users                          |
+-------------------------------------------------------+
| id: UUID (PK)                                         |
| username: VARCHAR (Unique, Index, Nullable)           |
| email: VARCHAR (Unique, Index, Nullable)              |
| hashed_password: VARCHAR (Not Null)                   |
| full_name: VARCHAR (Nullable)                         |
| avatar_url: VARCHAR (Nullable)                        |
| is_active: BOOLEAN (Default: True)                    |
| role: VARCHAR (Default: "user")                       |
| created_at: TIMESTAMP WITH TIME ZONE                  |
| updated_at: TIMESTAMP WITH TIME ZONE                  |
+-------------------------------------------------------+
        |                               |
        | 1:N                           | 1:N
        v                               v
+-----------------------------+ +-----------------------------+
|          projects           | |            tasks            |
+-----------------------------+ +-----------------------------+
| id: UUID (PK)               | | id: UUID (PK)               |
| user_id: UUID (FK -> users) | | user_id: UUID (FK -> users) |
| title: VARCHAR              | | project_id: UUID (FK, Null) |
| description: TEXT (Null)    | | title: VARCHAR              |
| status: VARCHAR             | | description: TEXT (Null)    |
| color: VARCHAR (Null)       | | status: VARCHAR             |
| icon: VARCHAR (Null)        | | priority: VARCHAR           |
| is_deleted: BOOLEAN         | | estimated_minutes: INT      |
| deleted_at: TIMESTAMP       | | order_index: INT            |
| created_at: TIMESTAMP       | | completed_at: TIMESTAMP     |
| updated_at: TIMESTAMP       | | is_deleted: BOOLEAN         |
+-----------------------------+ | deleted_at: TIMESTAMP       |
               |                | created_at: TIMESTAMP       |
               | 1:N (Optional) | updated_at: TIMESTAMP       |
               +--------------->+-----------------------------+
                                               |
                                               | 1:N
                                               v
                                +-----------------------------+
                                |       focus_sessions        |
                                +-----------------------------+
                                | id: UUID (PK)               |
                                | user_id: UUID (FK -> users) |
                                | task_id: UUID (FK -> tasks) |
                                | duration_minutes: INT       |
                                | started_at: TIMESTAMP       |
                                | ended_at: TIMESTAMP (Null)  |
                                | status: VARCHAR             |
                                | actual_focus_seconds: INT   |
                                | auto_complete_task: BOOLEAN |
                                | notes: TEXT (Null)          |
                                | is_deleted: BOOLEAN         |
                                | deleted_at: TIMESTAMP       |
                                | created_at: TIMESTAMP       |
                                | updated_at: TIMESTAMP       |
                                +-----------------------------+

+-------------------------------------------------------+
|                      audit_logs                       |
+-------------------------------------------------------+
| id: UUID (PK)                                         |
| timestamp: TIMESTAMP WITH TIME ZONE (Default: now)    |
| action: VARCHAR (Not Null, Index)                     |
| actor: VARCHAR (Not Null, Index)                      |
| details: TEXT (Not Null)                              |
| severity: VARCHAR (info | success | warning | danger) |
| ip_address: VARCHAR (Not Null)                        |
+-------------------------------------------------------+

+-------------------------------------------------------+
|                   platform_configs                    |
+-------------------------------------------------------+
| id: INT (PK, Single row id=1)                         |
| allow_registrations: BOOLEAN (Default: True)          |
| maintenance_mode: BOOLEAN (Default: False)            |
| guest_mode_enabled: BOOLEAN (Default: True)           |
| enforce_email_verification: BOOLEAN (Default: False)  |
| default_focus_duration: INT (Default: 25)             |
| updated_at: TIMESTAMP WITH TIME ZONE                  |
+-------------------------------------------------------+
```

---

## 2. Table Specifications and Constraints

### `users` Table
- Stores user credentials and profile state.
- Supports flexible registration where either `username` or `email` can act as the unique primary handle.
- Indexes:
  - `ix_users_username` on `username` (UNIQUE)
  - `ix_users_email` on `email` (UNIQUE)

### `projects` Table
- Represents task groups, milestones, or goal buckets.
- Foreign Key: `user_id` references `users.id` on delete restrict.
- Indexes:
  - `ix_projects_user_id` on `user_id`
  - `ix_projects_status` on `status`
  - `ix_projects_is_deleted` on `is_deleted`

### `tasks` Table
- Represents discrete backlog work items.
- Foreign Keys:
  - `user_id` references `users.id`
  - `project_id` references `projects.id` (NULL allows standalone inbox tasks)
- Indexes:
  - `ix_tasks_user_id` on `user_id`
  - `ix_tasks_project_id` on `project_id`
  - `ix_tasks_status` on `status`
  - `ix_tasks_priority` on `priority`
  - `ix_tasks_is_deleted` on `is_deleted`

### `focus_sessions` Table
- Records individual timed focus periods, Pomodoro intervals, and completion notes.
- Foreign Keys:
  - `user_id` references `users.id`
  - `task_id` references `tasks.id`
- Indexes:
  - `ix_focus_sessions_user_id` on `user_id`
  - `ix_focus_sessions_task_id` on `task_id`
  - `ix_focus_sessions_status` on `status`
  - `ix_focus_sessions_is_deleted` on `is_deleted`

### `audit_logs` Table
- Maintains an immutable audit trail of security-sensitive events, authentication milestones, and administrative operations.
- Primary Key: `id` (UUIDv4)
- Fields:
  - `timestamp`: UTC timestamp with timezone
  - `action`: Canonical event identifier (e.g. `AUTH_LOGIN_SUCCESS`, `USER_ACCOUNT_CLOSED`)
  - `actor`: Username, email, or `anonymous` identifier who triggered the event
  - `details`: Human-readable description and operational parameters
  - `severity`: Event tier (`info`, `success`, `warning`, `danger`)
  - `ip_address`: Resolved client IP address
- Indexes:
  - `ix_audit_logs_action` on `action`
  - `ix_audit_logs_actor` on `actor`
  - `ix_audit_logs_timestamp` on `timestamp`

### `platform_configs` Table
- Single-row platform settings store for runtime feature toggles and platform health management.
- Fields:
  - `allow_registrations`: Enables or disables new account registrations
  - `maintenance_mode`: Signals platform maintenance to client applications
  - `guest_mode_enabled`: Allows unauthenticated offline task management
  - `enforce_email_verification`: Flag for mandatory email verification
  - `default_focus_duration`: Default session minutes for new timers (default: 25)

---

## 3. Data Lifecycle, Soft-Deletion & Hard Deletion

To protect against irreversible accidental data loss and support offline synchronization, entities are soft-deleted by default:

1. Deletion Flagging:
   Deleting an entity sets `is_deleted = True`, records the UTC timestamp in `deleted_at`, and updates `updated_at`.

2. Cascading Soft Deletions:
   - When a Project is deleted, all associated non-deleted Tasks are automatically marked `is_deleted = True`.
   - All associated Focus Sessions for those Tasks are similarly marked `is_deleted = True`.
   - When an individual Task is deleted, its associated Focus Sessions are marked `is_deleted = True`.
   - When a user self-deactivates their account (`DELETE /api/v1/auth/me`), their user account is deactivated and all their projects, tasks, and sessions are soft-deleted.

3. Hard Deletion (Permanent Expunge):
   - In compliance with privacy regulations (GDPR "Right to be Forgotten") and administrative requirements, administrators can permanently expunge records via `DELETE /api/v1/admin/users/{id}?hard_delete=true`.
   - Hard deletion runs explicit cascade deletions removing all associated `FocusSession`, `Task`, and `Project` records before calling `db.delete(user)` to permanently purge the user row from physical storage.
   - Emits a high-severity `USER_DELETED` audit event explicitly noting that the record was permanently expunged.

4. Query Isolation:
   Standard queries append `.where(Model.is_deleted == False)` unless `include_deleted=True` is explicitly requested during delta synchronization.

---

## 4. Database Connection & Pooling Strategy

Located in `app/core/database.py`, the engine configures environment-appropriate behaviors:

### SQLite (Local Development)
- Connect Argument: `check_same_thread=False` allows FastAPI concurrent request threads to use the connection safely.
- Engine Option: `echo=False` suppresses noisy SQL logging.

### PostgreSQL (Production & Cloud Deployments)
- Driver: `psycopg` (binary version 3).
- Automatic URL dialect normalization: converts `postgres://` or `postgresql://` URIs to `postgresql+psycopg://`.
- Connection Pooling:
  - `pool_pre_ping=True`: Probes connections before dispensing them from the pool to recycle stale connections dropped by cloud providers (such as AWS, Neon, or Supabase).
  - `pool_recycle=300`: Automatically recycles connections every 5 minutes to avoid idle timeouts.

---

## 5. Security & Cryptographic Architecture

### Password Storage: Argon2id with Bcrypt Fallback
Located in `app/core/security.py`:
- Algorithm: Argon2id via `pwdlib[argon2,bcrypt]`.
- Implements `PasswordHash.recommended()`.
- Argon2id provides superior resistance against GPU-based brute-force attacks and side-channel timing attacks compared to legacy PBKDF2 or standard MD5/SHA.
- Transparently verifies legacy Bcrypt hashes if migrating existing user bases.

### Stateless JWT Authentication
- Signature Algorithm: HMAC-SHA256 (`HS256`).
- Expiration: Configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` (defaults to 10,080 minutes / 7 days for mobile and web convenience).
- Payload Structure:
  ```json
  {
    "sub": "<user_uuid>",
    "exp": 1792345200,
    "iat": 1791740400
  }
  ```
- Strict Decoding: `jwt.decode` enforces `algorithms=[settings.ALGORITHM]` to prevent algorithm-switching vulnerabilities (e.g. `none` algorithm exploit).

### Zero Hardcoded Secrets & Production Guardrail
Located in `app/core/config.py`:
- `SECRET_KEY` is set to `None` in the source code.
- All secrets are strictly loaded at runtime from `.env` or system environment variables.
- A Pydantic `@model_validator` inspects settings at boot:
  - If `ENVIRONMENT == "production"` and `SECRET_KEY` is missing or empty, the application raises a fatal `ValueError` and terminates immediately.
  - In local development or isolated test environments without `.env`, an ephemeral key is generated via `secrets.token_hex(32)`.

### CORS (Cross-Origin Resource Sharing) Policy
Located in `main.py`:
- `CORSMiddleware` is configured with explicit origins from `settings.BACKEND_CORS_ORIGINS`.
- In compliance with the W3C CORS specification, wildcard origins (`*`) are never combined with `allow_credentials=True`.
- Development environments support dynamic localhost ports via regex:
  `allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"`
- Permitted HTTP verbs: `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`.

### Multi-Tenant Isolation
- In multi-user systems, Insecure Direct Object References (IDOR) are prevented by enforcing user ownership checks in every query:
  `query = query.where(Model.user_id == current_user.id)`
- Attempts to access, edit, or delete a record belonging to another user return HTTP 404 Not Found rather than exposing existence through 403 Forbidden.

### Role-Based Access Control (RBAC) & Administrative Privileges
Located in `app/api/deps.py`:
- Users possess an explicit `role` attribute (`"user"` or `"admin"`).
- Protected administrative endpoints inject `get_current_admin_user`.
- If an unauthenticated or non-admin user attempts access:
  1. An `AUTH_UNAUTHORIZED_ACCESS` audit event is logged with `severity="danger"` and the client IP address.
  2. The endpoint immediately rejects the request with HTTP 403 Forbidden.

### Centralized Security & Operational Auditing
Located in `app/services/audit.py`:
- Implements `log_audit_event(db, action, actor, details, severity, ip_address)` to record high-signal security and operational events.
- Client IP Extraction: `get_client_ip(request)` safely checks reverse proxy headers (`X-Forwarded-For`), extracting the first public client address, and falls back to `request.client.host`.
- Event Taxonomy:
  - **Category A (Authentication & Access Control):**
    - `AUTH_REGISTER`: New user registration (`severity="success"`)
    - `AUTH_LOGIN_SUCCESS`: Successful authentication (`severity="success"`)
    - `AUTH_LOGIN_FAILED`: Failed credentials attempt (`severity="warning"`)
    - `AUTH_LOGOUT`: Explicit session termination (`severity="info"`)
    - `AUTH_PASSWORD_CHANGED`: Password change verified and committed (`severity="success"`)
    - `AUTH_PASSWORD_CHANGE_FAILED`: Password change failure (`severity="warning"`)
    - `AUTH_UNAUTHORIZED_ACCESS`: Forbidden access attempt to admin console (`severity="danger"`)
  - **Category B (Account & Identity Operations):**
    - `USER_PROFILE_UPDATED`: User modified display name, handle, or avatar (`severity="info"`)
    - `USER_ACCOUNT_CLOSED`: Self-service account deactivation and cascade soft deletion (`severity="warning"`)
  - **Category C (Administrative Operations):**
    - `USER_CREATED`: Administrator provisioned an account (`severity="info"`)
    - `USER_UPDATED`: Administrator modified role or active status (`severity="info"`)
    - `USER_DELETED`: Administrator deactivated (soft) or permanently expunged (hard) user (`severity="danger"`)
    - `PASSWORD_RESET`: Administrator overrode credentials (`severity="warning"`)
    - `CONFIG_UPDATED`: Platform configuration toggles modified (`severity="warning"`)
    - `AUDIT_LOGS_CLEARED`: Audit log history purged (`severity="danger"`)
    - `SYSTEM_DATA_EXPORTED`: Snapshot database exported as JSON (`severity="info"`)

