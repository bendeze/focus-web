import React, { useState, useRef, useEffect } from 'react';
import { FolderKanban, Inbox, ChevronDown, Check } from 'lucide-react';
import type { Project } from '../../types';

interface ProjectPickerProps {
  projects: Project[];
  value: string; // project_id or '' for inbox
  onChange: (projectId: string) => void;
  className?: string;
  placeholder?: string;
  size?: 'sm' | 'md';
}

export const ProjectPicker: React.FC<ProjectPickerProps> = ({
  projects,
  value,
  onChange,
  className = '',
  placeholder = 'Inbox',
  size = 'sm',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeProjects = projects.filter((p) => !p.is_deleted);
  const selectedProject = activeProjects.find((p) => p.id === value);

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

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  const isSmall = size === 'sm';

  return (
    <div className={`relative ${isSmall ? 'inline-block' : 'w-full'} ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`bg-hover-dark dark:bg-hover-dark light:bg-hover-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-white dark:hover:text-white light:hover:text-black hover:border-zinc-700 dark:hover:border-zinc-700 light:hover:border-zinc-400 transition-all flex items-center cursor-pointer ${
          isSmall
            ? 'h-7 px-2.5 rounded-lg text-[11px] gap-1.5 max-w-[160px]'
            : 'w-full h-9 px-3 rounded-xl text-xs justify-between'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedProject ? (
            <FolderKanban className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-zinc-400 dark:text-zinc-400 light:text-zinc-500 shrink-0`} />
          ) : (
            <Inbox className={`${isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-zinc-400 dark:text-zinc-400 light:text-zinc-500 shrink-0`} />
          )}
          <span className="truncate">{selectedProject ? selectedProject.title : placeholder}</span>
        </div>
        <ChevronDown
          className={`w-3 h-3 opacity-50 shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Modern Popover Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-1.5 z-50 p-1.5 rounded-2xl bg-zinc-950/98 dark:bg-zinc-950/98 light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light shadow-2xl backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-100 select-none ${
            isSmall ? 'w-52' : 'w-full min-w-[220px]'
          }`}
        >
          <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            Assign Project
          </div>

          <div className="space-y-0.5 max-h-48 overflow-y-auto focus-custom-scrollbar">
            {/* 1. Inbox (No Project) */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                !value
                  ? 'bg-zinc-800/90 dark:bg-zinc-800/90 light:bg-hover-light text-white dark:text-white light:text-black font-semibold'
                  : 'text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:bg-zinc-900/80 dark:hover:bg-zinc-900/80 light:hover:bg-hover-light'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Inbox className="w-3.5 h-3.5 opacity-60 text-zinc-400 dark:text-zinc-400 light:text-zinc-500" />
                <span className="truncate">Inbox (Standalone)</span>
              </div>
              {!value && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />}
            </button>

            {activeProjects.length > 0 && (
              <div className="h-px bg-subtle-dark dark:bg-subtle-dark light:border-subtle-light my-1" />
            )}

            {/* 2. Projects List */}
            {activeProjects.map((p) => {
              const isSelected = value === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelect(p.id)}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800/90 dark:bg-zinc-800/90 light:bg-hover-light text-white dark:text-white light:text-black font-semibold'
                      : 'text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:bg-zinc-900/80 dark:hover:bg-zinc-900/80 light:hover:bg-hover-light'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FolderKanban className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-400 light:text-zinc-500 opacity-80" />
                    <span className="truncate">{p.title}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
