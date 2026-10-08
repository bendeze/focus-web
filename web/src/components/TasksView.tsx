import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import type { Task, Project } from '../types';
import {
  Plus,
  CheckCircle2,
  Circle,
  Play,
  Trash2,
  Flame,
  Clock,
  Layers,
  Inbox,
  Loader2,
} from 'lucide-react';

interface TasksViewProps {
  tasks: Task[];
  projects: Project[];
  onRefresh: () => void;
  onOpenAuth?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  projects,
  onRefresh,
  onOpenAuth,
}) => {
  const { user, setSelectedTaskId, setActiveTab, addToast } = useStore();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<string>('medium');
  const [newEstMinutes, setNewEstMinutes] = useState<number>(25);
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const filteredTasks = tasks.filter((task) => {
    if (task.is_deleted) return false;
    if (selectedProjectId === 'standalone' && task.project_id !== null) return false;
    if (selectedProjectId !== 'all' && selectedProjectId !== 'standalone' && task.project_id !== selectedProjectId) return false;
    if (selectedStatus === 'todo' && task.status === 'completed') return false;
    if (selectedStatus === 'completed' && task.status !== 'completed') return false;
    return true;
  });

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth?.();
      return;
    }
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      await api.createTask({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        priority: newPriority,
        estimated_minutes: newEstMinutes,
        project_id: newProjectId || null,
      });
      setNewTitle('');
      setNewDescription('');
      setIsCreating(false);
      addToast('Task added to backlog', 'success');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to create task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    if (!user) {
      onOpenAuth?.();
      return;
    }
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      addToast(nextStatus === 'completed' ? 'Task completed' : 'Task marked as todo', 'success');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to update task status', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      addToast('Task deleted', 'info');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete task', 'error');
    }
  };

  const handleStartFocusOnTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setActiveTab('focus');
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-black text-white dark:bg-white dark:text-black font-extrabold';
      case 'high':
        return 'bg-dark-fill text-white dark:bg-dark-fill dark:text-white border border-light-border dark:border-dark-border';
      case 'medium':
        return 'bg-light-fill dark:bg-dark-fill text-light-textSecondary dark:text-dark-textSecondary border border-light-border dark:border-dark-border';
      default:
        return 'bg-transparent text-light-textSecondary dark:text-dark-textSecondary border border-light-border dark:border-dark-border opacity-70';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-badge uppercase text-light-textSecondary dark:text-dark-textSecondary mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Agile Backlog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-light-text dark:text-dark-text">
            Tasks & Sprints
          </h1>
        </div>

        <button
          onClick={() => {
            if (!user) onOpenAuth?.();
            else setIsCreating(!isCreating);
          }}
          className="h-11 px-5 rounded-full bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg text-xs font-bold tracking-brand uppercase flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Task</span>
        </button>
      </div>

      {/* Task Creation Card */}
      {isCreating && (
        <form
          onSubmit={handleCreateTask}
          className="mb-8 p-6 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-xl animate-slide-down space-y-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary">
              Create New Task
            </span>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text"
            >
              Cancel
            </button>
          </div>

          <div>
            <input
              type="text"
              required
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-sm font-medium focus:outline-none focus:border-light-text dark:focus:border-dark-text text-light-text dark:text-dark-text"
              autoFocus
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Description or context (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-xs focus:outline-none focus:border-light-text dark:focus:border-dark-text text-light-text dark:text-dark-text"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary mb-1">
                Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-xs focus:outline-none text-light-text dark:text-dark-text uppercase font-semibold"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary mb-1">
                Sprint Estimate
              </label>
              <select
                value={newEstMinutes}
                onChange={(e) => setNewEstMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-xs focus:outline-none text-light-text dark:text-dark-text font-semibold"
              >
                <option value={15}>15 minutes</option>
                <option value={25}>25 minutes (Standard)</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary mb-1">
                Project / Category
              </label>
              <select
                value={newProjectId}
                onChange={(e) => setNewProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-xs focus:outline-none text-light-text dark:text-dark-text font-semibold truncate"
              >
                <option value="">Standalone (Inbox)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-full bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg text-xs font-bold tracking-brand uppercase flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-md mt-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Add Task</span>}
          </button>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setSelectedProjectId('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-badge uppercase whitespace-nowrap transition-all ${
              selectedProjectId === 'all'
                ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg'
                : 'bg-light-surface dark:bg-dark-surface text-light-textSecondary dark:text-dark-textSecondary border border-light-border dark:border-dark-border'
            }`}
          >
            All ({tasks.filter(t => !t.is_deleted).length})
          </button>

          <button
            onClick={() => setSelectedProjectId('standalone')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-badge uppercase whitespace-nowrap transition-all ${
              selectedProjectId === 'standalone'
                ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg'
                : 'bg-light-surface dark:bg-dark-surface text-light-textSecondary dark:text-dark-textSecondary border border-light-border dark:border-dark-border'
            }`}
          >
            <Inbox className="w-3 h-3" />
            Inbox
          </button>

          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-badge uppercase whitespace-nowrap transition-all ${
                selectedProjectId === p.id
                  ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg'
                  : 'bg-light-surface dark:bg-dark-surface text-light-textSecondary dark:text-dark-textSecondary border border-light-border dark:border-dark-border'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-light-surface dark:bg-dark-surface p-1 rounded-full border border-light-border dark:border-dark-border">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${
              selectedStatus === 'all'
                ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg'
                : 'text-light-textSecondary dark:text-dark-textSecondary'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedStatus('todo')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${
              selectedStatus === 'todo'
                ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg'
                : 'text-light-textSecondary dark:text-dark-textSecondary'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setSelectedStatus('completed')}
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-all ${
              selectedStatus === 'completed'
                ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg'
                : 'text-light-textSecondary dark:text-dark-textSecondary'
            }`}
          >
            Done
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
            <CheckCircle2 className="w-8 h-8 text-light-textSecondary dark:text-dark-textSecondary mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold text-light-textSecondary dark:text-dark-textSecondary">
              No tasks found in this view
            </p>
            <p className="text-xs text-light-textMuted dark:text-dark-textMuted mt-1">
              Add a new task above or select a different project
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const project = projects.find((p) => p.id === task.project_id);
            const isCompleted = task.status === 'completed';

            return (
              <div
                key={task.id}
                className={`group p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all flex items-center justify-between gap-4 ${
                  isCompleted
                    ? 'bg-light-surface/60 dark:bg-dark-surface/60 border-light-border dark:border-dark-border opacity-60'
                    : 'bg-light-surface dark:bg-dark-surface border-light-border dark:border-dark-border hover:border-light-text dark:hover:border-dark-text shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className="flex-shrink-0 text-light-text dark:text-dark-text hover:scale-110 transition-transform"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 fill-current text-white dark:text-black stroke-black dark:stroke-white" />
                    ) : (
                      <Circle className="w-5 h-5 text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text stroke-[2]" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <h3
                      className={`text-sm sm:text-base font-semibold text-light-text dark:text-dark-text truncate ${
                        isCompleted ? 'line-through text-light-textSecondary dark:text-dark-textSecondary' : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                    
                    {task.description && (
                      <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary truncate mt-0.5">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] font-bold uppercase tracking-wider">
                      {project && (
                        <span className="px-2 py-0.5 rounded-full bg-light-fill dark:bg-dark-fill text-light-textSecondary dark:text-dark-textSecondary border border-light-border dark:border-dark-border">
                          {project.title}
                        </span>
                      )}

                      <span className={`px-2 py-0.5 rounded-full text-[9px] ${getPriorityBadgeClass(task.priority)}`}>
                        {task.priority}
                      </span>

                      <span className="flex items-center gap-1 text-light-textSecondary dark:text-dark-textSecondary">
                        <Clock className="w-3 h-3" />
                        <span>{task.estimated_minutes}m</span>
                      </span>

                      {task.total_focus_minutes > 0 && (
                        <span className="flex items-center gap-1 text-light-text dark:text-dark-text">
                          <Flame className="w-3 h-3" />
                          <span>{task.total_focus_minutes}m spent</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!isCompleted && (
                    <button
                      onClick={() => handleStartFocusOnTask(task.id)}
                      className="px-3 py-1.5 rounded-full bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg text-xs font-bold tracking-brand uppercase flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-current stroke-none" />
                      <span className="hidden sm:inline">Focus</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 rounded-full text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text hover:bg-light-fill dark:hover:bg-dark-fill transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
