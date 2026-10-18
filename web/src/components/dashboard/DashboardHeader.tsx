import React from 'react';
import { Play, Pause } from 'lucide-react';

interface DashboardHeaderProps {
  currentDateFormatted: string;
  isTimerRunning: boolean;
  onToggleSprint?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentDateFormatted,
  isTimerRunning,
  onToggleSprint,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
          {isTimerRunning ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              In Sprint
            </span>
          ) : null}
          {isTimerRunning && <span className="opacity-40">·</span>}
          <span className="tracking-wide uppercase text-[10px]">
            {currentDateFormatted}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white dark:text-white light:text-black">
          Stay in flow
        </h1>
      </div>

      <button
        onClick={onToggleSprint}
        className={`h-9 px-4 rounded-full text-xs font-medium flex items-center gap-2 transition-all cursor-pointer active:scale-[0.85] ${isTimerRunning
          ? 'bg-hover-dark dark:bg-hover-dark light:bg-hover-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-white dark:hover:text-white light:hover:text-black hover:border-zinc-600'
          : 'bg-white dark:bg-white text-black light:bg-black light:text-white hover:opacity-90 shadow-sm'
          }`}
        aria-label={isTimerRunning ? 'Pause focus sprint' : 'Start focus sprint'}
      >
        {isTimerRunning ? (
          <>
            <Pause className="w-3.5 h-3.5 fill-current" />
            <span>Pause sprint</span>
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            <span>Start sprint</span>
          </>
        )}
      </button>
    </div>
  );
};
