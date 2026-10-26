import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { Project } from '../types';
import { Shield } from 'lucide-react';

interface NavbarProps {
  projects?: Project[];
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenTasksSheet?: () => void;
  isSettingsOpen?: boolean;
  onToggleSettings?: () => void;
}

// Minimalist Triangle Icon (white in dark mode, black in light mode on transparent bg)
const TriangleIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <polygon points="12,5 21,19 3,19" />
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenProfile,
  onOpenTasksSheet,
  isSettingsOpen,
  onToggleSettings,
}) => {
  const {
    user,
    isAdmin,
    activeTab,
    setActiveTab,
  } = useStore();

  const [guestLetter] = useState(() => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return alphabet[Math.floor(Math.random() * alphabet.length)];
  });

  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // When at the very top of the page, always go up
      if (currentScrollY <= 15) {
        setIsScrolledDown(false);
      } else if (currentScrollY > lastScrollY.current + 5) {
        // Scrolling down
        setIsScrolledDown(true);
      } else if (currentScrollY < lastScrollY.current - 5) {
        // Scrolling up
        setIsScrolledDown(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent backdrop-blur-md text-white py-5 px-8 md:px-14 flex items-center justify-between select-none border-b border-transparent dark:border-zinc-900/50 transition-colors duration-300">
      
      {/* 1. Left: User Avatar */}
      <div className="flex items-center">
        {user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenProfile}
              className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-zinc-50 border border-subtle-dark dark:border-subtle-dark light:border-transparent hover:border-zinc-700 dark:hover:border-zinc-700 light:hover:border-zinc-300 hover:opacity-90 active:scale-95 transition-all focus:outline-none cursor-pointer"
              title={`${user.username || user.full_name || 'User'} · Profile`}
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username || user.full_name || 'User'}
                  className="w-full h-full object-cover grayscale"
                />
              ) : (
                <span className="font-mono text-sm font-semibold text-zinc-300 dark:text-zinc-300 light:text-zinc-700 select-none">
                  {(user.username || user.full_name || user.email || 'U').trim().charAt(0).toUpperCase()}
                </span>
              )}
            </button>
            {isAdmin && (
              <span
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 text-zinc-300"
                title="Logged in with Administrator Privileges"
              >
                <Shield className="w-2.5 h-2.5 text-emerald-400" />
                <span>Admin</span>
              </span>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-zinc-100 border border-subtle-dark dark:border-subtle-dark light:border-subtle-light hover:border-zinc-700 dark:hover:border-zinc-700 light:hover:border-zinc-300 hover:opacity-90 active:scale-95 transition-all focus:outline-none cursor-pointer"
            title="Sign In / Register"
          >
            <span className="font-mono text-xs font-semibold text-zinc-400 dark:text-zinc-400 light:text-zinc-600 select-none">
              {guestLetter}
            </span>
          </button>
        )}
      </div>

      {/* 2. Center: Tasks | Focus | Projects | (Admin if privileged) */}
      <nav
        className={`relative flex items-center h-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolledDown ? 'gap-8 md:gap-14' : 'gap-6 md:gap-10'
        }`}
      >
        {/* Left item: Tasks */}
        <button
          onClick={() => setActiveTab('tasks')}
          className={`text-xs uppercase font-mono tracking-[0.15em] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer font-light transform ${
            isScrolledDown ? '-translate-x-1 md:-translate-x-2' : 'translate-x-0'
          } ${
            activeTab === 'tasks'
              ? 'text-black dark:text-white font-light'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Tasks
        </button>

        {/* Center item: Focus */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`text-xs uppercase tracking-[0.2em] font-semibold hover:opacity-90 hover:font-bold transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer focus:outline-none transform ${
            isScrolledDown
              ? 'translate-y-3.5 font-normal opacity-90'
              : '-translate-y-3.5 font-normal opacity-100'
          } ${activeTab === 'dashboard' ? 'text-black dark:text-white' : 'text-zinc-400 hover:text-white'}`}
        >
          Focus
        </button>

        {/* Right item: Projects */}
        <button
          onClick={() => setActiveTab('projects')}
          className={`text-xs uppercase font-mono tracking-[0.15em] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer font-light transform ${
            isScrolledDown ? 'translate-x-1 md:translate-x-2' : 'translate-x-0'
          } ${
            activeTab === 'projects'
              ? 'text-black dark:text-white font-light'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Projects
        </button>

        {/* Optional Admin Link if logged in as Admin */}
        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`text-xs uppercase font-mono tracking-[0.15em] transition-all duration-300 cursor-pointer font-light flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
              activeTab === 'admin'
                ? 'bg-white text-black font-semibold'
                : 'text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800'
            }`}
            title="System Administrator Dashboard"
          >
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Admin</span>
          </button>
        )}
      </nav>

      {/* 3. Right: Triangle Icon Button */}
      <div className="flex items-center">
        <button
          onClick={onToggleSettings || onOpenTasksSheet}
          className="w-8 h-8 flex items-center justify-center bg-transparent text-white dark:text-white light:text-black hover:opacity-75 active:scale-95 transition-all focus:outline-none cursor-pointer"
          title={isSettingsOpen ? 'Close settings' : 'Settings & workspace controls'}
          aria-label={isSettingsOpen ? 'Close settings' : 'Open settings'}
        >
          <TriangleIcon
            className={`w-5 h-5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isSettingsOpen ? 'rotate-180' : 'rotate-0'
            }`}
          />
        </button>
      </div>

    </header>
  );
};
