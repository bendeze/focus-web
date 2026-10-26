import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Circle,
  X,
} from 'lucide-react';
import type { Task, Project } from '../../types';

interface AdminTasksTabProps {
  tasks: Task[];
  projects: Project[];
  onToggleTaskStatus?: (task: Task) => void;
}

export const AdminTasksTab: React.FC<AdminTasksTabProps> = ({
  tasks,
  projects,
  onToggleTaskStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q));

      const matchPriority = selectedPriority === 'all' || t.priority === selectedPriority;
      const matchStatus = selectedStatus === 'all' || t.status === selectedStatus;
      const matchProject = selectedProjectId === 'all' || t.project_id === selectedProjectId;

      return matchSearch && matchPriority && matchStatus && matchProject && !t.is_deleted;
    });
  }, [tasks, searchQuery, selectedPriority, selectedStatus, selectedProjectId]);

  const urgentCount = tasks.filter((t) => t.priority === 'urgent' && !t.is_deleted).length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress' && !t.is_deleted).length;
  const completedCount = tasks.filter((t) => t.status === 'completed' && !t.is_deleted).length;

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      {/* 1. Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-medium tracking-tight text-white dark:text-white light:text-black">
            Tasks
          </h2>
          <span className="text-xs text-zinc-500 font-mono">
            {filteredTasks.length} of {tasks.length} tasks · {urgentCount} urgent · {inProgressCount} in progress · {completedCount} completed
          </span>
        </div>
      </div>

      {/* 2. Minimalist Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-4 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="h-8 px-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 px-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="paused">Paused</option>
          </select>

          {/* Project */}
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="h-8 px-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 cursor-pointer max-w-[150px] truncate"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Minimalist Tasks Table */}
      <div className="rounded-2xl bg-zinc-950 border border-subtle-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-subtle-dark text-zinc-400 font-mono text-[10px] tracking-wider uppercase bg-zinc-900/30">
                <th className="py-3 px-5 font-medium">Task</th>
                <th className="py-3 px-5 font-medium">Priority</th>
                <th className="py-3 px-5 font-medium">Status</th>
                <th className="py-3 px-5 font-medium">Project</th>
                <th className="py-3 px-5 font-medium">Est</th>
                <th className="py-3 px-5 font-medium">Sprints</th>
                <th className="py-3 px-5 font-medium text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 font-light">
                    No tasks found
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const proj = projects.find((p) => p.id === task.project_id);

                  return (
                    <tr key={task.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => onToggleTaskStatus && onToggleTaskStatus(task)}
                            className="text-zinc-500 hover:text-white cursor-pointer transition-colors shrink-0"
                          >
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <div>
                            <div
                              className={`font-medium ${
                                task.status === 'completed'
                                  ? 'line-through text-zinc-500'
                                  : 'text-white dark:text-white light:text-black'
                              }`}
                            >
                              {task.title}
                            </div>
                            {task.description && (
                              <div className="text-[11px] text-zinc-500 font-light truncate max-w-xs">
                                {task.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-5">
                        <span
                          className={`text-[11px] font-mono uppercase tracking-wider ${
                            task.priority === 'urgent'
                              ? 'text-amber-400'
                              : task.priority === 'high'
                              ? 'text-zinc-200'
                              : 'text-zinc-500'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              task.status === 'completed'
                                ? 'bg-emerald-400'
                                : task.status === 'in_progress'
                                ? 'bg-blue-400'
                                : 'bg-zinc-500'
                            }`}
                          />
                          <span className="text-zinc-400">
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-5 text-zinc-400">
                        {proj ? (
                          <span className="truncate max-w-[140px] block">{proj.title}</span>
                        ) : (
                          <span className="text-zinc-600 font-mono text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-5 text-zinc-400 font-mono tabular-nums text-[11px]">
                        {task.estimated_minutes || 25}m
                      </td>

                      <td className="py-3 px-5 text-zinc-500 font-mono tabular-nums text-[11px]">
                        {task.focus_session_count || 0}
                      </td>

                      <td className="py-3 px-5 text-right text-zinc-500 font-mono text-[11px]">
                        {new Date(task.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
