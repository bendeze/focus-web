import React from 'react';
import { FolderKanban, ListTodo, Flame, CheckCircle2, TrendingUp } from 'lucide-react';

interface ProjectMetricsProps {
  activeProjectsCount: number;
  projectTasksCount: number;
  backlogTasksCount: number;
  completedTasksCount: number;
  totalFocusHours: string;
  totalFocusMinutes?: number;
  overallCompletionRate: number;
}

export const ProjectMetrics: React.FC<ProjectMetricsProps> = ({
  activeProjectsCount,
  projectTasksCount,
  backlogTasksCount,
  completedTasksCount,
  totalFocusHours,
  totalFocusMinutes,
  overallCompletionRate,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {/* Card 1: TOTAL PROJECTS */}
      <div className="p-5 rounded-2xl bg-surface-dark dark:bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            PROJECTS
          </span>
          <FolderKanban className="w-4 h-4 text-zinc-500 dark:text-zinc-400 light:text-zinc-500" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight text-white dark:text-white light:text-black">
            {activeProjectsCount}
          </div>
          <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mt-0.5">
            {activeProjectsCount === 0
              ? 'No active goals'
              : `${activeProjectsCount} active workspace${activeProjectsCount === 1 ? '' : 's'}`}
          </div>
        </div>
      </div>

      {/* Card 2: LINKED BACKLOG */}
      <div className="p-5 rounded-2xl bg-surface-dark dark:bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            PROJECT TASKS
          </span>
          <ListTodo className="w-4 h-4 text-zinc-500 dark:text-zinc-400 light:text-zinc-500" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight text-white dark:text-white light:text-black">
            {projectTasksCount}
          </div>
          <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mt-0.5">
            {backlogTasksCount} pending · {completedTasksCount} done
          </div>
        </div>
      </div>

      {/* Card 3: FOCUS TIME */}
      <div className="p-5 rounded-2xl bg-surface-dark dark:bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            TOTAL FOCUS
          </span>
          <Flame className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight text-white dark:text-white light:text-black">
            {totalFocusHours}
            <span className="text-sm font-normal text-zinc-500 ml-1">hrs</span>
          </div>
          <div className="text-[11px] font-medium text-emerald-400 mt-0.5">
            {typeof totalFocusMinutes === 'number'
              ? `${totalFocusMinutes} min total focus`
              : 'Across all project sprints'}
          </div>
        </div>
      </div>

      {/* Card 4: COMPLETION RATE */}
      <div className="p-5 rounded-2xl bg-surface-dark dark:bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            COMPLETION
          </span>
          <CheckCircle2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400 light:text-zinc-500" />
        </div>
        <div>
          <div className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight text-white dark:text-white light:text-black">
            {overallCompletionRate}%
          </div>
          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
            <TrendingUp className="w-3 h-3" />
            <span>{completedTasksCount} tasks completed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
