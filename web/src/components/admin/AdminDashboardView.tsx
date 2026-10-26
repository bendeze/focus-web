import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { api, getBaseUrl } from '../../services/api';
import type { Task, Project, AdminProject, AdminSystemUser, SystemAuditLog, PlatformConfig, AdminStats } from '../../types';
import {
  Shield,
  LayoutDashboard,
  Users,
  FolderKanban,
  ListTodo,
  BarChart2,
  ShieldAlert,
  Sliders,
  LogOut,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { AdminOverviewTab } from './AdminOverviewTab';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminProjectsTab } from './AdminProjectsTab';
import { AdminTasksTab } from './AdminTasksTab';
import { AdminAnalyticsTab } from './AdminAnalyticsTab';
import { AdminAuditLogsTab } from './AdminAuditLogsTab';
import { AdminSettingsTab } from './AdminSettingsTab';

interface AdminDashboardViewProps {
  tasks: Task[];
  projects: Project[];
  onRefresh?: () => Promise<void>;
}

const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  allow_registrations: true,
  maintenance_mode: false,
  guest_mode_enabled: true,
  enforce_email_verification: false,
  default_focus_duration: 25,
};

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  tasks,
  projects,
  onRefresh,
}) => {
  const { setActiveTab, logout, addToast } = useStore();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<
    'overview' | 'users' | 'projects' | 'tasks' | 'analytics' | 'audit' | 'settings'
  >('overview');

  const [users, setUsers] = useState<AdminSystemUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([]);
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_PLATFORM_CONFIG);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [adminTasks, setAdminTasks] = useState<Task[]>([]);
  const [adminProjects, setAdminProjects] = useState<AdminProject[]>([]);
  const [isAdminProjectsLoaded, setIsAdminProjectsLoaded] = useState(false);
  const [isAdminTasksLoaded, setIsAdminTasksLoaded] = useState(false);

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [apiStatus, setApiStatus] = useState<'healthy' | 'checking' | 'degraded'>('healthy');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load real data from backend API
  const loadAdminData = useCallback(async () => {
    try {
      const [statsRes, usersRes, logsRes, configRes, tasksRes, projectsRes] = await Promise.allSettled([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminAuditLogs(100),
        api.getAdminConfig(),
        api.getAdminTasks({ limit: 100 }),
        api.getAdminProjects({ limit: 100 }),
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value);
      }
      if (logsRes.status === 'fulfilled') {
        setAuditLogs(logsRes.value);
      }
      if (configRes.status === 'fulfilled') {
        setConfig(configRes.value);
      }
      if (projectsRes.status === 'fulfilled') {
        console.log('[AdminDashboard] adminProjects loaded successfully:', projectsRes.value);
        setAdminProjects(projectsRes.value);
        setIsAdminProjectsLoaded(true);
      } else {
        console.error('[AdminDashboard] adminProjects REJECTED:', projectsRes.reason);
      }
      if (tasksRes.status === 'fulfilled') {
        const rawTasks = tasksRes.value;
        const mappedTasks: Task[] = rawTasks.map((t: any) => ({
          id: t.id,
          user_id: t.user_id || '',
          project_id: t.project_id || null,
          title: t.title,
          description: t.description || null,
          status: t.status || 'todo',
          priority: t.priority || 'medium',
          estimated_minutes: t.estimated_minutes || 25,
          order_index: 0,
          completed_at: null,
          is_deleted: false,
          deleted_at: null,
          created_at: t.created_at,
          updated_at: t.updated_at,
          total_focus_minutes: 0,
          focus_session_count: 0,
        }));
        setAdminTasks(mappedTasks);
        setIsAdminTasksLoaded(true);
      }
    } catch {
      // Quiet fail
    }
  }, []);

  // Ping backend API to measure response latency
  const pingBackend = useCallback(async () => {
    setApiStatus('checking');
    const start = performance.now();
    try {
      const res = await fetch(`${getBaseUrl()}/api/v1/admin/stats`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('focus_token') || ''}`,
        },
      });
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      setApiStatus(res.ok ? 'healthy' : 'degraded');
    } catch {
      setLatencyMs(Math.round(performance.now() - start));
      setApiStatus('degraded');
    } finally {
      if (onRefresh) {
        onRefresh().catch(() => {});
      }
    }
  }, [onRefresh]);

  // Combined manual refresh handler
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([loadAdminData(), pingBackend()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadAdminData, pingBackend]);

  // Initial load + periodic background auto-refresh every 10 seconds
  useEffect(() => {
    loadAdminData();
    pingBackend();

    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        loadAdminData();
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [loadAdminData, pingBackend]);

  // Instant refresh whenever switching between sub-tabs
  useEffect(() => {
    loadAdminData();
  }, [activeAdminSubTab, loadAdminData]);

  // Update user handler (backend API)
  const handleUpdateUser = async (userId: string, patch: Partial<AdminSystemUser>) => {
    try {
      await api.updateAdminUser(userId, {
        role: patch.role,
        is_active: patch.is_active ?? (patch.status ? patch.status === 'active' : undefined),
        full_name: patch.full_name || undefined,
      });

      addToast('User account successfully updated', 'info');
      await loadAdminData();
    } catch (err: any) {
      addToast(err.message || 'Failed to update user', 'error');
    }
  };

  // Add user handler (backend API)
  const handleAddUser = async (newUserData: Omit<AdminSystemUser, 'id' | 'created_at' | 'updated_at'> & { password?: string }) => {
    try {
      if (!newUserData.password) {
        addToast('Password is required to create a new member', 'error');
        return;
      }
      if (!newUserData.username || !newUserData.email) {
        addToast('Username and email are required to create a member', 'error');
        return;
      }

      await api.createAdminUser({
        username: newUserData.username,
        email: newUserData.email,
        password: newUserData.password,
        full_name: newUserData.full_name || undefined,
        role: newUserData.role,
      });

      addToast(`New member @${newUserData.username} created successfully!`, 'success');
      await loadAdminData();
    } catch (err: any) {
      addToast(err.message || 'Failed to create member', 'error');
    }
  };

  // Delete user handler (backend API)
  const handleDeleteUser = async (userId: string, hardDelete: boolean = false) => {
    try {
      const targetUser = users.find((u) => u.id === userId);
      await api.deleteAdminUser(userId, hardDelete);
      addToast(
        hardDelete
          ? `Account @${targetUser?.username || 'user'} permanently expunged from database`
          : `Account @${targetUser?.username || 'user'} deactivated`,
        hardDelete ? 'info' : 'info'
      );
      await loadAdminData();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete user', 'error');
    }
  };

  // Password reset handler (backend API)
  const handleResetPassword = async (userId: string, tempPassword: string) => {
    try {
      await api.resetAdminUserPassword(userId, tempPassword);
      addToast('User password reset in database', 'success');
      await loadAdminData();
    } catch (err: any) {
      addToast(err.message || 'Failed to reset password', 'error');
    }
  };

  // Update platform config (backend API)
  const handleUpdateConfig = async (patch: Partial<PlatformConfig>) => {
    try {
      const updated = await api.updateAdminConfig(patch);
      setConfig(updated);
      addToast('Platform configuration saved', 'success');
      await loadAdminData();
    } catch (err: any) {
      addToast(err.message || 'Failed to save configuration', 'error');
    }
  };

  // Export full snapshot JSON (backend API)
  const handleExportAllData = async () => {
    try {
      const snapshot = await api.exportAdminData();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `focus_system_snapshot_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      addToast('Full system JSON snapshot exported successfully', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to export system snapshot', 'error');
    }
  };

  // Reset admin config to defaults
  const handleResetConfig = async () => {
    try {
      const updated = await api.updateAdminConfig(DEFAULT_PLATFORM_CONFIG);
      setConfig(updated);
      addToast('System configuration reset to default rules', 'info');
      await loadAdminData();
    } catch (err: any) {
      addToast(err.message || 'Failed to reset configuration', 'error');
    }
  };

  // Update project handler (backend API)
  const handleUpdateProject = async (projectId: string, patch: Partial<AdminProject>) => {
    try {
      await api.updateAdminProject(projectId, patch);
      addToast('Project updated successfully', 'success');
      await loadAdminData();
    } catch (err: any) {
      addToast(err.message || 'Failed to update project', 'error');
    }
  };

  // Create project handler (backend API)
  const handleCreateProject = async (projectData: {
    title: string;
    description?: string;
    user_id?: string;
    status?: string;
    color?: string;
  }) => {
    try {
      await api.createAdminProject(projectData);
      addToast(`Project '${projectData.title}' created successfully`, 'success');
      await loadAdminData();
    } catch (err: any) {
      addToast(err.message || 'Failed to create project', 'error');
    }
  };

  // Delete project handler (backend API)
  const handleDeleteProject = async (projectId: string, hardDelete: boolean = false) => {
    try {
      await api.deleteAdminProject(projectId, hardDelete);
      addToast(
        hardDelete ? 'Project permanently purged from database' : 'Project archived/deleted',
        'info'
      );
      await loadAdminData();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete project', 'error');
    }
  };

  // Display projects list (prefer global backend projects, fallback to user's projects during initial load)
  const displayProjects: AdminProject[] = isAdminProjectsLoaded
    ? adminProjects
    : (adminProjects.length > 0 ? adminProjects : (projects as AdminProject[]));
  // Display tasks list (prefer global backend tasks, fallback to user's tasks during initial load)
  const displayTasks = isAdminTasksLoaded
    ? adminTasks
    : (adminTasks.length > 0 ? adminTasks : tasks);

  return (
    <div className="w-full min-h-screen bg-black text-white font-sans flex flex-col pb-16 selection:bg-white selection:text-black">
      {/* 1. Global Maintenance Alert (if active) */}
      {config.maintenance_mode && (
        <div className="w-full bg-amber-500/10 border-b border-amber-500/20 py-2.5 px-6 flex items-center justify-center gap-2 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Maintenance Mode is currently ACTIVE:</strong> Standard users see maintenance banners across the platform.
          </span>
          <button
            onClick={() => handleUpdateConfig({ maintenance_mode: false })}
            className="underline ml-2 text-amber-200 hover:text-white cursor-pointer font-medium"
          >
            Disable
          </button>
        </div>
      )}

      {/* 2. Top System Administrator Header Bar */}
      <header className="sticky top-0 z-40 w-full bg-zinc-950/80 backdrop-blur-xl border-b border-subtle-dark py-3 px-6 md:px-12 flex items-center justify-between gap-4">
        {/* Left: Shield Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-xs">
            <Shield className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono uppercase tracking-wider font-semibold text-white">
            Admin Console
          </span>
        </div>

        {/* Center: Minimal Latency Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
          <span className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span>{latencyMs !== null ? `${latencyMs}ms` : 'connected'}</span>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="hover:text-white cursor-pointer ml-0.5 disabled:opacity-50"
            title="Refresh all admin data"
          >
            <RefreshCw className={`w-2.5 h-2.5 text-zinc-500 hover:text-white ${isRefreshing ? 'animate-spin text-white' : ''}`} />
          </button>
        </div>

        {/* Right: Switch to User App & Sign Out */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="h-8 px-3.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-white flex items-center gap-1.5 transition-all cursor-pointer"
            title="Switch back to workspace"
          >
            <span>Workspace</span>
            <ArrowRight className="w-3 h-3 text-zinc-400" />
          </button>

          <button
            onClick={logout}
            className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 3. Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-8 flex flex-col gap-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-subtle-dark overflow-x-auto select-none">
          <button
            type="button"
            onClick={() => setActiveAdminSubTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeAdminSubTab === 'overview'
                ? 'bg-white text-black font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminSubTab('users')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeAdminSubTab === 'users'
                ? 'bg-white text-black font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminSubTab('projects')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeAdminSubTab === 'projects'
                ? 'bg-white text-black font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Projects ({displayProjects.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminSubTab('tasks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeAdminSubTab === 'tasks'
                ? 'bg-white text-black font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Tasks ({displayTasks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminSubTab('analytics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeAdminSubTab === 'analytics'
                ? 'bg-white text-black font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminSubTab('audit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeAdminSubTab === 'audit'
                ? 'bg-white text-black font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Audit ({auditLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminSubTab('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              activeAdminSubTab === 'settings'
                ? 'bg-white text-black font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>

        {/* Tab Views */}
        {activeAdminSubTab === 'overview' && (
          <AdminOverviewTab
            users={users}
            tasks={displayTasks}
            projects={displayProjects}
            auditLogs={auditLogs}
            apiStatus={apiStatus}
            latencyMs={latencyMs}
            stats={stats}
            onOpenAddUser={() => {
              setActiveAdminSubTab('users');
              setIsAddUserOpen(true);
            }}
            onRefreshApi={handleManualRefresh}
            onSwitchTab={setActiveAdminSubTab}
            onExportJson={handleExportAllData}
          />
        )}

        {activeAdminSubTab === 'users' && (
          <AdminUsersTab
            users={users}
            onUpdateUser={handleUpdateUser}
            onAddUser={handleAddUser}
            onDeleteUser={handleDeleteUser}
            onResetPassword={handleResetPassword}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
            isAddUserOpen={isAddUserOpen}
            setIsAddUserOpen={setIsAddUserOpen}
          />
        )}

        {activeAdminSubTab === 'projects' && (
          <AdminProjectsTab
            projects={displayProjects}
            tasks={displayTasks}
            users={users}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
            onUpdateProject={handleUpdateProject}
            onCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {activeAdminSubTab === 'tasks' && (
          <AdminTasksTab tasks={displayTasks} projects={displayProjects} />
        )}

        {activeAdminSubTab === 'analytics' && (
          <AdminAnalyticsTab stats={stats} />
        )}

        {activeAdminSubTab === 'audit' && (
          <AdminAuditLogsTab
            auditLogs={auditLogs}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
            onClearLogs={async () => {
              try {
                await api.clearAdminAuditLogs();
                setAuditLogs([]);
                addToast('Audit trail cleared in database', 'info');
                await loadAdminData();
              } catch (err: any) {
                addToast(err.message || 'Failed to clear logs', 'error');
              }
            }}
          />
        )}

        {activeAdminSubTab === 'settings' && (
          <AdminSettingsTab
            config={config}
            onUpdateConfig={handleUpdateConfig}
            onExportAllData={handleExportAllData}
            onResetData={handleResetConfig}
            onPingApi={pingBackend}
            latencyMs={latencyMs}
            apiStatus={apiStatus}
          />
        )}
      </main>
    </div>
  );
};
