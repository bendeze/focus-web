import React from 'react';
import { ListTodo, CheckCircle2, Flame, Play } from 'lucide-react';

interface TaskMetricsProps {
  totalTasksCount: number;
  todoCount: number;
  inProgressCount: number;
  completedCount: number;
  totalFocusHours: string;
  completionRate: number;
}

export const TaskMetrics: React.FC<TaskMetricsProps> = ({
  totalTasksCount,
  todoCount,
  inProgressCount,
  completedCount,
  totalFocusHours,
  completionRate,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {/* Card 1: TOTAL BACKLOG */}
      <div className="p-5 rounded-2xl bg-surface-dark dark:bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            TOTAL BACKLOG
          </span>
          <ListTodo className="w-4 h-4 text-zinc-500 dark:text-zinc-400 light:text-zinc-500" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight text-white dark:text-white light:text-black">
            {totalTasksCount}
          </div>
          <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mt-0.5">
            {todoCount} pending to do
          </div>
        </div>
      </div>

      {/* Card 2: IN PROGRESS / ACTIVE */}
      <div className="p-5 rounded-2xl bg-surface-dark dark:bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            IN FOCUS
          </span>
          <Play className="w-4 h-4 text-zinc-400" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight text-white dark:text-white light:text-black">
            {inProgressCount}
          </div>
          <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mt-0.5">
            {inProgressCount === 1 ? '1 active sprint' : `${inProgressCount} active sprints`}
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
            {completionRate}% success rate
          </div>
        </div>
      </div>

      {/* Card 4: FOCUS LOGGED */}
      <div className="p-5 rounded-2xl bg-surface-dark dark:bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            FOCUS LOGGED
          </span>
          <Flame className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight text-white dark:text-white light:text-black">
            {totalFocusHours}h
          </div>
          <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mt-0.5">
            Total deep work logged
          </div>
        </div>
      </div>
    </div>
  );
};
