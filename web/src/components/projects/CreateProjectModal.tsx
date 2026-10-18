import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => Promise<void>;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(title.trim(), description.trim());
      setTitle('');
      setDescription('');
      onClose();
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
          New Project
        </h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-600 mb-6">
          Organize tasks, milestones, and focus sprint goals
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-10 rounded-full bg-white dark:bg-white text-black light:bg-black light:text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-md cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Create Project</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
