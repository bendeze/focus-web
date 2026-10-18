import React from 'react';
import { ExternalLink } from 'lucide-react';

interface MilestoneProgressWidgetProps {
  completedCount: number;
  totalCount: number;
  completionRate: number;
  pendingCount: number;
  sessionsCount: number;
  avgEstimationMinutes: number;
  onOpenBacklog: () => void;
}

export const MilestoneProgressWidget: React.FC<MilestoneProgressWidgetProps> = ({
  completedCount,
  totalCount,
  completionRate,
  pendingCount,
  sessionsCount,
  avgEstimationMinutes,
  onOpenBacklog,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-zinc-950/95 dark:bg-zinc-950/95 light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-5 select-none">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold capitalize tracking-widest text-zinc-400 dark:text-zinc-400 light:text-zinc-600 font-mono">
          Milestone Progress
        </span>
        <h3 className="text-base font-semibold text-white dark:text-white light:text-black">
          Project Completion Health
        </h3>
      </div>

      {/* Progress Visual */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 dark:bg-zinc-900/40 light:bg-zinc-50 border border-zinc-800/60 dark:border-zinc-800/60 light:border-zinc-200/60 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
            Overall Tasks
          </span>
          <span className="text-xs font-mono font-bold text-white dark:text-white light:text-black">
            {completedCount} / {totalCount} ({completionRate}%)
          </span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-zinc-800 dark:bg-zinc-900 light:bg-zinc-200 overflow-hidden">
          <div
            className="h-1.5 bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Key Facts */}
      <div className="flex flex-col gap-2.5 text-xs">
        <div className="flex items-center justify-between py-1.5 border-b border-subtle-dark dark:border-subtle-dark light:border-subtle-light">
          <span className="text-zinc-400 dark:text-zinc-400 light:text-zinc-600">Pending in Backlog</span>
          <span className="font-mono font-medium text-zinc-200 dark:text-zinc-200 light:text-zinc-800">
            {pendingCount} tasks
          </span>
        </div>
        <div className="flex items-center justify-between py-1.5 border-b border-subtle-dark dark:border-subtle-dark light:border-subtle-light">
          <div className="flex flex-col">
            <span className="text-zinc-400 dark:text-zinc-400 light:text-zinc-600">Total Focus Sprints</span>
            <span className="text-[10px] text-zinc-500">Timed sessions & sprint milestones</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono font-medium">
            {sessionsCount > 0 ? (
              <span className="text-emerald-400">{sessionsCount} sessions</span>
            ) : completedCount > 0 ? (
              <span className="text-zinc-200 dark:text-zinc-200 light:text-zinc-800">
                {completedCount} milestone{completedCount === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="text-zinc-500">0 sessions</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <span className="text-zinc-400 dark:text-zinc-400 light:text-zinc-600">Avg. Task Estimation</span>
          <span className="font-mono font-medium text-emerald-400">
            {avgEstimationMinutes}m
          </span>
        </div>
      </div>

      <button
        onClick={onOpenBacklog}
        className="w-full py-2.5 px-4 rounded-xl bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200 text-xs font-semibold text-zinc-200 dark:text-zinc-200 light:text-zinc-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        <span>Open Backlog in Tasks</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
