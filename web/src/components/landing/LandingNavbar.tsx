import React from 'react';
import { useStore } from '../../store/useStore';
import { Moon, Sun, User as UserIcon } from 'lucide-react';

interface LandingNavbarProps {
  onEnterApp: () => void;
  onOpenAuth?: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({ onEnterApp, onOpenAuth }) => {
  const { theme, toggleTheme, user } = useStore();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-[60px] sm:h-[64px] px-5 sm:px-8 md:px-12 flex items-center justify-between select-none bg-transparent border-b border-transparent"
    >
      {/* 1. Left: Minimalist Triangle Icon + Bold Console Font App Name */}
      <div className="flex items-center">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group flex items-center gap-2.5 bg-transparent text-white dark:text-white light:text-black hover:opacity-85 active:scale-95 transition-all cursor-pointer"
          aria-label="Focus Home"
          title="Focus"
        >
          <div className="grid size-7 sm:size-8 place-items-center rounded-lg border border-white/10 dark:border-white/10 light:border-black/10 bg-white/5 dark:bg-white/5 light:bg-white/70">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 transition-transform group-hover:scale-110">
              <polygon points="12,5 21,19 3,19" />
            </svg>
          </div>
          <span className="font-mono font-bold text-xs sm:text-sm uppercase tracking-[0.2em] text-white dark:text-white light:text-black">
            FOCUS
          </span>
        </button>
      </div>

      {/* 2. Right: Two Smaller Icons (Theme & User Sign-in) + Compact Launch Button */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Theme Toggle Icon */}
        <button
          onClick={toggleTheme}
          className="grid size-8 place-items-center rounded-lg border border-white/10 dark:border-white/10 light:border-black/10 bg-white/5 dark:bg-white/5 light:bg-white/60 text-zinc-400 dark:text-zinc-400 light:text-zinc-700 hover:text-white dark:hover:text-white light:hover:text-black active:scale-95 transition-all cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* User Icon (Sign In / Account) */}
        <button
          onClick={onOpenAuth}
          className="grid size-8 place-items-center rounded-lg border border-white/10 dark:border-white/10 light:border-black/10 bg-white/5 dark:bg-white/5 light:bg-white/60 text-zinc-400 dark:text-zinc-400 light:text-zinc-700 hover:text-white dark:hover:text-white light:hover:text-black active:scale-95 transition-all cursor-pointer"
          title={user ? (user.username || user.full_name || 'Account') : 'Sign In'}
          aria-label="Sign in"
        >
          <UserIcon className="w-3.5 h-3.5" />
        </button>

        {/* Launch Button (Reduced size & compact pill) */}
        <button
          onClick={onEnterApp}
          className="group inline-flex h-8 items-center gap-1.5 px-3.5 sm:px-4 rounded-full bg-white dark:bg-white light:bg-black text-black dark:text-black light:text-white text-[11px] font-mono font-bold uppercase tracking-wider transition-all hover:scale-[1.03] active:scale-95 cursor-pointer shadow-xs ml-1"
        >
          <span>Launch</span>
          <span className="text-[12px] transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      </div>
    </header>
  );
};
