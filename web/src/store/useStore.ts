import { create } from 'zustand';
import type { FocusSession, ToastMessage, User } from '../types';

export function isUserAdmin(user: User | null): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.is_admin) return true;
  const envEmail = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@focus.app').trim().toLowerCase();
  const envUser = (import.meta.env.VITE_ADMIN_USERNAME || 'admin').trim().toLowerCase();
  if (envEmail && user.email && user.email.toLowerCase() === envEmail) return true;
  if (envUser && user.username && user.username.toLowerCase() === envUser) return true;
  return false;
}

interface AppState {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;

  theme: 'dark' | 'light';
  toggleTheme: () => void;

  activeTab: 'dashboard' | 'focus' | 'tasks' | 'projects' | 'analytics' | 'settings' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'focus' | 'tasks' | 'projects' | 'analytics' | 'settings' | 'admin') => void;

  taskProjectFilter: string;
  setTaskProjectFilter: (filter: string) => void;

  analyticsProjectId: string | null;
  setAnalyticsProjectId: (projectId: string | null) => void;

  activeSession: FocusSession | null;
  remainingSeconds: number;
  totalSeconds: number;
  isTimerRunning: boolean;
  selectedTaskId: string | null;
  taskTimers: Record<string, { remainingSeconds: number; totalSeconds: number }>;
  
  setActiveSession: (session: FocusSession | null) => void;
  setRemainingSeconds: (seconds: number) => void;
  setTotalSeconds: (seconds: number) => void;
  setIsTimerRunning: (isRunning: boolean) => void;
  setSelectedTaskId: (taskId: string | null) => void;
  decrementTimer: () => void;
  selectAndStartTask: (taskId: string, estimatedMinutes?: number) => void;
  pauseCurrentTimer: () => void;
  resumeCurrentTimer: () => void;
  toggleTimer: () => void;
  resetCurrentTimer: (defaultMinutes?: number) => void;
  clearTaskTimer: (taskId: string) => void;

  isZenMode: boolean;
  setZenMode: (zen: boolean) => void;

  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

const savedToken = localStorage.getItem('focus_token');
const savedUser = localStorage.getItem('focus_user') ? JSON.parse(localStorage.getItem('focus_user')!) : null;
const savedIsAdmin = localStorage.getItem('focus_is_admin') === 'true' || isUserAdmin(savedUser);
const initialTheme = (localStorage.getItem('focus_theme') as 'dark' | 'light') || 'dark';

if (typeof document !== 'undefined') {
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
}

