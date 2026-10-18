import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Task, Project } from '../../types';
import {
  ListTodo,
  Check,
  Circle,
  Play,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Calendar,
  Clock,
  CheckCircle2,
  FolderKanban,
  Search,
  X,
  RotateCcw,
} from 'lucide-react';
import { ProjectSelectDropdown } from './ProjectSelectDropdown';
import { PrioritySelectDropdown } from './PrioritySelectDropdown';

interface WorkspaceTasksTableProps {
  tasks: Task[];
  projects: Project[];
  allCount: number;
  todoCount: number;
  completedCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedProjectId: string;
  onSelectProjectId: (id: string) => void;
  selectedStatus: 'all' | 'todo' | 'completed';
  onSelectStatus: (status: 'all' | 'todo' | 'completed') => void;
  selectedPriority: string;
  onSelectPriority: (priority: string) => void;
  onToggleComplete: (task: Task) => void;
  onStartFocus: (taskId: string) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onResetFilters: () => void;
}

export const WorkspaceTasksTable: React.FC<WorkspaceTasksTableProps> = ({
  tasks,
  projects,
  allCount,
  todoCount,
  completedCount,
  searchQuery,
  onSearchChange,
  selectedProjectId,
  onSelectProjectId,
  selectedStatus,
  onSelectStatus,
  selectedPriority,
  onSelectPriority,
  onToggleComplete,
  onStartFocus,
  onEditTask,
  onDeleteTask,
  onResetFilters,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedProjectId, selectedStatus, selectedPriority, tasks.length]);

  const totalPages = Math.max(1, Math.ceil(tasks.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, tasks.length);
  const paginatedTasks = tasks.slice(startIndex, endIndex);

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedProjectId !== 'all' ||
    selectedStatus !== 'all' ||
    selectedPriority !== 'all';

  const selectedProjectObj = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-zinc-950/95 dark:bg-zinc-950/95 light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col gap-5 select-none shadow-sm">
      {/* 1. Header & Status Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-subtle-dark dark:border-subtle-dark light:border-subtle-light">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-white dark:text-white light:text-black flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-zinc-400" />
              <span>Workspace Tasks</span>
            </h3>

            {/* Active Project Filter Chip */}
            {selectedProjectId !== 'all' && (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800/80 border border-subtle-dark text-[11px] text-zinc-300 font-medium">
                <FolderKanban className="w-3 h-3 text-zinc-400" />
                <span>{selectedProjectId === 'standalone' ? 'Inbox' : selectedProjectObj?.title || 'Project'}</span>
                <button
                  type="button"
                  onClick={() => onSelectProjectId('all')}
                  className="hover:text-white cursor-pointer ml-0.5"
                  title="Clear project filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Active Priority Filter Chip */}
            {selectedPriority !== 'all' && (
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800/80 border border-subtle-dark text-[11px] text-zinc-300 font-medium">
                <span className="uppercase text-[10px] font-mono text-zinc-400">{selectedPriority}</span>
                <button
                  type="button"
                  onClick={() => onSelectPriority('all')}
                  className="hover:text-white cursor-pointer ml-0.5"
                  title="Clear priority filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <span className="text-xs text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            {hasActiveFilters
              ? `Showing ${tasks.length} matching task${tasks.length === 1 ? '' : 's'}`
              : `Showing all ${allCount} tasks in workspace`}
          </span>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center p-0.5 rounded-full bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-hover-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-xs font-medium self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onSelectStatus('all')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              selectedStatus === 'all'
                ? 'bg-white dark:bg-white text-black font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black'
            }`}
          >
            All ({allCount})
          </button>
          <button
            type="button"
            onClick={() => onSelectStatus('todo')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              selectedStatus === 'todo'
                ? 'bg-white dark:bg-white text-black font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black'
            }`}
          >
            To Do ({todoCount})
          </button>
          <button
            type="button"
            onClick={() => onSelectStatus('completed')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              selectedStatus === 'completed'
                ? 'bg-white dark:bg-white text-black font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* 2. Unified Minimalist Toolbar: Search & Select Dropdowns */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks by title or notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-8 pl-9 pr-8 rounded-full bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-hover-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-xs text-white dark:text-white light:text-black placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white dark:hover:text-white light:hover:text-black cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns & Reset Filter */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Minimalist Project Dropdown */}
          <ProjectSelectDropdown
            projects={projects}
            tasks={tasks}
            selectedProjectId={selectedProjectId}
            onSelectProjectId={onSelectProjectId}
          />

          {/* Minimalist Priority Dropdown */}
          <PrioritySelectDropdown
            selectedPriority={selectedPriority}
            onSelectPriority={onSelectPriority}
          />

          {/* Reset Filters Link */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="h-8 px-2.5 rounded-full text-[11px] text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black transition-colors cursor-pointer flex items-center gap-1"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Table Content */}
      {tasks.length === 0 ? (
        <div className="py-14 text-center flex flex-col items-center justify-center gap-2.5 text-xs text-zinc-500">
          <ListTodo className="w-8 h-8 opacity-40 mb-1" />
          <p className="font-semibold text-zinc-400">No tasks match your criteria</p>
          <p className="max-w-xs">
            {hasActiveFilters
              ? 'Try clearing your search query, project filter, or status filter.'
              : 'Add your first task using the "New Task" button above.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-2 h-7 px-3.5 rounded-full bg-zinc-900 border border-subtle-dark text-zinc-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
            >
              Clear Active Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto focus-custom-scrollbar border border-subtle-dark/40 dark:border-transparent light:border-transparent rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-zinc-950/98 dark:bg-zinc-950/98 light:bg-surface-light backdrop-blur-md">
                <tr className="border-b border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
                  <th className="py-3 px-3 w-10">Status</th>
                  <th className="py-3 px-3">Task & Project</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Focus Logged</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle-dark dark:divide-gray-900/30 light:divide-gray-300/70">
                {paginatedTasks.map((task) => {
                  const isCompleted = task.status === 'completed';
                  const project = projects.find((p) => p.id === task.project_id);

                  return (
                    <tr
                      key={task.id}
                      onClick={() => onEditTask?.(task)}
                      className="group hover:bg-zinc-900/40 dark:hover:bg-zinc-900/40 light:hover:bg-zinc-100/60 transition-colors cursor-pointer"
                    >
                      {/* 1. Toggle Checkbox */}
                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(task);
                          }}
                          className={`w-4 h-4 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'border border-subtle-dark dark:border-subtle-dark light:border-subtle-light opacity-50 group-hover:opacity-100 hover:border-emerald-400'
                          }`}
                          title={isCompleted ? 'Mark as todo' : 'Mark as completed'}
                        >
                          {isCompleted ? (
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          ) : (
                            <Circle className="w-2 h-2 text-transparent" />
                          )}
                        </button>
                      </td>

                      {/* 2. Task Title, Project Badge & Timestamps */}
                      <td className="py-3.5 px-3 min-w-[240px]">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-medium ${
                                isCompleted
                                  ? 'line-through text-zinc-500 dark:text-zinc-500 light:text-zinc-400'
                                  : 'text-zinc-200 dark:text-zinc-200 light:text-zinc-900'
                              }`}
                            >
                              {task.title}
                            </span>

                            {/* Project Badge */}
                            {project ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectProjectId(project.id);
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 transition-colors cursor-pointer"
                                title={`Filter by project: ${project.title}`}
                              >
                                <FolderKanban className="w-2.5 h-2.5 opacity-60" />
                                <span>{project.title}</span>
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                                Inbox
                              </span>
                            )}
                          </div>

                          {task.description && (
                            <span className="text-[11px] text-zinc-500 truncate max-w-sm">
                              {task.description}
                            </span>
                          )}

                          {/* Created & Completed / Modified Timestamps */}
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-500 light:text-zinc-500 mt-0.5 flex-wrap">
                            {task.created_at && (
                              <span
                                className="inline-flex items-center gap-1"
                                title={`Created on ${format(new Date(task.created_at), 'PPpp')}`}
                              >
                                <Calendar className="w-2.5 h-2.5 opacity-60" />
                                <span>Created {format(new Date(task.created_at), 'MMM d, HH:mm')}</span>
                              </span>
                            )}
                            {isCompleted && (task.completed_at || task.updated_at) ? (
                              <>
                                <span className="opacity-40">·</span>
                                <span
                                  className="inline-flex items-center gap-1 text-emerald-500/90 dark:text-emerald-400 font-medium"
                                  title={`Completed on ${format(new Date(task.completed_at || task.updated_at), 'PPpp')}`}
                                >
                                  <CheckCircle2 className="w-2.5 h-2.5 stroke-[2.5]" />
                                  <span>Done {format(new Date(task.completed_at || task.updated_at), 'MMM d, HH:mm')}</span>
                                </span>
                              </>
                            ) : task.updated_at && task.updated_at !== task.created_at ? (
                              <>
                                <span className="opacity-40">·</span>
                                <span
                                  className="inline-flex items-center gap-1"
                                  title={`Modified on ${format(new Date(task.updated_at), 'PPpp')}`}
                                >
                                  <Clock className="w-2.5 h-2.5 opacity-60" />
                                  <span>Edited {format(new Date(task.updated_at), 'MMM d, HH:mm')}</span>
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* 3. Priority Badge */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            task.priority === 'urgent'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : task.priority === 'high'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : task.priority === 'medium'
                              ? 'bg-zinc-200/90 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-300 light:text-zinc-700'
                              : 'bg-zinc-900 text-zinc-500'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      {/* 4. Estimated Duration */}
                      <td className="py-3.5 px-3 font-mono text-zinc-400 dark:text-zinc-400 light:text-zinc-600">
                        {task.estimated_minutes}m
                      </td>

                      {/* 5. Focus Logged */}
                      <td className="py-3.5 px-3 font-mono">
                        {task.total_focus_minutes > 0 ? (
                          <span className="text-emerald-400 font-medium inline-flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5 fill-current" />
                            {task.total_focus_minutes}m
                          </span>
                        ) : isCompleted ? (
                          <span className="text-emerald-400/90 font-medium">
                            {task.estimated_minutes || 25}m
                          </span>
                        ) : (
                          <span className="text-zinc-500">0m</span>
                        )}
                      </td>

                      {/* 6. Action: Edit, Delete & Sprint */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onEditTask && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTask(task);
                              }}
                              className="p-1.5 rounded-full text-zinc-500 hover:text-white dark:hover:text-white light:hover:text-black hover:bg-zinc-800/80 dark:hover:bg-zinc-800/80 light:hover:bg-zinc-200 transition-all cursor-pointer"
                              title="Edit task details"
                              aria-label="Edit task details"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteTask && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTask(task.id);
                              }}
                              className="p-1.5 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                              title="Delete task"
                              aria-label="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!isCompleted ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartFocus(task.id);
                              }}
                              className="h-7 px-3 rounded-full bg-zinc-900 dark:bg-zinc-900 light:bg-white hover:bg-white dark:hover:bg-white light:hover:bg-black text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-black dark:hover:text-black light:hover:text-white text-[11px] font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer"
                              title="Start Focus Sprint on this task"
                            >
                              <Play className="w-3 h-3 fill-current ml-0.5" />
                              <span>Sprint</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-zinc-500 font-mono px-1">Done</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {tasks.length > pageSize && (
            <div className="pt-2 border-t border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-600">
              <div>
                Showing <span className="font-mono text-white dark:text-white light:text-black font-semibold">{startIndex + 1}</span>–<span className="font-mono text-white dark:text-white light:text-black font-semibold">{endIndex}</span> of{' '}
                <span className="font-mono text-white dark:text-white light:text-black font-semibold">{tasks.length}</span> tasks
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="h-7 px-3 rounded-full bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-zinc-100 border border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-white dark:hover:text-white light:hover:text-black disabled:opacity-35 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer text-[11px]"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <span className="px-2 font-mono text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-600">
                  {safePage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="h-7 px-3 rounded-full bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-zinc-100 border border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-white dark:hover:text-white light:hover:text-black disabled:opacity-35 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer text-[11px]"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
