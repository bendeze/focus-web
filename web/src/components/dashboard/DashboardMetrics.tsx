import React from 'react';
import {
  Clock,
  ListTodo,
  FolderKanban,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { MetricTrend } from './dashboardUtils';

interface DashboardMetricsProps {
  focusHours: string;
  focusTrend?: MetricTrend;
  backlogCount: number;
  backlogSubtitle?: string;
  projectsCount: number;
  projectsSubtitle?: string;
  completionRate: number;
  completionTrend?: MetricTrend;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  focusHours,
  focusTrend = { text: '0%', trend: 'neutral' },
  backlogCount,
  backlogSubtitle = 'all caught up',
  projectsCount,
  projectsSubtitle = 'all on track',
  completionRate,
  completionTrend = { text: '0%', trend: 'neutral' },
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: FOCUS TIME */}
      <div className="p-5 rounded-2xl bg-surface-dark dark:bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            FOCUS TIME
          </span>
          <Clock className="w-3 h-3 text-zinc-500 dark:text-zinc-400 light:text-zinc-500" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-light tabular-nums tracking-tight">
            {focusHours} hrs
          </div>
          {focusTrend.trend === 'up' ? (
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3 shrink-0" />
              <span>{focusTrend.text}</span>
            </div>
          ) : focusTrend.trend === 'down' ? (
            <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-500 flex items-center gap-1 mt-0.5">
              <TrendingDown className="w-3 h-3 shrink-0" />
              <span>{focusTrend.text}</span>
            </div>
          ) : (
            <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-0.5">
              <span>{focusTrend.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card 2: BACKLOG */}
      <div className="p-5 rounded-2xl bg-surface-dark dark:bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            BACKLOG
          </span>
          <ListTodo className="w-3 h-3 text-zinc-500 dark:text-zinc-400 light:text-zinc-500" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-light tabular-nums tracking-tight">
            {backlogCount.toString().padStart(2, '0')}
          </div>
          <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-0.5">
            {backlogSubtitle}
          </div>
        </div>
      </div>

      {/* Card 3: PROJECTS */}
      <div className="p-5 rounded-2xl bg-surface-dark dark:bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            PROJECTS
          </span>
          <FolderKanban className="w-3 h-3 text-zinc-500 dark:text-zinc-400 light:text-zinc-500" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-light tabular-nums tracking-tight">
            {projectsCount.toString().padStart(2, '0')}
          </div>
          <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-0.5">
            {projectsSubtitle}
          </div>
        </div>
      </div>

      {/* Card 4: COMPLETION */}
      <div className="p-5 rounded-2xl bg-surface-dark dark:bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            COMPLETION
          </span>
          <CheckCircle2 className="w-3 h-3 text-zinc-500 dark:text-zinc-400 light:text-zinc-500" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-light tabular-nums tracking-tight">
            {completionRate}%
          </div>
          {completionTrend.trend === 'up' ? (
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3 shrink-0" />
              <span>{completionTrend.text}</span>
            </div>
          ) : completionTrend.trend === 'down' ? (
            <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-500 flex items-center gap-1 mt-0.5">
              <TrendingDown className="w-3 h-3 shrink-0" />
              <span>{completionTrend.text}</span>
            </div>
          ) : (
            <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-0.5">
              <span>{completionTrend.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
