import React from 'react';
import { Flame, ListTodo, CheckCircle2, TrendingUp } from 'lucide-react';

interface AnalyticsKpiCardsProps {
  totalFocusHours: string;
  totalFocusMinutes: number;
  pendingCount: number;
  completedCount: number;
  totalCount: number;
  completionRate: number;
}

export const AnalyticsKpiCards: React.FC<AnalyticsKpiCardsProps> = ({
  totalFocusHours,
  totalFocusMinutes,
  pendingCount,
  completedCount,
  totalCount,
  completionRate,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {/* Card 1: FOCUS TIME */}
      <div className="p-5 rounded-2xl bg-surface-dark dark:bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            FOCUS TIME
          </span>
          <Flame className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight text-white dark:text-white light:text-black">
            {totalFocusHours}
            <span className="text-sm font-normal text-zinc-500 ml-1">hrs</span>
          </div>
          <div className="text-[11px] font-medium text-emerald-400 mt-0.5">
            {totalFocusMinutes} min total focus
          </div>
        </div>
      </div>

      {/* Card 2: BACKLOG */}
      <div className="p-5 rounded-2xl bg-surface-dark dark:bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            BACKLOG
          </span>
          <ListTodo className="w-4 h-4 text-zinc-500 dark:text-zinc-400 light:text-zinc-500" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight text-white dark:text-white light:text-black">
            {pendingCount}
          </div>
          <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mt-0.5">
            {pendingCount === 0 ? 'All tasks complete' : `${pendingCount} in queue`}
          </div>
        </div>
      </div>

      {/* Card 3: COMPLETED */}
      <div className="p-5 rounded-2xl bg-surface-dark dark:bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            COMPLETED
          </span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight text-white dark:text-white light:text-black">
            {completedCount}
          </div>
          <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mt-0.5">
            out of {totalCount} total tasks
          </div>
        </div>
      </div>

      {/* Card 4: COMPLETION RATE */}
      <div className="p-5 rounded-2xl bg-surface-dark dark:bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            COMPLETION RATE
          </span>
          <TrendingUp className="w-4 h-4 text-zinc-500 dark:text-zinc-400 light:text-zinc-500" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight text-white dark:text-white light:text-black">
            {completionRate}%
          </div>
          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
            <span>{completedCount} tasks finished</span>
          </div>
        </div>
      </div>
    </div>
  );
};