export const useStore = create<AppState>((set, get) => ({
  user: savedUser,
  token: savedToken,
  isAdmin: savedIsAdmin,
  setIsAdmin: (isAdmin) => {
    localStorage.setItem('focus_is_admin', isAdmin ? 'true' : 'false');
    set({ isAdmin });
  },
  setUser: (user) => {
    const isAdmin = isUserAdmin(user);
    if (user) {
      const augmentedUser: User = {
        ...user,
        role: isAdmin ? 'admin' : (user.role || 'user'),
        is_admin: isAdmin,
      };
      localStorage.setItem('focus_user', JSON.stringify(augmentedUser));
      localStorage.setItem('focus_is_admin', isAdmin ? 'true' : 'false');
      set({ user: augmentedUser, isAdmin });
    } else {
      localStorage.removeItem('focus_user');
      localStorage.removeItem('focus_is_admin');
      set({ user: null, isAdmin: false });
    }
  },
  setToken: (token) => {
    if (token) {
      localStorage.setItem('focus_token', token);
    } else {
      localStorage.removeItem('focus_token');
    }
    set({ token });
  },
  logout: () => {
    localStorage.removeItem('focus_token');
    localStorage.removeItem('focus_user');
    localStorage.removeItem('focus_is_admin');
    set({
      user: null,
      token: null,
      isAdmin: false,
      activeTab: 'dashboard',
      activeSession: null,
      isTimerRunning: false,
      taskTimers: {},
    });
    get().addToast('Logged out successfully', 'info');
  },

  theme: initialTheme,
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('focus_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    set({ theme: nextTheme });
  },

  activeTab: 'dashboard',
  setActiveTab: (activeTab) => set({ activeTab }),

  taskProjectFilter: 'all',
  setTaskProjectFilter: (taskProjectFilter) => set({ taskProjectFilter }),

  analyticsProjectId: null,
  setAnalyticsProjectId: (analyticsProjectId) => set({ analyticsProjectId }),

  activeSession: null,
  remainingSeconds: 25 * 60,
  totalSeconds: 25 * 60,
  isTimerRunning: false,
  selectedTaskId: null,
  taskTimers: {},

  setActiveSession: (activeSession) => {
    set({ activeSession });
  },

  setRemainingSeconds: (remainingSeconds) => {
    const { selectedTaskId, taskTimers, totalSeconds } = get();
    const updatedTimers = selectedTaskId ? {
      ...taskTimers,
      [selectedTaskId]: { remainingSeconds, totalSeconds },
    } : taskTimers;
    set({ remainingSeconds, taskTimers: updatedTimers });
  },

  setTotalSeconds: (totalSeconds) => {
    const { selectedTaskId, taskTimers, remainingSeconds } = get();
    const updatedTimers = selectedTaskId ? {
      ...taskTimers,
      [selectedTaskId]: { remainingSeconds, totalSeconds },
    } : taskTimers;
    set({ totalSeconds, taskTimers: updatedTimers });
  },

  setIsTimerRunning: (isTimerRunning) => set({ isTimerRunning }),
  setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),

  decrementTimer: () => {
    const { remainingSeconds, isTimerRunning, selectedTaskId, taskTimers, totalSeconds } = get();
    if (isTimerRunning && remainingSeconds > 0) {
      const nextRemain = remainingSeconds - 1;
      const nextTimers = selectedTaskId ? {
        ...taskTimers,
        [selectedTaskId]: {
          remainingSeconds: nextRemain,
          totalSeconds,
        },
      } : taskTimers;
      set({ remainingSeconds: nextRemain, taskTimers: nextTimers });
    }
  },

  selectAndStartTask: (taskId: string, estimatedMinutes?: number) => {
    const { selectedTaskId, remainingSeconds, totalSeconds, taskTimers } = get();
    const updatedTimers = { ...taskTimers };

    // Save previous task's current progress if it was running or paused
    if (selectedTaskId && selectedTaskId !== taskId) {
      updatedTimers[selectedTaskId] = {
        remainingSeconds,
        totalSeconds,
      };
    }

    // Retrieve or initialize timer for clicked task
    const existing = updatedTimers[taskId];
    const durSecs = existing ? existing.totalSeconds : (estimatedMinutes || 25) * 60;
    const remainSecs = existing ? existing.remainingSeconds : durSecs;

    updatedTimers[taskId] = {
      remainingSeconds: remainSecs,
      totalSeconds: durSecs,
    };

    set({
      selectedTaskId: taskId,
      remainingSeconds: remainSecs,
      totalSeconds: durSecs,
      isTimerRunning: true,
      taskTimers: updatedTimers,
    });
  },

  pauseCurrentTimer: () => {
    const { selectedTaskId, remainingSeconds, totalSeconds, taskTimers } = get();
    const updatedTimers = selectedTaskId ? {
      ...taskTimers,
      [selectedTaskId]: { remainingSeconds, totalSeconds },
    } : taskTimers;
    set({
      isTimerRunning: false,
      taskTimers: updatedTimers,
    });
  },

  resumeCurrentTimer: () => {
    set({ isTimerRunning: true });
  },

  toggleTimer: () => {
    const { isTimerRunning } = get();
    if (isTimerRunning) {
      get().pauseCurrentTimer();
    } else {
      get().resumeCurrentTimer();
    }
  },

  resetCurrentTimer: (defaultMinutes?: number) => {
    const { selectedTaskId, taskTimers } = get();
    const durSecs = (defaultMinutes || 25) * 60;
    const updatedTimers = selectedTaskId ? {
      ...taskTimers,
      [selectedTaskId]: { remainingSeconds: durSecs, totalSeconds: durSecs },
    } : taskTimers;
    set({
      isTimerRunning: false,
      remainingSeconds: durSecs,
      totalSeconds: durSecs,
      taskTimers: updatedTimers,
    });
  },

  clearTaskTimer: (taskId: string) => {
    const { taskTimers, selectedTaskId } = get();
    const updatedTimers = { ...taskTimers };
    delete updatedTimers[taskId];
    set({
      taskTimers: updatedTimers,
      ...(selectedTaskId === taskId ? { isTimerRunning: false, remainingSeconds: 25 * 60, totalSeconds: 25 * 60 } : {}),
    });
  },

  isZenMode: false,
  setZenMode: (isZenMode) => set({ isZenMode }),

  toasts: [],
  addToast: (message, type = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, message, type };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));
