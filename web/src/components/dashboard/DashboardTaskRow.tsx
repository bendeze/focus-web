import React from 'react';
import { format } from 'date-fns';
import type { Task, Project } from '../../types';
import { getStatusBadge } from './dashboardUtils';
import { Pencil } from 'lucide-react';

interface DashboardTaskRowProps {
  task: Task;
  project?: Project;
  isSelected: boolean;
  isRunning: boolean;
  hasSavedProgress?: boolean;
  onSelectTask: (task: Task) => void;
  onToggleStatus?: (task: Task) => void;
  onEditTask?: (task: Task) => void;
}

export const DashboardTaskRow: React.FC<DashboardTaskRowProps> = ({
  task,
  project,
  isSelected,
  isRunning,
  hasSavedProgress,
  onSelectTask,
  onEditTask,
}) => {
  const isCompleted = task.status === 'completed';

  // Compute real-time effective status
  const effectiveStatus = (() => {
    if (isCompleted || task.status === 'cancelled') {
      return task.status;
    }
    if (isSelected) {
      return isRunning ? 'in_progress' : 'paused';
    }
    if (hasSavedProgress) {
      return 'paused';
    }
    return 'todo';
  })();

  const statusBadge = getStatusBadge(effectiveStatus);

  const getTitleColor = () => {
    if (isCompleted) {
      return 'line-through text-zinc-500 dark:text-zinc-500';
    }
    if (isSelected && isRunning) {
      return 'text-emerald-400 dark:text-emerald-400 font-bold';
    }
    if (isSelected) {
      return 'text-white dark:text-white light:text-black font-bold';
    }
    return 'text-zinc-200 dark:text-zinc-200 light:text-zinc-800';
  };

  return (
    <div
      onClick={() => onSelectTask(task)}
      className={`p-3.5 border-l-2 transition-all flex items-center justify-between gap-4 group cursor-pointer ${
        isSelected
          ? 'border-white dark:border-white light:border-black'
          : 'border-transparent hover:border-white dark:hover:border-white light:hover:border-black'
      }`}
    >
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold truncate ${getTitleColor()}`}>
              {task.title}
            </span>
          </div>
          {task.description && (
            <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-500 line-clamp-1 mt-0.5">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 light:text-zinc-500 mt-0.5 flex-wrap">
            <span>{project ? project.title : 'General focus'} · {task.estimated_minutes} min</span>
            {task.created_at && (
              <>
                <span className="opacity-40">·</span>
                <span className="font-mono text-[10px]">
                  {format(new Date(task.created_at), 'MMM d, HH:mm')}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Status Tag & Edit Action */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {onEditTask && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditTask(task);
            }}
            className="p-1 rounded-full text-zinc-500 hover:text-white dark:hover:text-white light:hover:text-black hover:bg-zinc-800/80 dark:hover:bg-zinc-800/80 light:hover:bg-zinc-200 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            title="Edit task"
            aria-label="Edit task"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 transition-colors ${statusBadge.className}`}>
          {statusBadge.label}
        </span>
      </div>
    </div>
  );
};
