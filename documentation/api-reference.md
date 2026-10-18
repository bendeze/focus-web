# API Reference

This document provides a comprehensive specification for the Focus REST API (Version 1).

---

## Global Specifications

### Base URL
- Development: `http://127.0.0.1:8000/api/v1`
- Interactive OpenAPI Docs: `http://127.0.0.1:8000/docs`
- ReDoc Reference: `http://127.0.0.1:8000/redoc`

### Standard Headers

| Header | Type | Description |
|---|---|---|
| `Content-Type` | string | `application/json` for request bodies |
| `Authorization` | string | `Bearer <access_token>` for authenticated routes |
| `X-Idempotency-Key` | UUID string | Optional header for safe offline retry on entity creation |

### Standard HTTP Status Codes

| Code | Status | Meaning |
|---|---|---|
| 200 | OK | Successful request returning a payload |
| 201 | Created | Entity successfully created |
| 204 | No Content | Entity successfully deleted or action performed with no body |
| 400 | Bad Request | Semantic validation failure or invalid state transition |
| 401 | Unauthorized | Missing, invalid, or expired authentication token |
| 403 | Forbidden | Accessing a deactivated account or forbidden operation |
| 404 | Not Found | Entity not found or not owned by the authenticated user |
| 409 | Conflict | Uniqueness constraint violated (e.g., username/email exists) |
| 422 | Unprocessable Entity | Schema or payload formatting validation failed |

---

## 1. Health & Status

### GET `/`
Returns the operational health and version of the API service.

- Authentication: Public
- Status Code: 200 OK

Response:
```json
{
  "status": "healthy",
  "app": "Focus & Todo API",
  "version": "0.1.0",
  "docs": "/docs"
}
```

---

## 2. Authentication & Account (`/api/v1/auth`)

### POST `/api/v1/auth/register`
Registers a new user account with flexible identification. Accepts an `identifier` (auto-categorized as email or username), or explicit `username` and `email` fields.

- Authentication: Public
- Status Code: 201 Created

Request Body:
```json
{
  "identifier": "alex_focus",
  "password": "securepassword123",
  "full_name": "Alex Mercer"
}
```

