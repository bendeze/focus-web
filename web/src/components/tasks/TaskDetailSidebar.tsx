import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Task, Project } from '../../types';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import {
  X,
  Loader2,
  Trash2,
  Clock,
  FolderKanban,
  Calendar,
  CheckCircle2,
  Flame,
  Play,
  Check,
  Circle,
} from 'lucide-react';
import { ProjectPicker } from './ProjectPicker';
import { DurationSelect } from '../dashboard/DurationSelect';

interface TaskDetailSidebarProps {
  task: Task | null;
  projects?: Project[];
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onDelete?: (taskId: string) => Promise<void> | void;
  onStartFocus?: (taskId: string) => void;
}

export const TaskDetailSidebar: React.FC<TaskDetailSidebarProps> = ({
  task,
  projects = [],
  isOpen,
  onClose,
  onRefresh,
  onDelete,
  onStartFocus,
}) => {
  const { addToast, selectAndStartTask, setActiveTab } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(25);
  const [isCustomDuration, setIsCustomDuration] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Sync state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setProjectId(task.project_id || null);
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'todo');
      const mins = task.estimated_minutes || 25;
      setEstimatedMinutes(mins);
      setIsCustomDuration(![15, 25, 45, 60].includes(mins));
    }
  }, [task, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await api.updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        project_id: projectId,
        priority,
        status,
        estimated_minutes: estimatedMinutes,
      });

      addToast('Task updated successfully', 'success');
      onRefresh?.();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Failed to update task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this task?')) return;
    setDeleting(true);
    try {
      if (onDelete) {
        await onDelete(task.id);
      } else {
        await api.deleteTask(task.id);
        addToast('Task deleted', 'info');
        onRefresh?.();
      }
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete task', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleStartSprint = () => {
    if (onStartFocus) {
      onStartFocus(task.id);
    } else {
      selectAndStartTask(task.id, estimatedMinutes);
      setActiveTab('dashboard');
    }
    onClose();
  };

  const handleToggleCompleted = () => {
    setStatus((prev) => (prev === 'completed' ? 'todo' : 'completed'));
  };

  const isCompleted = status === 'completed';

  return (
    <>
      {/* 1. Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-transparent backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 2. Slide-out Drawer Panel */}
      <aside
        role="dialog"
        aria-label="Task Details and Editor"
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[480px] md:w-[540px] bg-zinc-950/98 dark:bg-zinc-950/98 light:bg-surface-light text-white dark:text-white light:text-zinc-900 border-l border-subtle-dark dark:border-subtle-dark light:border-subtle-light shadow-2xl backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Status Quick Toggle (Emerald as aside accent when completed) */}
            <button
              type="button"
              onClick={handleToggleCompleted}
              className={`h-7 px-3 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer border ${
                isCompleted
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-500/15 border-emerald-500/30 dark:border-emerald-500/30 light:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-zinc-900 dark:bg-zinc-900 light:bg-hover-light border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-white dark:hover:text-white light:hover:text-black'
              }`}
              title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
            >
              {isCompleted ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Completed</span>
                </>
              ) : (
                <>
                  <Circle className="w-3 h-3 text-zinc-500 dark:text-zinc-400 light:text-zinc-500" />
                  <span>Mark Complete</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Sprint Now button (Monochrome primary accent) */}
            {!isCompleted && (
              <button
                type="button"
                onClick={handleStartSprint}
                className="h-7 px-3 rounded-full bg-white dark:bg-white text-black light:bg-black light:text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
                title="Start a Focus Sprint on this task now"
              >
                <Play className="w-3 h-3 fill-current ml-0.5" />
                <span>Sprint</span>
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 dark:text-zinc-400 light:text-zinc-500 hover:text-white dark:hover:text-white light:hover:text-black hover:bg-zinc-800/60 dark:hover:bg-zinc-800/60 light:hover:bg-hover-light transition-colors cursor-pointer"
              aria-label="Close task details"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="task-drawer-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 focus-custom-scrollbar"
        >
          {/* 1. Task Title */}
          <div>
            <label className="block text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500 mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              required
              placeholder="What needs to get done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base sm:text-lg font-semibold text-white dark:text-white light:text-black bg-transparent border-b border-subtle-dark dark:border-subtle-dark light:border-subtle-light focus:border-zinc-500 dark:focus:border-zinc-400 light:focus:border-zinc-600 pb-1.5 outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-500 light:placeholder:text-zinc-400"
            />
          </div>

          {/* 2. Full Description (Handles long text smoothly) */}
          <div>
            <label className="block text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500 mb-1.5">
              Description & Notes
            </label>
            <textarea
              rows={6}
              placeholder="Add full task background, context, acceptance criteria, or links..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-hover-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-xs text-zinc-200 dark:text-zinc-200 light:text-zinc-800 placeholder:text-zinc-500 dark:placeholder:text-zinc-500 light:placeholder:text-zinc-400 focus:outline-none focus:border-zinc-600 dark:focus:border-zinc-500 light:focus:border-zinc-400 transition-colors focus-custom-scrollbar min-h-[140px] resize-y leading-relaxed"
            />
          </div>

          {/* 3. Project Goal Assignment */}
          <div>
            <label className="block text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500 mb-1.5 flex items-center gap-1">
              <FolderKanban className="w-3 h-3 text-zinc-400 dark:text-zinc-400 light:text-zinc-500" />
              <span>Project Goal</span>
            </label>
            <ProjectPicker
              projects={projects}
              value={projectId || ''}
              onChange={(id) => setProjectId(id || null)}
              placeholder="Inbox (Standalone)"
              size="md"
            />
          </div>

          {/* 4. Priority Pills (Respects semantic priority colors in dark/light) */}
          <div>
            <label className="block text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500 mb-1.5">
              Priority Level
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {/* A. Low */}
              <button
                type="button"
                onClick={() => setPriority('low')}
                className={`py-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                  priority === 'low'
                    ? 'bg-white dark:bg-white text-black light:bg-black light:text-white font-bold border-white dark:border-white light:border-black shadow-xs'
                    : 'bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-hover-light text-zinc-400 dark:text-zinc-400 light:text-zinc-500 border-subtle-dark dark:border-subtle-dark light:border-subtle-light hover:text-white dark:hover:text-white light:hover:text-black'
                }`}
              >
                Low
              </button>

              {/* B. Medium */}
              <button
                type="button"
                onClick={() => setPriority('medium')}
                className={`py-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                  priority === 'medium'
                    ? 'bg-white dark:bg-white text-black light:bg-black light:text-white font-bold border-white dark:border-white light:border-black shadow-xs'
                    : 'bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-hover-light text-zinc-300 dark:text-zinc-300 light:text-zinc-700 border-subtle-dark dark:border-subtle-dark light:border-subtle-light hover:text-white dark:hover:text-white light:hover:text-black'
                }`}
              >
                Medium
              </button>

              {/* C. High (Semantic Amber) */}
              <button
                type="button"
                onClick={() => setPriority('high')}
                className={`py-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                  priority === 'high'
                    ? 'bg-amber-500/20 dark:bg-amber-500/20 light:bg-amber-100 text-amber-600 dark:text-amber-400 font-bold border-amber-500/50 dark:border-amber-500/50 light:border-amber-400 shadow-xs'
                    : 'bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-hover-light text-amber-500/80 dark:text-amber-400/80 light:text-amber-600/80 border-subtle-dark dark:border-subtle-dark light:border-subtle-light hover:text-amber-500 dark:hover:text-amber-400 light:hover:text-amber-600'
                }`}
              >
                High
              </button>

              {/* D. Urgent (Semantic Red) */}
              <button
                type="button"
                onClick={() => setPriority('urgent')}
                className={`py-2 text-xs font-medium rounded-xl border text-center transition-all cursor-pointer ${
                  priority === 'urgent'
                    ? 'bg-red-500/20 dark:bg-red-500/20 light:bg-red-100 text-red-600 dark:text-red-400 font-bold border-red-500/50 dark:border-red-500/50 light:border-red-400 shadow-xs'
                    : 'bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-hover-light text-red-500/80 dark:text-red-400/80 light:text-red-600/80 border-subtle-dark dark:border-subtle-dark light:border-subtle-light hover:text-red-500 dark:hover:text-red-400 light:hover:text-red-600'
                }`}
              >
                Urgent
              </button>
            </div>
          </div>

          {/* 5. Estimated Duration & Custom Select */}
          <div>
            <label className="block text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500 mb-1.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-400 dark:text-zinc-400 light:text-zinc-500" />
              <span>Sprint Duration</span>
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[15, 25, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setIsCustomDuration(false);
                    setEstimatedMinutes(mins);
                  }}
                  className={`px-3 py-1.5 text-xs font-mono rounded-xl border transition-all cursor-pointer ${
                    !isCustomDuration && estimatedMinutes === mins
                      ? 'bg-white dark:bg-white text-black light:bg-black light:text-white font-bold border-white dark:border-white light:border-black shadow-xs'
                      : 'bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-hover-light text-zinc-400 dark:text-zinc-400 light:text-zinc-600 border-subtle-dark dark:border-subtle-dark light:border-subtle-light hover:text-white dark:hover:text-white light:hover:text-black'
                  }`}
                >
                  {mins}m
                </button>
              ))}

              <DurationSelect
                value={estimatedMinutes}
                isCustom={isCustomDuration}
                onChange={(mins) => {
                  setEstimatedMinutes(mins);
                  setIsCustomDuration(true);
                }}
              />
            </div>
          </div>

          {/* 6. Focus Performance Stats Card (Emerald as accent side-color) */}
          <div className="p-4 rounded-2xl bg-zinc-900/40 dark:bg-zinc-900/40 light:bg-hover-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 light:bg-emerald-50 border border-emerald-500/20 dark:border-emerald-500/20 light:border-emerald-200 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Flame className="w-4 h-4 fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white dark:text-white light:text-black">
                  {task.total_focus_minutes > 0
                    ? `${task.total_focus_minutes}m Logged`
                    : isCompleted
                    ? `${task.estimated_minutes || 25}m Credited`
                    : '0m Logged'}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
                  {task.total_focus_minutes > 0
                    ? 'Sprint sessions recorded'
                    : isCompleted
                    ? 'Completed focus sprint'
                    : 'No focus sessions recorded yet'}
                </span>
              </div>
            </div>

            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 dark:text-zinc-400 light:text-zinc-600 px-2 py-0.5 rounded-full bg-zinc-900 dark:bg-zinc-900 light:bg-hover-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light">
              {status}
            </span>
          </div>

          {/* 7. Detailed Audit Timestamps (Emerald as completed accent only) */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/30 dark:bg-zinc-900/30 light:bg-hover-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-[11px] font-mono space-y-1.5">
            {task.created_at && (
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
                  <Calendar className="w-3 h-3 opacity-70" />
                  <span>Created:</span>
                </span>
                <span className="text-zinc-200 dark:text-zinc-200 light:text-zinc-800">
                  {format(new Date(task.created_at), 'PPP · HH:mm')}
                </span>
              </div>
            )}
            {task.updated_at && task.updated_at !== task.created_at && (
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
                  <Clock className="w-3 h-3 opacity-70" />
                  <span>Modified:</span>
                </span>
                <span className="text-zinc-200 dark:text-zinc-200 light:text-zinc-800">
                  {format(new Date(task.updated_at), 'PPP · HH:mm')}
                </span>
              </div>
            )}
            {isCompleted && (task.completed_at || task.updated_at) && (
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                  <span>Completed:</span>
                </span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {format(new Date(task.completed_at || task.updated_at), 'PPP · HH:mm')}
                </span>
              </div>
            )}
          </div>
        </form>

        {/* Bottom Actions Bar */}
        <div className="p-4 sm:p-5 border-t border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex items-center justify-between gap-3 bg-zinc-950/95 dark:bg-zinc-950/95 light:bg-white/95 backdrop-blur-md">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 rounded-xl text-zinc-500 dark:text-zinc-400 light:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
            title="Delete task permanently"
          >
            {deleting ? (
              <Loader2 className="w-4 h-4 animate-spin text-red-400" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-4 rounded-full text-[10px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-white dark:hover:text-white light:hover:text-black transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="task-drawer-form"
              disabled={submitting}
              className="h-8 px-5 rounded-full bg-white dark:bg-white text-black light:bg-black light:text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-md cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>Save</span>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
