import React from 'react';
import type { Project, Task } from '../../types';
import { Trash2, Flame, ArrowRight, Pencil } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  onClick: () => void;
  onEdit: (project: Project, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onViewBacklog: (id: string, e: React.MouseEvent) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  tasks,
  onClick,
  onEdit,
  onDelete,
  onViewBacklog,
}) => {
  const pTasks = tasks.filter((t) => t.project_id === project.id && !t.is_deleted);
  const pCompleted = pTasks.filter((t) => t.status === 'completed');
  const pPending = pTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  const pTotal = pTasks.length;
  const percent = pTotal > 0 ? Math.round((pCompleted.length / pTotal) * 100) : 0;
  const pFocusMinutes = pTasks.reduce((acc, t) => {
    if (t.total_focus_minutes > 0) return acc + t.total_focus_minutes;
    if (t.status === 'completed') return acc + (t.estimated_minutes || 25);
    return acc;
  }, 0);

  return (
    <div
      onClick={onClick}
      className="group p-6 rounded-3xl bg-zinc-950/95 dark:bg-zinc-950/95 light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light hover:border-zinc-700 dark:hover:border-zinc-700 light:hover:border-zinc-300 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between gap-5 relative overflow-hidden select-none"
    >
      {/* Top: Status & Action Buttons */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-zinc-100 text-zinc-400 dark:text-zinc-400 light:text-zinc-600 border border-subtle-dark dark:border-subtle-dark light:border-subtle-light">
            {percent === 100 && pTotal > 0 ? 'Completed' : project.status || 'Active'}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={(e) => onEdit(project, e)}
              className="p-1.5 rounded-full text-zinc-500 hover:text-white dark:hover:text-white light:hover:text-black hover:bg-zinc-800/80 dark:hover:bg-zinc-800/80 light:hover:bg-zinc-200 transition-all cursor-pointer"
              title="Edit project"
              aria-label="Edit project"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => onDelete(project.id, e)}
              className="p-1.5 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              title="Delete project"
              aria-label="Delete project"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <h3 className="text-base sm:text-lg font-semibold text-white dark:text-white light:text-black group-hover:text-emerald-400 transition-colors line-clamp-1 mb-1">
          {project.title}
        </h3>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 light:text-zinc-500 line-clamp-2 min-h-[32px]">
          {project.description || 'No description provided'}
        </p>
      </div>

      {/* Middle: Progress Bar & Dynamic Completion Count */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400 dark:text-zinc-400 light:text-zinc-600 font-medium">
            {pCompleted.length} of {pTotal} done · {pPending.length} backlog
          </span>
          <span className="font-mono font-bold text-white dark:text-white light:text-black tabular-nums">
            {percent}%
          </span>
        </div>

        <div className="w-full h-1.5 rounded-full bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-200 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Bottom: Focus Time & View Backlog Action */}
      <div className="pt-3 border-t border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-400 light:text-zinc-600">
          <Flame className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-mono text-zinc-200 dark:text-zinc-200 light:text-zinc-800 font-semibold">
            {pFocusMinutes > 0 ? `${pFocusMinutes}m` : '0m'}
          </span>
          <span className="text-[11px] text-zinc-500">focus</span>
        </div>

        <button
          onClick={(e) => onViewBacklog(project.id, e)}
          className="flex items-center gap-1 text-xs font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors cursor-pointer group/btn"
          title="View tasks backlog for this project"
        >
          <span>View Backlog</span>
          <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
