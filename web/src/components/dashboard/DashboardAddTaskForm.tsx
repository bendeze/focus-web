import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { api } from '../../services/api';
import { DurationSelect } from './DurationSelect';

interface DashboardAddTaskFormProps {
  onClose: () => void;
  onCreated?: () => void;
  onOpenAuth: () => void;
}

export const DashboardAddTaskForm: React.FC<DashboardAddTaskFormProps> = ({
  onClose,
  onCreated,
  onOpenAuth,
}) => {
  const { user, addToast } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(25);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await api.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        estimated_minutes: duration,
      });
      setTitle('');
      setDescription('');
      setIsCustomDuration(false);
      onClose();
      addToast('Task added to backlog', 'success');
      onCreated?.();
    } catch (err: any) {
      addToast(err.message || 'Failed to create task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-2xl bg-item-dark dark:bg-item-dark light:bg-item-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col gap-3 transition-all relative"
    >
      <input
        type="text"
        autoFocus
        placeholder="What are you working on?..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full h-9 px-3 rounded-xl bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-xs text-white dark:text-white light:text-black placeholder:text-zinc-500 outline-none border border-transparent focus:border-zinc-700 dark:focus:border-zinc-700 light:focus:border-zinc-300 transition-colors"
      />

      <input
        type="text"
        placeholder="Task description (optional)..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full h-8 px-3 rounded-xl bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-xs text-zinc-300 dark:text-zinc-300 light:text-zinc-700 placeholder:text-zinc-500 outline-none border border-transparent focus:border-zinc-700 dark:focus:border-zinc-700 light:focus:border-zinc-300 transition-colors"
      />

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* Preset & Custom Duration buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          {[5, 15, 25, 45, 60].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setIsCustomDuration(false);
                setDuration(m);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                !isCustomDuration && duration === m
                  ? 'bg-white dark:bg-white text-black light:bg-black light:text-white shadow-sm'
                  : 'opacity-50 hover:opacity-80 bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-zinc-300 dark:text-zinc-300 light:text-zinc-700'
              }`}
            >
              {m}m
            </button>
          ))}

          {/* Professional Minimalist Custom Duration Select */}
          <DurationSelect
            value={duration}
            isCustom={isCustomDuration}
            onChange={(mins) => {
              setDuration(mins);
              setIsCustomDuration(true);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              setIsCustomDuration(false);
            }}
            className="px-3 py-1 text-xs opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="h-8 px-4 rounded-full bg-white dark:bg-white text-black light:bg-black light:text-white text-xs font-bold disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            {submitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </form>
  );
};
