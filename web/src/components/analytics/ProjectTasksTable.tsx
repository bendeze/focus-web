import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import type { Project, Task } from '../../types';
import {
  ListTodo,
  Check,
  Circle,
  Play,
  X,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Calendar,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface ProjectTasksTableProps {
  currentProject: Project | null;
  tasks: Task[];
  allCount: number;
  todoCount: number;
  completedCount: number;
  activeTab: 'all' | 'todo' | 'completed';
  onTabChange: (tab: 'all' | 'todo' | 'completed') => void;
  selectedDateKey: string | null;
  onClearDateFilter: () => void;
  onToggleTaskStatus: (task: Task) => void;
  onStartTaskSprint: (task: Task) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (taskId: string) => Promise<void> | void;
}

export const ProjectTasksTable: React.FC<ProjectTasksTableProps> = ({
  currentProject,
  tasks,
  allCount,
  todoCount,
  completedCount,
  activeTab,
  onTabChange,
  selectedDateKey,
  onClearDateFilter,
  onToggleTaskStatus,
  onStartTaskSprint,
  onEditTask,
  onDeleteTask,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Reset page when tab or date filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedDateKey]);

  const totalPages = Math.max(1, Math.ceil(tasks.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, tasks.length);
  const paginatedTasks = tasks.slice(startIndex, endIndex);
  return (
    <div className="p-6 md:p-8 rounded-3xl bg-zinc-950/95 dark:bg-zinc-950/95 light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col gap-5 select-none">
      {/* Table Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-subtle-dark dark:border-subtle-dark light:border-subtle-light">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-white dark:text-white light:text-black">
              {currentProject ? `${currentProject.title} Tasks` : 'Workspace Tasks'}
            </h3>
            {selectedDateKey && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                <span>Day: {format(parseISO(selectedDateKey), 'EEE, MMM d')}</span>
                <button
                  onClick={onClearDateFilter}
                  className="hover:text-white transition-colors cursor-pointer"
                  title="Clear day filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            {selectedDateKey
              ? `Showing tasks completed on ${format(parseISO(selectedDateKey), 'MMMM d, yyyy')}`
              : 'Showing active backlog and completed sprint items'}
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center p-0.5 rounded-full bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-hover-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => {
              onTabChange('all');
              if (selectedDateKey) onClearDateFilter();
            }}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              activeTab === 'all' && !selectedDateKey
                ? 'bg-white dark:bg-white text-black font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black'
            }`}
          >
            All ({allCount})
          </button>
          <button
            onClick={() => {
              onTabChange('todo');
              if (selectedDateKey) onClearDateFilter();
            }}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              activeTab === 'todo'
                ? 'bg-white dark:bg-white text-black font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black'
            }`}
          >
            To Do ({todoCount})
          </button>
          <button
            onClick={() => onTabChange('completed')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              activeTab === 'completed'
                ? 'bg-white dark:bg-white text-black font-semibold shadow-xs'
                : 'text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black'
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>
      </div>

      {/* Table Content */}
      {tasks.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-xs text-zinc-500">
          <ListTodo className="w-8 h-8 opacity-40 mb-1" />
          <p className="font-semibold text-zinc-400">No tasks in this view</p>
          <p>
            {activeTab === 'completed'
              ? 'Complete tasks during focus sprints to view them here.'
              : 'Add tasks to this project from the Tasks tab.'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto focus-custom-scrollbar border border-subtle-dark/40 dark:border-transparent light:border-subtle-light/60 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 z-10 bg-zinc-950/98 dark:bg-zinc-950/98 light:bg-surface-light backdrop-blur-md">
                <tr className="border-b border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
                  <th className="py-3 px-3 w-10">Status</th>
                  <th className="py-3 px-3">Task Title</th>
                  <th className="py-3 px-3">Priority</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Focus Logged</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle-dark dark:divide-gray-900/30 light:divide-gray-300/70">
                {paginatedTasks.map((task) => {
                  const isCompleted = task.status === 'completed';

                  return (
                    <tr
                      key={task.id}
                      onClick={() => onEditTask?.(task)}
                      className="group hover:bg-zinc-900/40 dark:hover:bg-zinc-900/40 light:hover:bg-zinc-100/60 transition-colors cursor-pointer"
                    >
                      {/* 1. Toggle Checkbox */}
                      <td className="py-3.5 px-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleTaskStatus(task);
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

                      {/* 2. Task Title & Timestamps */}
                      <td className="py-3.5 px-3 min-w-[220px]">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${
                                isCompleted
                                  ? 'line-through text-zinc-500 dark:text-zinc-500 light:text-zinc-400'
                                  : 'text-zinc-200 dark:text-zinc-200 light:text-zinc-900'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                          {task.description && (
                            <span className="text-[11px] text-zinc-500 truncate max-w-sm">
                              {task.description}
                            </span>
                          )}

                          {/* Created & Completed / Modified Timestamps */}
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-500 light:text-zinc-500 mt-1 flex-wrap">
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
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartTaskSprint(task);
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
