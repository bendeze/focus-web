import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import type { FocusSession, FocusStats, Task } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Flame,
  CheckCircle2,
  Clock,
  BarChart3,
  TrendingUp,
} from 'lucide-react';

interface AnalyticsViewProps {
  stats: FocusStats | null;
  tasks: Task[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  stats,
  tasks,
}) => {
  const { user, theme } = useStore();
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  const loadSessions = React.useCallback(async () => {
    try {
      const data = await api.listFocusSessions();
      setSessions(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, loadSessions]);

  const chartData = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result: { day: string; minutes: number; fullDate: string }[] = [];
    const now = Date.now();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const dayName = days[d.getDay()];
      const dateStr = d.toISOString().split('T')[0];

      const totalSecs = sessions
        .filter((s) => s.status === 'completed' && s.started_at.startsWith(dateStr))
        .reduce((sum, s) => sum + (s.actual_focus_seconds || s.duration_minutes * 60), 0);

      result.push({
        day: dayName,
        minutes: Math.round(totalSecs / 60),
        fullDate: dateStr,
      });
    }
    return result;
  }, [sessions]);

  const totalFocusHours = stats ? (stats.total_focus_minutes / 60).toFixed(1) : '0.0';
  const completedTasksCount = tasks.filter((t) => t.status === 'completed' && !t.is_deleted).length;
  const activeTasksCount = tasks.filter((t) => t.status !== 'completed' && !t.is_deleted).length;
  const totalTasksCount = completedTasksCount + activeTasksCount;
  const completionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const pieData = [
    { name: 'Completed', value: completedTasksCount },
    { name: 'Pending', value: activeTasksCount },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold tracking-badge uppercase text-light-textSecondary dark:text-dark-textSecondary mb-1">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Productivity Insights</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-light-text dark:text-dark-text">
          Performance & Metrics
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-light-textSecondary dark:text-dark-textSecondary mb-3">
            <span className="text-[10px] font-bold uppercase tracking-badge">Total Focus</span>
            <Flame className="w-4 h-4 text-light-text dark:text-dark-text" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black tabular-nums text-light-text dark:text-dark-text">
              {totalFocusHours} <span className="text-xs font-semibold text-light-textSecondary dark:text-dark-textSecondary">hrs</span>
            </div>
            <p className="text-[11px] text-light-textSecondary dark:text-dark-textSecondary mt-1">
              {stats?.total_focus_minutes || 0} minutes logged
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-light-textSecondary dark:text-dark-textSecondary mb-3">
            <span className="text-[10px] font-bold uppercase tracking-badge">Completed Sprints</span>
            <Clock className="w-4 h-4 text-light-text dark:text-dark-text" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black tabular-nums text-light-text dark:text-dark-text">
              {stats?.completed_sessions_count || 0}
            </div>
            <p className="text-[11px] text-light-textSecondary dark:text-dark-textSecondary mt-1">
              {stats?.total_sessions_count || 0} total sessions
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-light-textSecondary dark:text-dark-textSecondary mb-3">
            <span className="text-[10px] font-bold uppercase tracking-badge">Tasks Done</span>
            <CheckCircle2 className="w-4 h-4 text-light-text dark:text-dark-text" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black tabular-nums text-light-text dark:text-dark-text">
              {completedTasksCount}
            </div>
            <p className="text-[11px] text-light-textSecondary dark:text-dark-textSecondary mt-1">
              {activeTasksCount} in backlog
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-light-textSecondary dark:text-dark-textSecondary mb-3">
            <span className="text-[10px] font-bold uppercase tracking-badge">Velocity</span>
            <TrendingUp className="w-4 h-4 text-light-text dark:text-dark-text" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black tabular-nums text-light-text dark:text-dark-text">
              {completionRate}%
            </div>
            <p className="text-[11px] text-light-textSecondary dark:text-dark-textSecondary mt-1">
              Task completion rate
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 p-6 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-badge text-light-text dark:text-dark-text">
                Focus Time (Last 7 Days)
              </h3>
              <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-0.5">
                Daily sprint duration in minutes
              </p>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-light-fill dark:bg-dark-fill text-light-textSecondary dark:text-dark-textSecondary border border-light-border dark:border-dark-border">
              Weekly
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  stroke={theme === 'dark' ? '#A0A0A0' : '#757575'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke={theme === 'dark' ? '#A0A0A0' : '#757575'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  unit="m"
                />
                <Tooltip
                  cursor={{ fill: theme === 'dark' ? '#222226' : '#EAEAEA' }}
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#141416' : '#FFFFFF',
                    borderColor: theme === 'dark' ? '#2A2A2E' : '#E0E0E0',
                    borderRadius: '16px',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  }}
                  formatter={(value: any) => [`${value} minutes`, 'Focus Time']}
                />
                <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={theme === 'dark' ? '#FFFFFF' : '#000000'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-badge text-light-text dark:text-dark-text mb-1">
              Backlog Ratio
            </h3>
            <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary">
              Completed vs active tasks
            </p>

            <div className="h-44 w-full flex items-center justify-center my-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill={theme === 'dark' ? '#FFFFFF' : '#000000'} />
                    <Cell fill={theme === 'dark' ? '#2A2A2E' : '#D0D0D5'} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-light-border dark:border-dark-border text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-light-text dark:bg-dark-text" />
                <span>Completed Tasks</span>
              </span>
              <span className="font-bold tabular-nums">{completedTasksCount}</span>
            </div>

            <div className="flex items-center justify-between text-light-textSecondary dark:text-dark-textSecondary">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-light-fill dark:bg-dark-fill border border-light-border dark:border-dark-border" />
                <span>Pending in Backlog</span>
              </span>
              <span className="font-bold tabular-nums">{activeTasksCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-badge text-light-text dark:text-dark-text mb-4">
          Recent Focus History
        </h3>

        {sessions.length === 0 ? (
          <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary py-4 text-center">
            No completed sessions recorded yet. Start a timer in Focus Mode!
          </p>
        ) : (
          <div className="divide-y divide-light-border dark:divide-dark-border">
            {sessions.slice(0, 5).map((s) => {
              const sessionTask = tasks.find((t) => t.id === s.task_id);
              const durationMins = Math.round((s.actual_focus_seconds || s.duration_minutes * 60) / 60);

              return (
                <div key={s.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-light-fill dark:bg-dark-fill flex items-center justify-center flex-shrink-0">
                      <Clock className="w-3.5 h-3.5 text-light-text dark:text-dark-text" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-light-text dark:text-dark-text truncate">
                        {sessionTask?.title || 'Sprint Session'}
                      </p>
                      <p className="text-[10px] text-light-textSecondary dark:text-dark-textSecondary mt-0.5">
                        {new Date(s.started_at).toLocaleDateString()} at{' '}
                        {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {s.notes && ` — "${s.notes}"`}
                      </p>
                    </div>
                  </div>

                  <span className="font-bold tabular-nums text-light-text dark:text-dark-text flex-shrink-0">
                    +{durationMins}m
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
