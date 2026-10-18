export interface User {
  id: string;
  username: string | null;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in_seconds: number;
  user: User;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'active' | 'completed' | 'archived';
  color: string | null;
  icon: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  total_tasks: number;
  completed_tasks: number;
  total_focus_minutes: number;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_minutes: number;
  order_index: number;
  completed_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  total_focus_minutes: number;
  focus_session_count: number;
}

export interface FocusSession {
  id: string;
  user_id: string;
  task_id: string;
  duration_minutes: number;
  started_at: string;
  ended_at: string | null;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  actual_focus_seconds: number;
  auto_complete_task: boolean;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FocusStats {
  total_focus_minutes: number;
  total_sessions_count: number;
  completed_sessions_count: number;
  completed_tasks_count: number;
  active_session: FocusSession | null;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  message: string;
}
