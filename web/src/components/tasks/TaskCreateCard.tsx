import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { api } from '../../services/api';
import type { Project } from '../../types';
import { DurationSelect } from '../dashboard/DurationSelect';
import { ProjectPicker } from './ProjectPicker';
import { Loader2 } from 'lucide-react';

interface TaskCreateCardProps {
  projects: Project[];
  defaultProjectId?: string;
  onClose: () => void;
  onCreated: () => void;
  onOpenAuth?: () => void;
}

export const TaskCreateCard: React.FC<TaskCreateCardProps> = ({
  projects,
  defaultProjectId,
  onClose,
  onCreated,
  onOpenAuth,
}) => {
  const { user, addToast } = useStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(25);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [priority, setPriority] = useState<string>('medium');
  const [projectId, setProjectId] = useState<string>(
    defaultProjectId && defaultProjectId !== 'all' && defaultProjectId !== 'standalone'
      ? defaultProjectId
      : ''
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth?.();
      return;
    }
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await api.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        estimated_minutes: duration,
        project_id: projectId || null,
      });
      setTitle('');
      setDescription('');
      setIsCustomDuration(false);
      onClose();
      addToast('Task added to backlog', 'success');
      onCreated();
    } catch (err: any) {
      addToast(err.message || 'Failed to create task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 sm:p-5 rounded-2xl bg-zinc-950/95 dark:bg-zinc-950/95 light:bg-item-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col gap-3 transition-all relative select-none shadow-xl"
    >
      {/* 1. Title Input */}
      <input
        type="text"
        autoFocus
        placeholder="What are you working on?..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full h-9 px-3.5 rounded-xl bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-xs text-white dark:text-white light:text-black placeholder:text-zinc-500 outline-none border border-transparent focus:border-zinc-700 dark:focus:border-zinc-700 light:focus:border-zinc-300 transition-colors"
      />

      {/* 2. Optional Description */}
      <input
        type="text"
        placeholder="Task description or notes (optional)..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full h-8 px-3.5 rounded-xl bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-xs text-zinc-300 dark:text-zinc-300 light:text-zinc-700 placeholder:text-zinc-500 outline-none border border-transparent focus:border-zinc-700 dark:focus:border-zinc-700 light:focus:border-zinc-300 transition-colors"
      />

      {/* 3. Streamlined Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 flex-wrap">
          {/* A. Duration Presets & Minimalist Custom Duration Select */}
          <div className="flex items-center gap-1">
            {[15, 25, 45, 60].map((m) => (
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

            {/* Custom Duration Selector Dropdown */}
            <DurationSelect
              value={duration}
              isCustom={isCustomDuration}
              onChange={(mins) => {
                setDuration(mins);
                setIsCustomDuration(true);
              }}
            />
          </div>

          <div className="h-4 w-px bg-subtle-dark dark:bg-subtle-dark light:bg-subtle-light hidden sm:block" />

          {/* B. Priority Quick Pills */}
          <div className="flex items-center gap-1">
            {(
              [
                { id: 'low', label: 'Low' },
                { id: 'medium', label: 'Med' },
                { id: 'high', label: 'High' },
                { id: 'urgent', label: 'Urg' },
              ] as const
            ).map((pri) => (
              <button
                key={pri.id}
                type="button"
                onClick={() => setPriority(pri.id)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  priority === pri.id
                    ? 'bg-white dark:bg-white text-black light:bg-black light:text-white font-bold shadow-sm'
                    : 'opacity-50 hover:opacity-80 bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-zinc-300 dark:text-zinc-300 light:text-zinc-700'
                }`}
              >
                {pri.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-subtle-dark dark:bg-subtle-dark light:bg-subtle-light hidden sm:block" />

          {/* C. Modern Project Picker */}
          <ProjectPicker
            projects={projects}
            value={projectId}
            onChange={setProjectId}
            placeholder="Inbox"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="h-8 px-4 rounded-full bg-white dark:bg-white text-black light:bg-black light:text-white text-xs font-bold disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm inline-flex items-center gap-1.5"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Add Task</span>}
          </button>
        </div>
      </div>
    </form>
  );
};
