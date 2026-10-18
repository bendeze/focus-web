import React, { useState, useEffect, useRef } from 'react';
import type { Project } from '../../types';
import {
  ArrowLeft,
  ChevronDown,
  ListTodo,
  Check,
  LayoutGrid,
  Search,
  Pencil,
} from 'lucide-react';

interface AnalyticsHeaderProps {
  currentProject: Project | null;
  activeProjects: Project[];
  analyticsProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onBackToProjects: () => void;
  onViewBacklog: (projectId: string) => void;
  onEditProject?: (project: Project) => void;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  currentProject,
  activeProjects,
  analyticsProjectId,
  onSelectProject,
  onBackToProjects,
  onViewBacklog,
  onEditProject,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const filteredProjects = activeProjects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 select-none">
      <div className="flex flex-col gap-2">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
          <button
            onClick={onBackToProjects}
            className="flex items-center gap-1 hover:text-white dark:hover:text-white light:hover:text-black transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Projects</span>
          </button>
          <span className="opacity-40">/</span>
          <span className="tracking-wide uppercase text-[10px] text-zinc-400 dark:text-zinc-400 light:text-zinc-600">
            {currentProject ? currentProject.title : 'All Workspace Analytics'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white dark:text-white light:text-black">
            {currentProject ? currentProject.title : 'Productivity Analytics'}
          </h1>
          {currentProject && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-zinc-100 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 border border-subtle-dark dark:border-subtle-dark light:border-subtle-light">
                {currentProject.status || 'Active'}
              </span>
              {onEditProject && (
                <button
                  onClick={() => onEditProject(currentProject)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black hover:bg-zinc-800/70 dark:hover:bg-zinc-800/70 light:hover:bg-zinc-200/70 transition-all cursor-pointer"
                  title="Edit project details"
                  aria-label="Edit project details"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {currentProject?.description && (
          <p className="text-xs text-zinc-400 dark:text-zinc-400 light:text-zinc-600 max-w-2xl line-clamp-2">
            {currentProject.description}
          </p>
        )}
      </div>

      {/* Right Action Bar: Modern Project Switcher & View Backlog */}
      <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
        {/* Modern Project Switcher Dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`h-9 px-3.5 rounded-full bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-zinc-100 hover:bg-zinc-800/90 dark:hover:bg-zinc-800/90 light:hover:bg-zinc-200 border text-xs font-medium transition-all cursor-pointer flex items-center gap-2.5 shadow-xs active:scale-95 ${
              isOpen
                ? 'border-emerald-500/50 ring-2 ring-emerald-500/20 text-white dark:text-white light:text-black'
                : 'border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-zinc-200 dark:text-zinc-200 light:text-zinc-800 hover:border-zinc-700 dark:hover:border-zinc-700 light:hover:border-zinc-300'
            }`}
          >
            {currentProject ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            ) : (
              <LayoutGrid className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            )}
            <span className="font-semibold text-white dark:text-white light:text-black truncate max-w-[150px]">
              {currentProject ? currentProject.title : 'All Workspace'}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-emerald-400' : ''
              }`}
            />
          </button>

          {/* Modern Glassmorphic Dropdown Menu */}
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-zinc-950/98 dark:bg-zinc-950/98 light:bg-white/98 backdrop-blur-xl border border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200/80 shadow-2xl p-2 z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150">
              {/* Optional Search if more than 3 projects */}
              {activeProjects.length > 3 && (
                <div className="relative px-1 pt-1 pb-1.5">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Filter projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 text-xs rounded-xl bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-zinc-100 border border-zinc-800/60 dark:border-zinc-800/60 light:border-zinc-200 text-white dark:text-white light:text-black focus:outline-none focus:border-zinc-600"
                    autoFocus
                  />
                </div>
              )}

              {/* Option 1: All Workspace */}
              <button
                type="button"
                onClick={() => {
                  onSelectProject(null);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                  !analyticsProjectId
                    ? 'bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-100 text-white dark:text-white light:text-black font-semibold'
                    : 'text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black hover:bg-zinc-900/50 dark:hover:bg-zinc-900/50 light:hover:bg-zinc-100/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-200 flex items-center justify-center text-zinc-400">
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span>All Workspace</span>
                    <span className="text-[10px] text-zinc-500 font-normal">All projects & tasks</span>
                  </div>
                </div>
                {!analyticsProjectId && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </button>

              <div className="h-px bg-zinc-800/60 dark:bg-zinc-800/60 light:bg-zinc-200 mx-1 my-0.5" />

              {/* Section Header */}
              <div className="px-2 pt-1 pb-0.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 flex items-center justify-between">
                <span>Projects ({filteredProjects.length})</span>
              </div>

              {/* Projects List */}
              <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5 pr-0.5">
                {filteredProjects.length === 0 ? (
                  <div className="py-4 text-center text-xs text-zinc-500">
                    No matching projects
                  </div>
                ) : (
                  filteredProjects.map((p) => {
                    const isSelected = analyticsProjectId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSelectProject(p.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-100 text-white dark:text-white light:text-black font-semibold'
                            : 'text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black hover:bg-zinc-900/50 dark:hover:bg-zinc-900/50 light:hover:bg-zinc-100/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isSelected
                                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                                : 'bg-zinc-600 dark:bg-zinc-600 light:bg-zinc-400'
                            }`}
                          />
                          <div className="flex flex-col text-left truncate">
                            <span className="truncate">{p.title}</span>
                            {p.description && (
                              <span className="text-[10px] text-zinc-500 truncate font-normal">
                                {p.description}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {currentProject && (
          <button
            onClick={() => onViewBacklog(currentProject.id)}
            className="h-9 px-4 rounded-full text-xs font-medium flex items-center gap-2 bg-white dark:bg-white text-black light:bg-black light:text-white hover:opacity-90 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>View Backlog</span>
          </button>
        )}
      </div>
    </div>
  );
};
