import type {
  AdminProject,
  AdminStats,
  AdminSystemUser,
  AuthResponse,
  FocusSession,
  FocusStats,
  PlatformConfig,
  Project,
  SystemAuditLog,
  Task,
  User,
} from '../types';


const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
export function getBaseUrl(): string {
  return localStorage.getItem('focus_api_url') || DEFAULT_API_URL;
}

export function setBaseUrl(url: string): void {
  localStorage.setItem('focus_api_url', url.trim());
}

function getHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const activeToken = token || localStorage.getItem('focus_token');
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 204) {
    return {} as T;
  }
  if (!res.ok) {
    let errorDetail = `Request failed (${res.status})`;
    try {
      const errorJson = await res.json();
      if (typeof errorJson.detail === 'string') {
        errorDetail = errorJson.detail;
      } else if (Array.isArray(errorJson.detail)) {
        errorDetail = errorJson.detail.map((e: any) => e.msg || e.message || JSON.stringify(e)).join(', ');
      }
    } catch {
      errorDetail = res.statusText || errorDetail;
    }
    throw new Error(errorDetail);
  }
  return res.json();
}

export const api = {
  async register(data: { username?: string; email?: string; password: string; full_name?: string }): Promise<AuthResponse> {
    const res = await fetch(`${getBaseUrl()}/api/v1/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(res);
  },

  async login(data: { identifier: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${getBaseUrl()}/api/v1/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<AuthResponse>(res);
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${getBaseUrl()}/api/v1/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse<User>(res);
  },

  async updateProfile(data: { username?: string; email?: string; full_name?: string; avatar_url?: string }): Promise<User> {
    const res = await fetch(`${getBaseUrl()}/api/v1/auth/me`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  async changePassword(data: { current_password: string; new_password: string }): Promise<{ message: string }> {
    const res = await fetch(`${getBaseUrl()}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<{ message: string }>(res);
  },

  async listProjects(params?: { status?: string; updated_after?: string }): Promise<Project[]> {
    const url = new URL(`${getBaseUrl()}/api/v1/projects`);
    if (params?.status) url.searchParams.set('status', params.status);
    if (params?.updated_after) url.searchParams.set('updated_after', params.updated_after);
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    return handleResponse<Project[]>(res);
  },

  async createProject(data: { title: string; description?: string; color?: string; icon?: string }, idempotencyKey?: string): Promise<Project> {
    const headers: Record<string, string> = { ...getHeaders() as Record<string, string> };
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }
    const res = await fetch(`${getBaseUrl()}/api/v1/projects`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<Project>(res);
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const res = await fetch(`${getBaseUrl()}/api/v1/projects/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Project>(res);
  },

  async deleteProject(id: string): Promise<void> {
    const res = await fetch(`${getBaseUrl()}/api/v1/projects/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<void>(res);
  },

  async listTasks(params?: { project_id?: string; standalone?: boolean; status?: string; priority?: string; updated_after?: string; limit?: number; offset?: number }): Promise<Task[]> {
    const url = new URL(`${getBaseUrl()}/api/v1/tasks`);
    if (params?.project_id) url.searchParams.set('project_id', params.project_id);
    if (params?.standalone) url.searchParams.set('standalone', 'true');
    if (params?.status) url.searchParams.set('status', params.status);
    if (params?.priority) url.searchParams.set('priority', params.priority);
    if (params?.updated_after) url.searchParams.set('updated_after', params.updated_after);
    if (params?.limit !== undefined) url.searchParams.set('limit', params.limit.toString());
    if (params?.offset !== undefined) url.searchParams.set('offset', params.offset.toString());
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    return handleResponse<Task[]>(res);
  },

  async createTask(data: { title: string; description?: string; project_id?: string | null; priority?: string; estimated_minutes?: number }, idempotencyKey?: string): Promise<Task> {
    const headers: Record<string, string> = { ...getHeaders() as Record<string, string> };
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }
    const res = await fetch(`${getBaseUrl()}/api/v1/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<Task>(res);
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const res = await fetch(`${getBaseUrl()}/api/v1/tasks/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Task>(res);
  },

  async pauseTask(id: string, data?: { actual_focus_seconds?: number }): Promise<Task> {
    const res = await fetch(`${getBaseUrl()}/api/v1/tasks/${id}/pause`, {
      method: 'POST',
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<Task>(res);
  },

  async resumeTask(id: string): Promise<Task> {
    const res = await fetch(`${getBaseUrl()}/api/v1/tasks/${id}/resume`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<Task>(res);
  },

  async deleteTask(id: string): Promise<void> {
    const res = await fetch(`${getBaseUrl()}/api/v1/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<void>(res);
  },

  async startFocusSession(data: { task_id: string; duration_minutes?: number; auto_complete_task?: boolean }, idempotencyKey?: string): Promise<FocusSession> {
    const headers: Record<string, string> = { ...getHeaders() as Record<string, string> };
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }
    const res = await fetch(`${getBaseUrl()}/api/v1/focus/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    return handleResponse<FocusSession>(res);
  },

  async getCurrentFocusSession(taskId?: string): Promise<FocusSession | null> {
    const url = new URL(`${getBaseUrl()}/api/v1/focus/current`);
    if (taskId) {
      url.searchParams.set('task_id', taskId);
    }
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    return handleResponse<FocusSession | null>(res);
  },

  async pauseFocusSession(id: string, data?: { actual_focus_seconds?: number }): Promise<FocusSession> {
    const res = await fetch(`${getBaseUrl()}/api/v1/focus/${id}/pause`, {
      method: 'POST',
      headers: getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<FocusSession>(res);
  },

  async resumeFocusSession(id: string): Promise<FocusSession> {
    const res = await fetch(`${getBaseUrl()}/api/v1/focus/${id}/resume`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<FocusSession>(res);
  },

  async completeFocusSession(id: string, data?: { actual_focus_seconds?: number; notes?: string }): Promise<FocusSession> {
    const res = await fetch(`${getBaseUrl()}/api/v1/focus/${id}/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data || {}),
    });
    return handleResponse<FocusSession>(res);
  },

  async cancelFocusSession(id: string): Promise<FocusSession> {
    const res = await fetch(`${getBaseUrl()}/api/v1/focus/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<FocusSession>(res);
  },

  async getFocusStats(): Promise<FocusStats> {
    const res = await fetch(`${getBaseUrl()}/api/v1/focus/stats`, {
      headers: getHeaders(),
    });
    return handleResponse<FocusStats>(res);
  },

  async listFocusSessions(params?: { task_id?: string; status?: string; updated_after?: string }): Promise<FocusSession[]> {
    const url = new URL(`${getBaseUrl()}/api/v1/focus/sessions`);
    if (params?.task_id) url.searchParams.set('task_id', params.task_id);
    if (params?.status) url.searchParams.set('status', params.status);
    if (params?.updated_after) url.searchParams.set('updated_after', params.updated_after);
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    return handleResponse<FocusSession[]>(res);
  },

  // ----------------------------------------------------
  // System Administrator API Endpoints (Real Backend)
  // ----------------------------------------------------

  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${getBaseUrl()}/api/v1/admin/stats`, {
      headers: getHeaders(),
    });
    return handleResponse<AdminStats>(res);
  },

  async getAdminUsers(): Promise<AdminSystemUser[]> {
    const res = await fetch(`${getBaseUrl()}/api/v1/admin/users`, {
      headers: getHeaders(),
    });
    return handleResponse<AdminSystemUser[]>(res);
  },

  async createAdminUser(data: { username: string; email: string; password: string; full_name?: string; role?: string }): Promise<User> {
    const res = await fetch(`${getBaseUrl()}/api/v1/admin/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  async updateAdminUser(userId: string, data: { full_name?: string; role?: string; is_active?: boolean; is_admin?: boolean }): Promise<User> {
    const res = await fetch(`${getBaseUrl()}/api/v1/admin/users/${userId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<User>(res);
  },

  async resetAdminUserPassword(userId: string, newPassword?: string): Promise<{ message: string; temporary_password: string }> {
    const res = await fetch(`${getBaseUrl()}/api/v1/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(newPassword ? { new_password: newPassword } : {}),
    });
    return handleResponse<{ message: string; temporary_password: string }>(res);
  },

  async deleteAdminUser(userId: string, hardDelete: boolean = false): Promise<{ message: string; hard_deleted?: boolean }> {
    const url = new URL(`${getBaseUrl()}/api/v1/admin/users/${userId}`);
    if (hardDelete) {
      url.searchParams.set('hard_delete', 'true');
    }
    const res = await fetch(url.toString(), {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ message: string; hard_deleted?: boolean }>(res);
  },

  async getAdminTasks(params?: { status?: string; priority?: string; limit?: number; offset?: number }): Promise<any[]> {
    const url = new URL(`${getBaseUrl()}/api/v1/admin/tasks`);
    if (params?.status) url.searchParams.set('status', params.status);
    if (params?.priority) url.searchParams.set('priority', params.priority);
    if (params?.limit !== undefined) url.searchParams.set('limit', params.limit.toString());
    if (params?.offset !== undefined) url.searchParams.set('offset', params.offset.toString());
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async getAdminProjects(params?: { status?: string; user_id?: string; limit?: number; offset?: number }): Promise<AdminProject[]> {
    try {
      const url = new URL(`${getBaseUrl()}/api/v1/admin/projects`);
      if (params?.status) url.searchParams.set('status', params.status);
      if (params?.user_id) url.searchParams.set('user_id', params.user_id);
      if (params?.limit !== undefined) url.searchParams.set('limit', params.limit.toString());
      if (params?.offset !== undefined) url.searchParams.set('offset', params.offset.toString());
      console.log('[API] Fetching getAdminProjects URL:', url.toString(), 'token present:', !!localStorage.getItem('focus_token'));
      const res = await fetch(url.toString(), {
        headers: getHeaders(),
      });
      console.log('[API] getAdminProjects HTTP status:', res.status, res.statusText);
      return await handleResponse<AdminProject[]>(res);
    } catch (err: any) {
      console.error('[API] getAdminProjects ERROR caught:', err.name, err.message, err);
      throw err;
    }
  },

  async createAdminProject(data: {
    title: string;
    description?: string;
    user_id?: string;
    status?: string;
    color?: string;
    icon?: string;
  }): Promise<AdminProject> {
    const res = await fetch(`${getBaseUrl()}/api/v1/admin/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<AdminProject>(res);
  },

  async updateAdminProject(projectId: string, data: Partial<AdminProject>): Promise<AdminProject> {
    const res = await fetch(`${getBaseUrl()}/api/v1/admin/projects/${projectId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<AdminProject>(res);
  },

  async deleteAdminProject(projectId: string, hardDelete: boolean = false): Promise<{ message: string; hard_deleted?: boolean }> {
    const url = new URL(`${getBaseUrl()}/api/v1/admin/projects/${projectId}`);
    if (hardDelete) url.searchParams.set('hard_delete', 'true');
    const res = await fetch(url.toString(), {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ message: string; hard_deleted?: boolean }>(res);
  },

  async getAdminAuditLogs(limit: number = 50): Promise<SystemAuditLog[]> {
    const url = new URL(`${getBaseUrl()}/api/v1/admin/audit-logs`);
    url.searchParams.set('limit', limit.toString());
    const res = await fetch(url.toString(), {
      headers: getHeaders(),
    });
    return handleResponse<SystemAuditLog[]>(res);
  },

  async clearAdminAuditLogs(): Promise<{ message: string }> {
    const res = await fetch(`${getBaseUrl()}/api/v1/admin/audit-logs`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  async getAdminConfig(): Promise<PlatformConfig> {
    const res = await fetch(`${getBaseUrl()}/api/v1/admin/config`, {
      headers: getHeaders(),
    });
    return handleResponse<PlatformConfig>(res);
  },

  async updateAdminConfig(data: Partial<PlatformConfig>): Promise<PlatformConfig> {
    const res = await fetch(`${getBaseUrl()}/api/v1/admin/config`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<PlatformConfig>(res);
  },

  async exportAdminData(): Promise<any> {
    const res = await fetch(`${getBaseUrl()}/api/v1/admin/export`, {
      headers: getHeaders(),
    });
    return handleResponse<any>(res);
  },
};
