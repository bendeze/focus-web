import React, { useState, useRef, useEffect } from 'react';
import { FolderKanban, Inbox, ChevronDown, Check, Layers } from 'lucide-react';
import type { Project, Task } from '../../types';

interface ProjectSelectDropdownProps {
  projects: Project[];
  tasks: Task[];
  selectedProjectId: string;
  onSelectProjectId: (id: string) => void;
}

export const ProjectSelectDropdown: React.FC<ProjectSelectDropdownProps> = ({
  projects,
  tasks,
  selectedProjectId,
  onSelectProjectId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeProjects = projects.filter((p) => !p.is_deleted);
  const nonDeletedTasks = tasks.filter((t) => !t.is_deleted);
  const standaloneCount = nonDeletedTasks.filter((t) => t.project_id === null).length;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Determine current label
  let currentLabel = 'All Projects';
  let CurrentIcon = Layers;

  if (selectedProjectId === 'standalone') {
    currentLabel = 'Inbox';
    CurrentIcon = Inbox;
  } else if (selectedProjectId !== 'all') {
    const proj = activeProjects.find((p) => p.id === selectedProjectId);
    if (proj) {
      currentLabel = proj.title;
      CurrentIcon = FolderKanban;
    }
  }

  const handleSelect = (id: string) => {
    onSelectProjectId(id);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-xs" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-8 px-3 rounded-full border flex items-center gap-1.5 transition-all cursor-pointer font-medium ${
          selectedProjectId !== 'all'
            ? 'bg-white dark:bg-white text-black font-semibold border-white shadow-xs'
            : 'bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-white text-zinc-300 dark:text-zinc-300 light:text-zinc-700 border-subtle-dark dark:border-subtle-dark light:border-subtle-light hover:text-white dark:hover:text-white light:hover:text-black'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <CurrentIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
        <span className="truncate max-w-[140px] sm:max-w-[180px]">{currentLabel}</span>
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 z-50 w-64 p-1.5 rounded-2xl bg-zinc-950/98 dark:bg-zinc-950/98 light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light shadow-2xl backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-100 select-none">
          <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Filter by Project
          </div>

          <div className="space-y-0.5 max-h-60 overflow-y-auto focus-custom-scrollbar">
            {/* 1. All Projects */}
            <button
              type="button"
              onClick={() => handleSelect('all')}
              className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                selectedProjectId === 'all'
                  ? 'bg-zinc-800/90 dark:bg-zinc-800/90 light:bg-zinc-200 text-white dark:text-white light:text-black font-semibold'
                  : 'text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:bg-zinc-900/80 dark:hover:bg-zinc-900/80 light:hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Layers className="w-3.5 h-3.5 opacity-60" />
                <span className="truncate">All Projects</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] opacity-60 shrink-0">
                <span>{nonDeletedTasks.length}</span>
                {selectedProjectId === 'all' && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />}
              </div>
            </button>

            {/* 2. Inbox (Standalone) */}
            <button
              type="button"
              onClick={() => handleSelect('standalone')}
              className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                selectedProjectId === 'standalone'
                  ? 'bg-zinc-800/90 dark:bg-zinc-800/90 light:bg-zinc-200 text-white dark:text-white light:text-black font-semibold'
                  : 'text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:bg-zinc-900/80 dark:hover:bg-zinc-900/80 light:hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Inbox className="w-3.5 h-3.5 opacity-60" />
                <span className="truncate">Inbox (No project)</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[11px] opacity-60 shrink-0">
                <span>{standaloneCount}</span>
                {selectedProjectId === 'standalone' && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />}
              </div>
            </button>

            {activeProjects.length > 0 && (
              <div className="h-px bg-subtle-dark dark:bg-subtle-dark light:bg-subtle-light my-1" />
            )}

            {/* 3. Each Project */}
            {activeProjects.map((p) => {
              const pCount = nonDeletedTasks.filter((t) => t.project_id === p.id).length;
              const isSelected = selectedProjectId === p.id;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p.id)}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800/90 dark:bg-zinc-800/90 light:bg-zinc-200 text-white dark:text-white light:text-black font-semibold'
                      : 'text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:bg-zinc-900/80 dark:hover:bg-zinc-900/80 light:hover:bg-zinc-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FolderKanban className="w-3.5 h-3.5 opacity-60" />
                    <span className="truncate">{p.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] opacity-60 shrink-0">
                    <span>{pCount}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
