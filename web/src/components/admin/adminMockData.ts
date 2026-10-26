import type { AdminSystemUser, SystemAuditLog, PlatformConfig } from '../../types';

export const INITIAL_ADMIN_USERS: AdminSystemUser[] = [
  {
    id: 'user-001',
    username: 'alex_dev',
    email: 'alex.rivera@focus.app',
    full_name: 'Alex Rivera',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    is_active: true,
    role: 'user',
    status: 'active',
    total_focus_minutes: 2480,
    tasks_count: 34,
    last_active: '12 minutes ago',
    created_at: '2026-09-14T08:30:00Z',
    updated_at: '2026-10-22T14:15:00Z',
  },
  {
    id: 'user-002',
    username: 'sarah_chen',
    email: 'sarah.chen@techcorp.io',
    full_name: 'Sarah Chen',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    is_active: true,
    role: 'user',
    status: 'active',
    total_focus_minutes: 4120,
    tasks_count: 52,
    last_active: '2 hours ago',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-10-22T12:00:00Z',
  },
  {
    id: 'user-003',
    username: 'marcus_k',
    email: 'marcus@designlabs.co',
    full_name: 'Marcus Krause',
    avatar_url: null,
    is_active: false,
    role: 'user',
    status: 'suspended',
    total_focus_minutes: 320,
    tasks_count: 6,
    last_active: '4 days ago',
    created_at: '2026-10-10T11:20:00Z',
    updated_at: '2026-10-18T09:12:00Z',
  },
  {
    id: 'user-004',
    username: 'elena_v',
    email: 'elena.vasquez@startup.ai',
    full_name: 'Elena Vasquez',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    is_active: true,
    role: 'user',
    status: 'active',
    total_focus_minutes: 1840,
    tasks_count: 28,
    last_active: 'Just now',
    created_at: '2026-09-28T16:45:00Z',
    updated_at: '2026-10-22T14:40:00Z',
  },
  {
    id: 'user-005',
    username: 'david_lee',
    email: 'david.lee@focus.app',
    full_name: 'David Lee',
    avatar_url: null,
    is_active: true,
    role: 'admin',
    status: 'active',
    total_focus_minutes: 5380,
    tasks_count: 64,
    last_active: '1 hour ago',
    created_at: '2026-07-15T09:00:00Z',
    updated_at: '2026-10-22T13:30:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: SystemAuditLog[] = [
  {
    id: 'audit-001',
    timestamp: '2026-10-22T14:35:10Z',
    action: 'ADMIN_AUTHENTICATED',
    actor: 'System Administrator (admin)',
    severity: 'success',
    details: 'Administrator session initiated via environment credentials verification',
    ip_address: '192.168.1.42',
  },
  {
    id: 'audit-002',
    timestamp: '2026-10-22T13:10:04Z',
    action: 'USER_REGISTRATION',
    actor: 'elena_v',
    severity: 'info',
    details: 'New user account created and workspace provisioned',
    ip_address: '172.56.21.90',
  },
  {
    id: 'audit-003',
    timestamp: '2026-10-22T11:45:22Z',
    action: 'PASSWORD_RESET_REQUESTED',
    actor: 'sarah_chen',
    severity: 'warning',
    details: 'Security token generated for profile password update',
    ip_address: '84.112.5.17',
  },
  {
    id: 'audit-004',
    timestamp: '2026-10-21T18:22:00Z',
    action: 'ACCOUNT_SUSPENDED',
    actor: 'admin',
    severity: 'danger',
    details: 'Account marcus_k suspended due to inactive policy review',
    ip_address: '192.168.1.1',
  },
  {
    id: 'audit-005',
    timestamp: '2026-10-21T09:00:15Z',
    action: 'SYSTEM_CONFIG_UPDATED',
    actor: 'System Administrator',
    severity: 'info',
    details: 'Updated default Pomodoro timer sprint length to 25 minutes',
    ip_address: '127.0.0.1',
  },
];

export const INITIAL_PLATFORM_CONFIG: PlatformConfig = {
  allow_registrations: true,
  maintenance_mode: false,
  guest_mode_enabled: true,
  enforce_email_verification: false,
  default_focus_duration: 25,
};

// Local storage management helpers
const USERS_STORAGE_KEY = 'focus_admin_users_data';
const AUDIT_STORAGE_KEY = 'focus_admin_audit_logs';
const CONFIG_STORAGE_KEY = 'focus_admin_platform_config';

export function getStoredAdminUsers(): AdminSystemUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_ADMIN_USERS));
      return INITIAL_ADMIN_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ADMIN_USERS;
  }
}

export function saveStoredAdminUsers(users: AdminSystemUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // quiet fail
  }
}

export function getStoredAuditLogs(): SystemAuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
}

export function addStoredAuditLog(log: Omit<SystemAuditLog, 'id' | 'timestamp'>): void {
  try {
    const logs = getStoredAuditLogs();
    const newLog: SystemAuditLog = {
      ...log,
      id: `audit-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newLog, ...logs].slice(0, 50);
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // quiet fail
  }
}

export function getStoredPlatformConfig(): PlatformConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(INITIAL_PLATFORM_CONFIG));
      return INITIAL_PLATFORM_CONFIG;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PLATFORM_CONFIG;
  }
}

export function saveStoredPlatformConfig(config: PlatformConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // quiet fail
  }
}
