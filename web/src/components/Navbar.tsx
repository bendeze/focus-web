import React from 'react';
import { useStore } from '../store/useStore';
import {
  Sun,
  Moon,
  User as UserIcon,
  Flame,
  CheckSquare,
  FolderKanban,
  BarChart3,
  Timer,
  LayoutDashboard,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenProfile }) => {
  const {
    user,
    theme,
    toggleTheme,
    activeTab,
    setActiveTab,
    isTimerRunning,
    remainingSeconds,
  } = useStore();

  const formatMinSec = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-light-border dark:border-dark-border bg-light-bg/90 dark:bg-dark-bg/90 backdrop-glass transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 group text-left focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-light-text dark:bg-dark-text flex items-center justify-center transition-transform group-hover:scale-105">
              <Timer className="w-4 h-4 text-light-bg dark:text-dark-bg stroke-[2.5]" />
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-brand text-light-text dark:text-dark-text select-none">
              FOCUS
            </span>
          </button>

          {/* Active Timer Pill if in background */}
          {isTimerRunning && activeTab !== 'focus' && (
            <button
              onClick={() => setActiveTab('focus')}
              className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-dark-fill dark:bg-dark-fill text-white text-xs font-mono font-bold tracking-wider animate-pulse-subtle hover:opacity-90"
            >
              <Flame className="w-3.5 h-3.5 fill-white text-white" />
              <span className="tabular-nums">{formatMinSec(remainingSeconds)}</span>
            </button>
          )}
        </div>

        {/* Center: Monochromatic Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-light-surface dark:bg-dark-surface p-1 rounded-full border border-light-border dark:border-dark-border">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-badge transition-all ${
              activeTab === 'dashboard'
                ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg shadow-sm'
                : 'text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            DASHBOARD
          </button>

          <button
            onClick={() => setActiveTab('focus')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-badge transition-all ${
              activeTab === 'focus'
                ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg shadow-sm'
                : 'text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            FOCUS
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-badge transition-all ${
              activeTab === 'tasks'
                ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg shadow-sm'
                : 'text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            TASKS
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-badge transition-all ${
              activeTab === 'projects'
                ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg shadow-sm'
                : 'text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            PROJECTS
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-badge transition-all ${
              activeTab === 'analytics'
                ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg shadow-sm'
                : 'text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            METRICS
          </button>
        </nav>

        {/* Right: Theme Toggle & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-full flex items-center justify-center border border-light-border dark:border-dark-border text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text hover:bg-light-surface dark:hover:bg-dark-surface transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Auth / Profile */}
          {user ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:border-light-text dark:hover:border-dark-text transition-all group"
            >
              <div className="w-6 h-6 rounded-full bg-light-fill dark:bg-dark-fill text-light-text dark:text-dark-text flex items-center justify-center text-xs font-bold uppercase">
                {user.full_name ? user.full_name.charAt(0) : (user.username || user.email || 'U').charAt(0)}
              </div>
              <span className="text-xs font-medium text-light-text dark:text-dark-text max-w-[100px] truncate">
                {user.full_name || user.username || user.email?.split('@')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg text-xs font-bold tracking-wider uppercase hover:opacity-90 transition-opacity"
            >
              <UserIcon className="w-3.5 h-3.5" />
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-light-border dark:border-dark-border bg-light-surface/90 dark:bg-dark-surface/90 py-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-wider ${
            activeTab === 'dashboard' ? 'text-light-text dark:text-dark-text' : 'text-light-textMuted dark:text-dark-textMuted'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          HOME
        </button>
        <button
          onClick={() => setActiveTab('focus')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-wider ${
            activeTab === 'focus' ? 'text-light-text dark:text-dark-text' : 'text-light-textMuted dark:text-dark-textMuted'
          }`}
        >
          <Timer className="w-4 h-4" />
          FOCUS
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-wider ${
            activeTab === 'tasks' ? 'text-light-text dark:text-dark-text' : 'text-light-textMuted dark:text-dark-textMuted'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          TASKS
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-wider ${
            activeTab === 'projects' ? 'text-light-text dark:text-dark-text' : 'text-light-textMuted dark:text-dark-textMuted'
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          PROJECTS
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 text-[10px] font-bold tracking-wider ${
            activeTab === 'analytics' ? 'text-light-text dark:text-dark-text' : 'text-light-textMuted dark:text-dark-textMuted'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          STATS
        </button>
      </div>
    </header>
  );
};
