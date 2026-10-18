import React from 'react';
import { Kbd } from '../ui/kbd';

export const DashboardFooter: React.FC = () => {
  return (
    <footer className="pt-5 pb-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-light text-zinc-500 dark:text-zinc-500 light:text-zinc-400 border-t border-subtle-dark/40 dark:border-subtle-dark/40 light:border-subtle-light/60 select-none">
      {/* Live sync telemetry */}
      <div className="flex items-center gap-2">
        <span className="tracking-wider uppercase text-zinc-400 dark:text-zinc-400 light:text-zinc-600 font-normal">
          Personal Workspace
        </span>
        <span className="opacity-30">·</span>
        <span className="tracking-wide">All changes saved</span>
      </div>

      {/* Keyboard shortcut hints */}
      <div className="hidden md:flex items-center gap-3 text-zinc-500 dark:text-zinc-500 light:text-zinc-400">
        <div className="flex items-center gap-1.5">
          <Kbd>Space</Kbd>
          <span>toggle timer</span>
        </div>
        <span className="opacity-30">·</span>
        <div className="flex items-center gap-1.5">
          <Kbd>Z</Kbd>
          <span>zen mode</span>
        </div>
      </div>

      {/* Quiet brand tagline */}
      <div className="tracking-wide text-zinc-500 dark:text-zinc-500 light:text-zinc-400">
        Less noise. More meaningful work.
      </div>
    </footer>
  );
};