Response (TokenResponse):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in_seconds": 604800,
  "user": {
    "id": "c3b88a8f-b98a-4c28-98f5-96147493cb52",
    "username": "alex_focus",
    "email": null,
    "full_name": "Alex Mercer",
    "avatar_url": null,
    "is_active": true,
    "created_at": "2026-10-18T19:30:00Z",
    "updated_at": "2026-10-18T19:30:00Z"
  }
}
```

### POST `/api/v1/auth/login`
Authenticates a user via their username OR email address and account password.

- Authentication: Public
- Status Code: 200 OK

Request Body:
```json
{
  "identifier": "alex_focus",
  "password": "securepassword123"
}
```

Response: Same as `TokenResponse`.

### GET `/api/v1/auth/me`
Fetches the profile details of the currently authenticated user.

- Authentication: Bearer Token
- Status Code: 200 OK

Response:
```json
{
  "id": "c3b88a8f-b98a-4c28-98f5-96147493cb52",
  "username": "alex_focus",
  "email": "alex@example.com",
  "full_name": "Alex Mercer",
  "avatar_url": "https://example.com/avatar.jpg",
  "is_active": true,
  "created_at": "2026-10-18T19:30:00Z",
  "updated_at": "2026-10-18T19:30:00Z"
}
```

### PATCH `/api/v1/auth/me`
Updates profile information including username, email, full name, or avatar URL.

- Authentication: Bearer Token
- Status Code: 200 OK

Request Body:
```json
{
  "full_name": "Alexander Mercer",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

### POST `/api/v1/auth/change-password`
Updates the authenticated user's password. Requires verifying the current password.

- Authentication: Bearer Token
- Status Code: 200 OK

Request Body:
```json
{
  "current_password": "securepassword123",
  "new_password": "evenmoresecurepassword456"
}
```

Response:
```json
{
  "message": "Password changed successfully"
}
```

### POST `/api/v1/auth/logout`
Explicit logout endpoint for clients to notify session termination.

- Authentication: Bearer Token
- Status Code: 200 OK

Response:
```json
{
  "message": "Successfully logged out"
}
```

---

## 3. Projects (`/api/v1/projects`)

### POST `/api/v1/projects`
Creates a project bucket or milestone goal.

- Authentication: Bearer Token
- Status Code: 201 Created
- Optional Header: `X-Idempotency-Key: <UUID>`

Request Body:
```json
{
  "title": "Mobile Client v1",
  "description": "Cross-platform mobile application development",
  "status": "active",
  "color": "#10B981",
  "icon": "folder"
}
```

Response (ProjectResponse):
```json
{
  "id": "e4f88a8f-b98a-4c28-98f5-96147493cb99",
  "user_id": "c3b88a8f-b98a-4c28-98f5-96147493cb52",
  "title": "Mobile Client v1",
  "description": "Cross-platform mobile application development",
  "status": "active",
  "color": "#10B981",
  "icon": "folder",
  "is_deleted": false,
  "deleted_at": null,
  "created_at": "2026-10-18T19:30:00Z",
  "updated_at": "2026-10-18T19:30:00Z",
  "total_tasks": 0,
  "completed_tasks": 0,
  "total_focus_minutes": 0
}
```

### GET `/api/v1/projects`
Lists all projects owned by the authenticated user. Includes batch calculation of task and focus session totals.

- Authentication: Bearer Token
- Status Code: 200 OK

Query Parameters:
- `status` (string, optional): Filter by `active`, `completed`, or `archived`.
- `updated_after` (datetime, optional): Delta sync filter for records updated at or after this ISO timestamp.
- `include_deleted` (bool, optional): Include soft-deleted projects (defaults to `true` when `updated_after` is provided, `false` otherwise).

### GET `/api/v1/projects/{project_id}`
Retrieves a specific project by UUID.

- Authentication: Bearer Token
- Status Code: 200 OK (or 404 if not found / not owned)

### PATCH `/api/v1/projects/{project_id}`
Modifies project fields (title, description, status, color, icon).

- Authentication: Bearer Token
- Status Code: 200 OK

### DELETE `/api/v1/projects/{project_id}`
Performs a soft deletion of the project, cascading soft-deletes to all child tasks and associated focus sessions.

- Authentication: Bearer Token
- Status Code: 204 No Content

---

## 4. Tasks (`/api/v1/tasks`)

### POST `/api/v1/tasks`
Creates a new task. Tasks can be standalone (inbox) or assigned to a project.

- Authentication: Bearer Token
- Status Code: 201 Created
- Optional Header: `X-Idempotency-Key: <UUID>`

Request Body:
```json
{
  "title": "Implement JWT Refresh Rotation",
  "description": "Add silent token refresh support in mobile and web clients",
  "project_id": "e4f88a8f-b98a-4c28-98f5-96147493cb99",
  "status": "todo",
  "priority": "high",
  "estimated_minutes": 25,
  "order_index": 0
}
```

Response (TaskResponse):
```json
{
  "id": "71a88a8f-b98a-4c28-98f5-96147493cb01",
  "user_id": "c3b88a8f-b98a-4c28-98f5-96147493cb52",
  "project_id": "e4f88a8f-b98a-4c28-98f5-96147493cb99",
  "title": "Implement JWT Refresh Rotation",
  "description": "Add silent token refresh support in mobile and web clients",
  "status": "todo",
  "priority": "high",
  "estimated_minutes": 25,
  "order_index": 0,
  "completed_at": null,
  "is_deleted": false,
  "deleted_at": null,
  "created_at": "2026-10-18T19:35:00Z",
  "updated_at": "2026-10-18T19:35:00Z",
  "total_focus_minutes": 0,
  "focus_session_count": 0
}
```

### GET `/api/v1/tasks`
Lists tasks with multi-factor filtering, pagination, and delta synchronization.

- Authentication: Bearer Token
- Status Code: 200 OK

Query Parameters:
- `project_id` (UUID, optional): Filter by project ID.
- `standalone` (bool, optional): If `true`, returns only standalone backlog tasks with no project assigned.
- `status` (string, optional): Filter by `todo`, `in_progress`, `paused`, `completed`, or `cancelled`.
- `priority` (string, optional): Filter by `low`, `medium`, `high`, or `urgent`.
- `updated_after` (datetime, optional): Delta sync filter.
- `include_deleted` (bool, optional): Include soft-deleted tasks.
- `limit` (int, optional, 1-100): Pagination limit.
- `offset` (int, optional, >=0): Pagination offset.

### PATCH `/api/v1/tasks/reorder`
Bulk updates the backlog ordering positions (`order_index`) of multiple tasks in a single transaction.

- Authentication: Bearer Token
- Status Code: 200 OK

Request Body:
```json
{
  "items": [
    { "task_id": "71a88a8f-b98a-4c28-98f5-96147493cb01", "order_index": 0 },
    { "task_id": "82b88a8f-b98a-4c28-98f5-96147493cb02", "order_index": 1 }
  ]
}
```

### GET `/api/v1/tasks/{task_id}`
Retrieves full details of a specific task.

- Authentication: Bearer Token
- Status Code: 200 OK

### PATCH `/api/v1/tasks/{task_id}`
Updates task attributes or status. Status transitions to `completed` automatically record `completed_at` timestamps.

- Authentication: Bearer Token
- Status Code: 200 OK

### POST `/api/v1/tasks/{task_id}/pause`
Idempotently pauses any running focus sprint for the task and persists elapsed focus seconds.

- Authentication: Bearer Token
- Status Code: 200 OK

### POST `/api/v1/tasks/{task_id}/resume`
Idempotently resumes a paused focus sprint for the task.

- Authentication: Bearer Token
- Status Code: 200 OK

### DELETE `/api/v1/tasks/{task_id}`
Soft deletes the task and its associated focus sessions.

- Authentication: Bearer Token
- Status Code: 204 No Content

---

## 5. Focus Sessions & Analytics (`/api/v1/focus`)

### POST `/api/v1/focus/start`
Starts a timed focus session for a designated task. Automatically pauses any previously active focus session to ensure single-timer integrity.

- Authentication: Bearer Token
- Status Code: 201 Created
- Optional Header: `X-Idempotency-Key: <UUID>`

Request Body:
```json
{
  "task_id": "71a88a8f-b98a-4c28-98f5-96147493cb01",
  "duration_minutes": 25,
  "auto_complete_task": true
}
```

Response (FocusSessionResponse):
```json
{
  "id": "99c88a8f-b98a-4c28-98f5-96147493cb33",
  "user_id": "c3b88a8f-b98a-4c28-98f5-96147493cb52",
  "task_id": "71a88a8f-b98a-4c28-98f5-96147493cb01",
  "duration_minutes": 25,
  "started_at": "2026-10-18T19:40:00Z",
  "ended_at": null,
  "status": "active",
  "actual_focus_seconds": 0,
  "auto_complete_task": true,
  "notes": null,
  "is_deleted": false,
  "deleted_at": null,
  "created_at": "2026-10-18T19:40:00Z",
  "updated_at": "2026-10-18T19:40:00Z"
}
```

### GET `/api/v1/focus/current`
Returns the active focus session, or the most recent paused session if none is currently active.

- Authentication: Bearer Token
- Status Code: 200 OK (Returns `null` if no active/paused session exists)

### GET `/api/v1/focus/sessions`
Lists focus session history with optional filtering by task, status, or delta sync timestamp.

- Authentication: Bearer Token
- Status Code: 200 OK

### POST `/api/v1/focus/{session_id}/pause`
Idempotently pauses the active session and records elapsed focus seconds.

- Authentication: Bearer Token
- Status Code: 200 OK

### POST `/api/v1/focus/{session_id}/resume`
Idempotently resumes a paused session.

- Authentication: Bearer Token
- Status Code: 200 OK

### POST `/api/v1/focus/{session_id}/complete`
Marks the session as completed, stores final elapsed seconds and optional reflection notes. If `auto_complete_task` is enabled, the associated task is automatically marked as `completed`.

- Authentication: Bearer Token
- Status Code: 200 OK

Request Body:
```json
{
  "actual_focus_seconds": 1500,
  "notes": "Completed test coverage and refactoring"
}
```

### POST `/api/v1/focus/{session_id}/cancel`
Cancels / abandons an ongoing focus session without marking the task as completed.

- Authentication: Bearer Token
- Status Code: 200 OK

### GET `/api/v1/focus/stats`
Aggregates summary statistics for the user profile and dashboard KPI cards.

- Authentication: Bearer Token
- Status Code: 200 OK

Response:
```json
{
  "total_focus_minutes": 320,
  "total_sessions_count": 14,
  "completed_sessions_count": 12,
  "completed_tasks_count": 9,
  "active_session": null
}
```
