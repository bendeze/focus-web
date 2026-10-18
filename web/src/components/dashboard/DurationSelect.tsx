import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Clock } from 'lucide-react';

interface DurationOption {
  minutes: number;
  label: string;
  tag?: string;
}

const DURATION_OPTIONS: DurationOption[] = [
  { minutes: 10, label: '10 minutes' },
  { minutes: 15, label: '15 minutes' },
  { minutes: 20, label: '20 minutes' },
  { minutes: 25, label: '25 minutes', tag: 'Standard' },
  { minutes: 30, label: '30 minutes' },
  { minutes: 40, label: '40 minutes' },
  { minutes: 45, label: '45 minutes', tag: 'Deep Work' },
  { minutes: 50, label: '50 minutes' },
  { minutes: 60, label: '60 minutes', tag: '1 Hour' },
  { minutes: 75, label: '75 minutes' },
  { minutes: 90, label: '90 minutes', tag: 'Extended' },
  { minutes: 120, label: '120 minutes', tag: '2 Hours' },
  { minutes: 180, label: '180 minutes', tag: '3 Hours' },
];

interface DurationSelectProps {
  value: number;
  isCustom: boolean;
  onChange: (minutes: number) => void;
}

export const DurationSelect: React.FC<DurationSelectProps> = ({
  value,
  isCustom,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState(value.toString());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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

  // Keep input in sync with current value when opened
  useEffect(() => {
    if (isOpen) {
      setCustomInput(value.toString());
    }
  }, [isOpen, value]);

  const handleCustomSubmit = () => {
    const parsed = parseInt(customInput.trim(), 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 480) {
      onChange(parsed);
      setIsOpen(false);
    }
  };

  const handleSelectOption = (minutes: number) => {
    onChange(minutes);
    setIsOpen(false);
  };

  const isNumericValid = () => {
    const parsed = parseInt(customInput.trim(), 10);
    return !isNaN(parsed) && parsed > 0 && parsed <= 480;
  };

  const isPreset = [5, 15, 25, 45, 60].includes(value);
  const triggerLabel = isCustom || !isPreset ? `${value}m` : 'Custom';
  const isTriggerActive = isCustom || !isPreset || isOpen;

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
          isTriggerActive
            ? 'bg-white dark:bg-white text-black light:bg-black light:text-white shadow-sm'
            : 'opacity-50 hover:opacity-80 bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-zinc-300 dark:text-zinc-300 light:text-zinc-700'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{triggerLabel}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Minimalist Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-56 p-2 rounded-2xl bg-surface-dark/95 dark:bg-surface-dark/95 light:bg-surface-light/95 backdrop-blur-2xl border border-subtle-dark dark:border-subtle-dark light:border-subtle-light shadow-[0_16px_36px_rgba(0,0,0,0.4)] select-none animate-in fade-in-0 zoom-in-95 duration-100">
          
          {/* Quick Custom Input Field */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-hover-dark/70 dark:bg-hover-dark/70 light:bg-hover-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light focus-within:border-zinc-500 transition-colors">
            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-0.5" />
            <input
              type="number"
              min={1}
              max={480}
              placeholder="Minutes..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCustomSubmit();
                }
              }}
              className="w-full bg-transparent text-xs font-semibold text-white dark:text-white light:text-black placeholder:text-zinc-500 outline-none tabular-nums"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCustomSubmit}
              disabled={!isNumericValid()}
              className="h-6 px-2.5 rounded-lg bg-white dark:bg-white text-black light:bg-black light:text-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-30 hover:opacity-90 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              Set
            </button>
          </div>

          <div className="h-px bg-subtle-dark dark:bg-subtle-dark light:bg-subtle-light my-1.5" />

          {/* Scrollable Duration Options */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 pr-0.5 focus-custom-scrollbar">
            {DURATION_OPTIONS.map((option) => {
              const isSelected = value === option.minutes;

              return (
                <div
                  key={option.minutes}
                  onClick={() => handleSelectOption(option.minutes)}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-white dark:text-white light:text-black font-semibold'
                      : 'text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:bg-hover-dark/60 dark:hover:bg-hover-dark/60 light:hover:bg-hover-light/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{option.label}</span>
                    {option.tag && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 dark:bg-white/5 light:bg-black/5 text-zinc-400 font-normal">
                        {option.tag}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
