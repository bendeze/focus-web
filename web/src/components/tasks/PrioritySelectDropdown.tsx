import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, Check } from 'lucide-react';

interface PrioritySelectDropdownProps {
  selectedPriority: string;
  onSelectPriority: (priority: string) => void;
}

const PRIORITIES = [
  { id: 'all', label: 'All Priorities', color: 'text-zinc-400' },
  { id: 'urgent', label: 'Urgent', color: 'text-red-400' },
  { id: 'high', label: 'High', color: 'text-amber-400' },
  { id: 'medium', label: 'Medium', color: 'text-zinc-300' },
  { id: 'low', label: 'Low', color: 'text-zinc-500' },
];

export const PrioritySelectDropdown: React.FC<PrioritySelectDropdownProps> = ({
  selectedPriority,
  onSelectPriority,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const currentOption = PRIORITIES.find((p) => p.id === selectedPriority) || PRIORITIES[0];

  const handleSelect = (id: string) => {
    onSelectPriority(id);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-xs" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`h-8 px-3 rounded-full border flex items-center gap-1.5 transition-all cursor-pointer font-medium ${
          selectedPriority !== 'all'
            ? 'bg-white dark:bg-white text-black font-semibold border-white shadow-xs'
            : 'bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-white text-zinc-300 dark:text-zinc-300 light:text-zinc-700 border-subtle-dark dark:border-subtle-dark light:border-subtle-light hover:text-white dark:hover:text-white light:hover:text-black'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Filter className="w-3.5 h-3.5 shrink-0 opacity-80" />
        <span>{selectedPriority === 'all' ? 'Priority' : currentOption.label}</span>
        <ChevronDown className={`w-3 h-3 opacity-60 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-44 p-1.5 rounded-2xl bg-zinc-950/98 dark:bg-zinc-950/98 light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light shadow-2xl backdrop-blur-2xl animate-in fade-in-0 zoom-in-95 duration-100 select-none">
          <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Priority Level
          </div>
          <div className="space-y-0.5">
            {PRIORITIES.map((pri) => {
              const isSelected = selectedPriority === pri.id;
              return (
                <button
                  key={pri.id}
                  type="button"
                  onClick={() => handleSelect(pri.id)}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800/90 dark:bg-zinc-800/90 light:bg-zinc-200 text-white dark:text-white light:text-black font-semibold'
                      : 'text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:bg-zinc-900/80 dark:hover:bg-zinc-900/80 light:hover:bg-zinc-100'
                  }`}
                >
                  <span className={isSelected ? 'font-semibold' : pri.color}>{pri.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
