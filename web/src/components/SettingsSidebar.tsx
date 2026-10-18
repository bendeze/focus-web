import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { soundManager } from '../utils/sound';
import { Kbd } from './ui/kbd';
import {
  X,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Play,
  User as UserIcon,
  LogOut,
  Sliders,
  Keyboard,
  ArrowRight,
} from 'lucide-react';

interface SettingsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
  onOpenRegister?: () => void;
}

export const SettingsSidebar: React.FC<SettingsSidebarProps> = ({
  isOpen,
  onClose,
  onOpenProfile,
  onOpenAuth,
  onOpenRegister,
}) => {
  const {
    user,
    theme,
    toggleTheme,
    isZenMode,
    setZenMode,
    activeTab,
    setActiveTab,
    logout,
    addToast,
  } = useStore();

  // Local settings synced with localStorage
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('pomodoro_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [dndEnabled, setDndEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('pomodoro_dnd_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [focusDuration, setFocusDuration] = useState<number>(() => {
    const saved = localStorage.getItem('pomodoro_focus_duration');
    return saved ? parseInt(saved, 10) : 25;
  });

  const [breakDuration, setBreakDuration] = useState<number>(() => {
    const saved = localStorage.getItem('pomodoro_break_duration');
    return saved ? parseInt(saved, 10) : 5;
  });

  // Sync state whenever drawer opens
  useEffect(() => {
    if (isOpen) {
      const savedSound = localStorage.getItem('pomodoro_sound_enabled');
      if (savedSound !== null) setSoundEnabled(savedSound === 'true');
      const savedDnd = localStorage.getItem('pomodoro_dnd_enabled');
      if (savedDnd !== null) setDndEnabled(savedDnd === 'true');
      const savedFocus = localStorage.getItem('pomodoro_focus_duration');
      if (savedFocus) setFocusDuration(parseInt(savedFocus, 10));
      const savedBreak = localStorage.getItem('pomodoro_break_duration');
      if (savedBreak) setBreakDuration(parseInt(savedBreak, 10));
    }
  }, [isOpen]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Dispatch settings change notification
  const notifySettingsChanged = useCallback(() => {
    window.dispatchEvent(new CustomEvent('focus-settings-changed'));
  }, []);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('pomodoro_sound_enabled', next.toString());
    notifySettingsChanged();
    if (next) {
      soundManager.playStart();
      addToast('Sound cues enabled', 'info');
    } else {
      addToast('Sound cues muted', 'info');
    }
  };

  const handleToggleDnd = () => {
    const next = !dndEnabled;
    setDndEnabled(next);
    localStorage.setItem('pomodoro_dnd_enabled', next.toString());
    notifySettingsChanged();
    addToast(next ? 'Do Not Disturb active during sprints' : 'Do Not Disturb disabled', 'info');
  };

  const handleChangeFocusDuration = (duration: number) => {
    setFocusDuration(duration);
    localStorage.setItem('pomodoro_focus_duration', duration.toString());
    notifySettingsChanged();
    addToast(`Default focus duration set to ${duration}m`, 'success');
  };

  const handleChangeBreakDuration = (duration: number) => {
    setBreakDuration(duration);
    localStorage.setItem('pomodoro_break_duration', duration.toString());
    notifySettingsChanged();
    addToast(`Default break duration set to ${duration}m`, 'success');
  };

  const handleToggleZen = () => {
    const nextZen = !isZenMode;
    setZenMode(nextZen);
    addToast(nextZen ? 'Zen mode activated' : 'Zen mode deactivated', 'info');
  };

  const handleNavigate = (tab: typeof activeTab) => {
    setActiveTab(tab);
    onClose();
  };

  const handleTestSound = () => {
    soundManager.playStart();
    addToast('Audio chime preview', 'info');
  };

  const initialLetter = user
    ? (user.username || user.full_name || user.email || 'U').trim().charAt(0).toUpperCase()
    : 'G';

  return (
    <>
      {/* 1. Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-50 dark:bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 2. Slide-out Drawer Panel */}
      <aside
        role="dialog"
        aria-label="Settings and Preferences"
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] bg-zinc-950/95 dark:bg-zinc-950/95 light:bg-white/98 text-white dark:text-white light:text-zinc-900 border-l border-zinc-900 dark:border-zinc-900 light:border-zinc-200 shadow-2xl backdrop-blur-xl flex flex-col justify-between transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-900/80 dark:border-zinc-900/80 light:border-zinc-200/80">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-3 h-3 text-zinc-400 dark:text-zinc-400 light:text-zinc-600" />
            <h2 className="text-xs font-light tracking-wider uppercase font-mono text-zinc-200 dark:text-zinc-200 light:text-zinc-800">
              Settings & Preferences
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Kbd className="hidden sm:inline-flex text-[9px] px-1.5 py-0.5">ESC</Kbd>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-white dark:hover:text-white light:hover:text-black hover:bg-zinc-800/60 dark:hover:bg-zinc-800/60 light:hover:bg-zinc-200/60 transition-colors cursor-pointer"
              aria-label="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
          
          {/* SECTION 1: Appearance & Theme */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 light:text-zinc-400">
              Appearance
            </span>

            {/* Theme Toggle Pill */}
            <div className="p-1 rounded-2xl bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-zinc-100 border border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200 flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (theme !== 'dark') toggleTheme();
                }}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-zinc-200'
                }`}
              >
                <Moon className="w-3 h-3" />
                <span>Obsidian Dark</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (theme !== 'light') toggleTheme();
                }}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-white text-black shadow-sm font-semibold'
                    : 'text-zinc-400 dark:text-zinc-400 light:text-zinc-600 hover:text-zinc-200'
                }`}
              >
                <Sun className="w-3 h-3" />
                <span>Minimal Stone</span>
              </button>
            </div>

            {/* Zen Mode Switch */}
            <div className="p-3 rounded-2xl bg-zinc-900/40 dark:bg-zinc-900/40 light:bg-zinc-50 border border-zinc-800/60 dark:border-zinc-800/60 light:border-zinc-200/60 flex items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-medium text-zinc-200 dark:text-zinc-200 light:text-zinc-800">
                    Zen Mode
                  </span>
                  <Kbd className="text-[9px]">Z</Kbd>
                </div>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
                  Hides navbar and distracting ambient controls
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleZen}
                className={`relative inline-flex h-3 w-9 shrink-0 cursor-pointer rounded-full border-0.5 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isZenMode ? 'bg-emerald-500' : 'bg-zinc-700/60 dark:bg-zinc-700/60 light:bg-zinc-300'
                }`}
                role="switch"
                aria-checked={isZenMode}
              >
                <span
                  className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isZenMode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* SECTION 2: Timer & Focus Preferences */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 light:text-zinc-400">
              Timer & Audio
            </span>

            {/* Focus Duration Quick Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
                  Default Sprint Duration
                </span>
                <span className="text-[10px] font-mono font-medium text-emerald-400">
                  {focusDuration} min
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[15, 25, 45, 60].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => handleChangeFocusDuration(dur)}
                    className={`py-1 rounded-xl text-[9px] font-mono font-medium transition-all cursor-pointer ${
                      focusDuration === dur
                        ? 'bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200 text-white dark:text-white light:text-black border border-zinc-700 dark:border-zinc-700 light:border-zinc-300'
                        : 'bg-zinc-900/40 dark:bg-zinc-900/40 light:bg-zinc-100 text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black border border-zinc-800/50 dark:border-zinc-800/50 light:border-zinc-200'
                    }`}
                  >
                    {dur}m
                  </button>
                ))}
              </div>
            </div>

            {/* Break Duration Quick Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
                  Default Break Duration
                </span>
                <span className="text-[10px] font-mono font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-600">
                  {breakDuration} min
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => handleChangeBreakDuration(dur)}
                    className={`py-1 rounded-xl text-[9px] font-mono font-medium transition-all cursor-pointer ${
                      breakDuration === dur
                        ? 'bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200 text-white dark:text-white light:text-black border border-zinc-700 dark:border-zinc-700 light:border-zinc-300'
                        : 'bg-zinc-900/40 dark:bg-zinc-900/40 light:bg-zinc-100 text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black border border-zinc-800/50 dark:border-zinc-800/50 light:border-zinc-200'
                    }`}
                  >
                    {dur}m
                  </button>
                ))}
              </div>
            </div>

            {/* Sound FX Toggle & Preview */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 dark:bg-zinc-900/40 light:bg-zinc-50 border border-zinc-800/60 dark:border-zinc-800/60 light:border-zinc-200/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-xl bg-zinc-800/80 dark:bg-zinc-800/80 light:bg-zinc-200 flex items-center justify-center shrink-0">
                  {soundEnabled ? (
                    <Volume2 className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-3 h-3 text-zinc-500" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-zinc-200 dark:text-zinc-200 light:text-zinc-800">
                    Audio Chimes
                  </span>
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
                    Calm Web Audio harmonic tones
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {soundEnabled && (
                  <button
                    type="button"
                    onClick={handleTestSound}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black hover:bg-zinc-800 dark:hover:bg-zinc-800 light:hover:bg-zinc-200 transition-colors"
                    title="Test chime sound"
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`relative inline-flex h-3 w-9 shrink-0 cursor-pointer rounded-full border-0.5 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    soundEnabled ? 'bg-emerald-500' : 'bg-zinc-700/60 dark:bg-zinc-700/60 light:bg-zinc-300'
                  }`}
                  role="switch"
                  aria-checked={soundEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      soundEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Do Not Disturb Toggle */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/40 dark:bg-zinc-900/40 light:bg-zinc-50 border border-zinc-800/60 dark:border-zinc-800/60 light:border-zinc-200/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-xl bg-zinc-800/80 dark:bg-zinc-800/80 light:bg-zinc-200 flex items-center justify-center shrink-0">
                  {dndEnabled ? (
                    <BellOff className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Bell className="w-3 h-3 text-zinc-500" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-zinc-200 dark:text-zinc-200 light:text-zinc-800">
                    Do Not Disturb
                  </span>
                  <span className="text-[9px] text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
                    Mutes alerts during active sprints
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleDnd}
                className={`relative inline-flex h-3 w-9 shrink-0 cursor-pointer rounded-full border-0.5 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  dndEnabled ? 'bg-emerald-500' : 'bg-zinc-700/60 dark:bg-zinc-700/60 light:bg-zinc-300'
                }`}
                role="switch"
                aria-checked={dndEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    dndEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

          </div>

          {/* SECTION 3: Keyboard Shortcuts */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Keyboard className="w-3 h-3 text-zinc-500" />
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 light:text-zinc-400">
                Shortcuts
              </span>
            </div>

            <div className="rounded-2xl bg-zinc-900/40 dark:bg-zinc-900/40 light:bg-zinc-50 border border-zinc-800/60 dark:border-zinc-800/60 light:border-zinc-200/60 divide-y divide-zinc-900/60 dark:divide-zinc-900/60 light:divide-zinc-200/60 text-[10px]">
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
                  Toggle sprint timer
                </span>
                <Kbd>Space</Kbd>
              </div>
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
                  Toggle Zen mode
                </span>
                <Kbd>Z</Kbd>
              </div>
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <span className="text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
                  Close overlays & drawers
                </span>
                <Kbd>ESC</Kbd>
              </div>
            </div>
          </div>

          {/* SECTION: Quick Navigation */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 light:text-zinc-400">
              Workspace Views
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleNavigate('dashboard')}
                className={`py-2 px-3 rounded-xl text-[9px] font-medium flex items-center justify-between border transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200 text-white dark:text-white light:text-black border-zinc-700 dark:border-zinc-700 light:border-zinc-300'
                    : 'bg-zinc-900/40 dark:bg-zinc-900/40 light:bg-zinc-100 text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black border-zinc-800/50 dark:border-zinc-800/50 light:border-zinc-200'
                }`}
              >
                <span>Focus Hub</span>
                <ArrowRight className="w-3 h-3 text-zinc-500" />
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('tasks')}
                className={`py-2 px-3 rounded-xl text-[9px] font-medium flex items-center justify-between border transition-all cursor-pointer ${
                  activeTab === 'tasks'
                    ? 'bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200 text-white dark:text-white light:text-black border-zinc-700 dark:border-zinc-700 light:border-zinc-300'
                    : 'bg-zinc-900/40 dark:bg-zinc-900/40 light:bg-zinc-100 text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black border-zinc-800/50 dark:border-zinc-800/50 light:border-zinc-200'
                }`}
              >
                <span>Tasks</span>
                <ArrowRight className="w-3 h-3 text-zinc-500" />
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('projects')}
                className={`py-2 px-3 rounded-xl text-[9px] font-medium flex items-center justify-between border transition-all cursor-pointer ${
                  activeTab === 'projects'
                    ? 'bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200 text-white dark:text-white light:text-black border-zinc-700 dark:border-zinc-700 light:border-zinc-300'
                    : 'bg-zinc-900/40 dark:bg-zinc-900/40 light:bg-zinc-100 text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black border-zinc-800/50 dark:border-zinc-800/50 light:border-zinc-200'
                }`}
              >
                <span>Projects</span>
                <ArrowRight className="w-3 h-3 text-zinc-500" />
              </button>
              <button
                type="button"
                onClick={() => handleNavigate('analytics')}
                className={`py-2 px-3 rounded-xl text-[9px] font-medium flex items-center justify-between border transition-all cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200 text-white dark:text-white light:text-black border-zinc-700 dark:border-zinc-700 light:border-zinc-300'
                    : 'bg-zinc-900/40 dark:bg-zinc-900/40 light:bg-zinc-100 text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black border-zinc-800/50 dark:border-zinc-800/50 light:border-zinc-200'
                }`}
              >
                <span>Analytics</span>
                <ArrowRight className="w-3 h-3 text-zinc-500" />
              </button>
            </div>
          </div>

          {/* SECTION 4: Account & Workspace */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 light:text-zinc-400">
              Account & Workspace
            </span>

            {user ? (
              <div className="p-4 rounded-2xl bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-zinc-50 border border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200 border border-zinc-700/60 font-mono font-bold text-sm text-zinc-200 dark:text-zinc-200 light:text-zinc-800">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username || 'User'}
                        className="w-full h-full rounded-full object-cover grayscale"
                      />
                    ) : (
                      <span>{initialLetter}</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-medium text-white dark:text-white light:text-black truncate">
                      {user.full_name || user.username}
                    </span>
                    <span className="text-[9px] text-zinc-500 dark:text-zinc-400 light:text-zinc-500 truncate">
                      {user.email || `@${user.username}`}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2 border-t border-zinc-800/60 dark:border-zinc-800/60 light:border-zinc-200/60">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenProfile?.();
                    }}
                    className="flex-1 py-2 px-2 rounded-xl bg-zinc-800/80 dark:bg-zinc-800/80 light:bg-zinc-200 hover:bg-zinc-700/80 dark:hover:bg-zinc-700/80 light:hover:bg-zinc-300 text-[9px] font-medium text-zinc-200 dark:text-zinc-200 light:text-zinc-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserIcon className="w-3 h-3" />
                    <span>Manage Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      onClose();
                    }}
                    className="py-2 px-3 rounded-xl bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-zinc-100 hover:bg-red-500/10 text-xs font-medium text-zinc-400 hover:text-red-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Log Out"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-900/40 dark:bg-zinc-900/40 light:bg-zinc-50 border border-zinc-800/60 dark:border-zinc-800/60 light:border-zinc-200 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-semibold text-zinc-200 dark:text-zinc-200 light:text-zinc-800">
                    Guest Mode
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
                    Your focus sessions and tasks are stored locally. Sign in to sync across devices.
                  </span>
                </div>

                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuth?.();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-white light:bg-black text-black dark:text-black light:text-white text-[9px] font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRegister?.();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-zinc-800/80 dark:bg-zinc-800/80 light:bg-zinc-200 text-[9px] font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-white dark:hover:text-white light:hover:text-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Register</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-zinc-900/80 dark:border-zinc-900/80 light:border-zinc-200/80 flex items-center justify-between text-[9px] text-zinc-500 dark:text-zinc-500 light:text-zinc-400 font-mono">
          <span>FOCUS ENGINE · v0.1.0</span>
          <span>STAY IN FLOW</span>
        </div>
      </aside>
    </>
  );
};
