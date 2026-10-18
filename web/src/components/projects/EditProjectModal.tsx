import React, { useState, useEffect } from 'react';
import type { Project } from '../../types';
import { api } from '../../services/api';
import { useStore } from '../../store/useStore';
import { X, Loader2 } from 'lucide-react';

interface EditProjectModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  project,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const { addToast } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Project['status']>('active');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setTitle(project.title || '');
      setDescription(project.description || '');
      setStatus(project.status || 'active');
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await api.updateProject(project.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
      });
      addToast('Project updated', 'success');
      onRefresh?.();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Failed to update project', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all animate-in fade-in select-none"
    >
      <div className="relative w-full max-w-md bg-zinc-950/98 dark:bg-zinc-950/98 light:bg-white/98 border border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200/80 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl text-white dark:text-white light:text-black transition-all">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-1.5 rounded-full text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black hover:bg-zinc-800/60 dark:hover:bg-zinc-800/60 light:hover:bg-zinc-200/60 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-semibold tracking-tight text-white dark:text-white light:text-black mb-1">
          Edit Project
        </h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mb-6">
          Update project title, description, or workflow status
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mb-1.5">
              Project Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Q4 Mobile App Release"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-zinc-100 border border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200/80 text-xs font-medium text-white dark:text-white light:text-black focus:outline-none focus:border-zinc-600 dark:focus:border-zinc-600 light:focus:border-zinc-400"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              placeholder="Goals, milestones, or project scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-zinc-100 border border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200/80 text-xs text-white dark:text-white light:text-black focus:outline-none focus:border-zinc-600 dark:focus:border-zinc-600 light:focus:border-zinc-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mb-1.5">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'active', label: 'Active' },
                  { id: 'completed', label: 'Completed' },
                  { id: 'archived', label: 'Archived' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatus(s.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    status === s.id
                      ? 'bg-white dark:bg-white text-black font-semibold border-white dark:border-white shadow-xs'
                      : 'bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-zinc-100 text-zinc-400 border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200 hover:text-white dark:hover:text-white light:hover:text-black'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 rounded-full bg-white dark:bg-white text-black light:bg-black light:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-md cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Save Changes</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
