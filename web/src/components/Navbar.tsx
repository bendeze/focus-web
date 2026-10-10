import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import type { Project } from '../types';

interface NavbarProps {
  projects?: Project[];
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenTasksSheet?: () => void;
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
}) => {
  const {
    user,
    activeTab,
    setActiveTab,
  } = useStore();

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
    <header className="sticky top-0 z-50 w-full bg-black/95 backdrop-blur-md text-white py-5 px-8 md:px-14 flex items-center justify-between select-none border-b border-zinc-900/50 transition-colors duration-300">
      
      {/* 1. Left: User Avatar */}
      <div className="flex items-center">
        {user ? (
          <button
            onClick={onOpenProfile}
            className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 hover:opacity-90 transition-opacity focus:outline-none ring-1 ring-zinc-700/50 cursor-pointer"
            title="User Profile & Settings"
          >
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username || 'User'}
                className="w-full h-full object-cover grayscale"
              />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80&grayscale"
                alt={user.username || 'User'}
                className="w-full h-full object-cover grayscale brightness-95"
              />
            )}
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 hover:opacity-90 transition-opacity focus:outline-none ring-1 ring-zinc-700/50 cursor-pointer"
            title="Sign In"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80&grayscale"
              alt="Sign in"
              className="w-full h-full object-cover grayscale brightness-95"
            />
          </button>
        )}
      </div>

      {/* 2. Center: Tasks | Focus | Projects */}
      <nav
        className={`relative flex items-center h-8 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isScrolledDown ? 'gap-12 md:gap-20' : 'gap-8 md:gap-14'
        }`}
      >
        {/* Left item: Tasks (expands outward when scrolling down) */}
        <button
          onClick={() => setActiveTab('tasks')}
          className={`text-xs uppercase font-mono tracking-[0.15em] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer font-light transform ${
            isScrolledDown ? '-translate-x-1 md:-translate-x-2' : 'translate-x-0'
          } ${
            activeTab === 'tasks'
              ? 'text-white font-light'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Tasks
        </button>

        {/* Center item: Focus (animates smoothly above or below Tasks/Projects based on scroll direction) */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`text-xs uppercase tracking-[0.2em] text-white font-semibold hover:opacity-90 hover:font-bold transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer focus:outline-none transform ${
            isScrolledDown
              ? 'translate-y-3.5 font-normal opacity-90'
              : '-translate-y-3.5 font-normal opacity-100'
          } ${activeTab === 'dashboard' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
        >
          Focus
        </button>

        {/* Right item: Projects (expands outward when scrolling down) */}
        <button
          onClick={() => setActiveTab('projects')}
          className={`text-xs uppercase font-mono tracking-[0.15em] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer font-light transform ${
            isScrolledDown ? 'translate-x-1 md:translate-x-2' : 'translate-x-0'
          } ${
            activeTab === 'projects'
              ? 'text-white font-light'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Projects
        </button>
      </nav>

      {/* 3. Right: Triangle Icon Button */}
      <div className="flex items-center">
        <button
          onClick={onOpenTasksSheet}
          className="w-8 h-8 flex items-center justify-center bg-transparent text-white dark:text-white light:text-black hover:opacity-75 active:scale-95 transition-all focus:outline-none cursor-pointer"
          title="Action"
        >
          <TriangleIcon className="w-6 h-6" />
        </button>
      </div>

    </header>
  );
};
