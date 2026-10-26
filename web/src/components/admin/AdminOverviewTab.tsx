import React from 'react';
import {
  Download,
  UserPlus,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  FolderKanban,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AdminSystemUser, SystemAuditLog, Task, Project, AdminStats } from '../../types';

interface AdminOverviewTabProps {
  users: AdminSystemUser[];
  tasks: Task[];
  projects: Project[];
  auditLogs: SystemAuditLog[];
  apiStatus: 'healthy' | 'checking' | 'degraded';
  latencyMs: number | null;
  onOpenAddUser: () => void;
  onRefreshApi: () => void;
  onSwitchTab: (tab: 'users' | 'projects' | 'tasks' | 'analytics' | 'audit' | 'settings') => void;
  onExportJson: () => void;
  stats?: AdminStats | null;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  users,
  tasks,
  projects,
  auditLogs,
  apiStatus,
  latencyMs,
  onOpenAddUser,
  onRefreshApi,
  onSwitchTab,
  onExportJson,
  stats,
}) => {
  // Real backend metrics with fallback to local calculation
  const totalUsers = stats?.total_users ?? users.length;
  const activeUsers = stats?.active_users ?? users.filter((u) => u.status === 'active' || u.is_active).length;
  const adminUsers = stats?.admin_users ?? users.filter((u) => u.role === 'admin' || u.is_admin).length;

  const totalFocusMinutes = stats ? stats.total_focus_minutes : users.reduce((acc, u) => acc + (u.total_focus_minutes || 0), 0);
  const totalFocusHours = stats ? stats.total_focus_hours : (totalFocusMinutes / 60).toFixed(1);
  const totalTasksCount = stats?.total_tasks ?? tasks.length;
  const completedTasks = stats?.completed_tasks ?? tasks.filter((t) => t.status === 'completed').length;
  const completionRate = stats?.completion_rate ?? (totalTasksCount > 0 ? Math.round((completedTasks / totalTasksCount) * 100) : 0);
  const totalProjectsCount = stats?.total_projects ?? projects.length;

  // Real 7-day system-wide focus volume from backend API
  const systemActivityData = stats?.daily_focus_activity && stats.daily_focus_activity.length > 0
    ? stats.daily_focus_activity
    : [
        { day: 'Mon', focusHours: 0, sessions: 0 },
        { day: 'Tue', focusHours: 0, sessions: 0 },
        { day: 'Wed', focusHours: 0, sessions: 0 },
        { day: 'Thu', focusHours: 0, sessions: 0 },
        { day: 'Fri', focusHours: 0, sessions: 0 },
        { day: 'Sat', focusHours: 0, sessions: 0 },
        { day: 'Sun', focusHours: 0, sessions: 0 },
      ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. Minimal KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Users */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-zinc-500">Members</span>
          <div className="mt-2">
            <div className="text-2xl font-light tracking-tight text-white tabular-nums">
              {totalUsers}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-1">
              {activeUsers} active · {adminUsers} admin
            </div>
          </div>
        </div>

        {/* Card 2: Focus Hours */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-zinc-500">Focus Time</span>
          <div className="mt-2">
            <div className="text-2xl font-light tracking-tight text-white tabular-nums">
              {totalFocusHours} <span className="text-xs text-zinc-500 font-normal">hrs</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-1">
              ~{Math.round(totalFocusMinutes / (totalUsers || 1))}m avg / user
            </div>
          </div>
        </div>

        {/* Card 3: Tasks Completion */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-zinc-500">Tasks</span>
          <div className="mt-2">
            <div className="text-2xl font-light tracking-tight text-white tabular-nums">
              {totalTasksCount}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-1">
              {completionRate}% done ({completedTasks})
            </div>
          </div>
        </div>

        {/* Card 4: Projects */}
        <div
          onClick={() => onSwitchTab('projects')}
          className="p-4 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between cursor-pointer hover:border-zinc-700 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-zinc-500">Workspaces</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-light tracking-tight text-white tabular-nums">
              {totalProjectsCount}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-1">
              active projects
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: Activity Chart + System Infrastructure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Platform Weekly Focus Volume Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Focus Activity
            </h3>
            <button
              onClick={() => onSwitchTab('analytics')}
              className="text-xs font-mono text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              Analytics →
            </button>
          </div>

          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={systemActivityData} barSize={22}>
                <XAxis
                  dataKey="day"
                  stroke="#52525B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#52525B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  unit="h"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderColor: '#27272A',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#FFFFFF',
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Bar
                  dataKey="focusHours"
                  fill="#FFFFFF"
                  radius={[4, 4, 0, 0]}
                  name="Focus Hours"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Service Health */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Services
              </h3>
              <button
                onClick={onRefreshApi}
                className="p-1 rounded text-zinc-500 hover:text-white transition-colors cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-zinc-900 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${apiStatus === 'healthy' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="text-zinc-300">API Server</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  {latencyMs ? `${latencyMs}ms` : 'online'}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-zinc-300">Database</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">ready</span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-zinc-300">Authentication</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">HS256</span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-zinc-300">Sync Engine</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">synced</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-900 text-[11px] text-zinc-500 flex items-center justify-between font-mono">
            <span>Uptime: 99.9%</span>
            <span>v1.0.4</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Quick Actions & Recent Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick Actions Panel */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
              Actions
            </h3>

            <div className="space-y-1.5">
              <button
                onClick={onOpenAddUser}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/60 text-xs text-zinc-200 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Add Member</span>
                </div>
                <ArrowUpRight className="w-3 h-3 text-zinc-600" />
              </button>

              <button
                onClick={() => onSwitchTab('projects')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/60 text-xs text-zinc-200 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Workspaces</span>
                </div>
                <ArrowUpRight className="w-3 h-3 text-zinc-600" />
              </button>

              <button
                onClick={onExportJson}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/60 text-xs text-zinc-200 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Export JSON</span>
                </div>
                <ArrowUpRight className="w-3 h-3 text-zinc-600" />
              </button>

              <button
                onClick={() => onSwitchTab('settings')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/60 text-xs text-zinc-200 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Settings</span>
                </div>
                <ArrowUpRight className="w-3 h-3 text-zinc-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Audit Trail Preview (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-zinc-950 border border-subtle-dark">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Audit Trail
            </h3>
            <button
              onClick={() => onSwitchTab('audit')}
              className="text-xs font-mono text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              All Logs ({auditLogs.length}) →
            </button>
          </div>

          <div className="divide-y divide-zinc-900 text-xs">
            {auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="py-2.5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      log.severity === 'success'
                        ? 'bg-emerald-400'
                        : log.severity === 'warning'
                        ? 'bg-amber-400'
                        : log.severity === 'danger'
                        ? 'bg-red-400'
                        : 'bg-zinc-400'
                    }`}
                  />
                  <span className="font-mono text-zinc-300 font-medium shrink-0">
                    {log.action}
                  </span>
                  <span className="text-zinc-500 font-light truncate">
                    {log.details}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono text-zinc-500">
                  <span>{log.actor}</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

