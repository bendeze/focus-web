import { create } from 'zustand';
import type { FocusSession, ToastMessage, User } from '../types';

interface AppState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;

  theme: 'dark' | 'light';
  toggleTheme: () => void;

  activeTab: 'dashboard' | 'focus' | 'tasks' | 'projects' | 'analytics' | 'settings';
  setActiveTab: (tab: 'dashboard' | 'focus' | 'tasks' | 'projects' | 'analytics' | 'settings') => void;

  activeSession: FocusSession | null;
  remainingSeconds: number;
  totalSeconds: number;
  isTimerRunning: boolean;
  selectedTaskId: string | null;
  
  setActiveSession: (session: FocusSession | null) => void;
  setRemainingSeconds: (seconds: number) => void;
  setTotalSeconds: (seconds: number) => void;
  setIsTimerRunning: (isRunning: boolean) => void;
  setSelectedTaskId: (taskId: string | null) => void;
  decrementTimer: () => void;

  isZenMode: boolean;
  setZenMode: (zen: boolean) => void;

  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  removeToast: (id: string) => void;
}

const savedToken = localStorage.getItem('focus_token');
const savedUser = localStorage.getItem('focus_user') ? JSON.parse(localStorage.getItem('focus_user')!) : null;
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
  setUser: (user) => {
    if (user) {
      localStorage.setItem('focus_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('focus_user');
    }
    set({ user });
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
    set({ user: null, token: null, activeSession: null, isTimerRunning: false });
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

  activeSession: null,
  remainingSeconds: 25 * 60,
  totalSeconds: 25 * 60,
  isTimerRunning: false,
  selectedTaskId: null,

  setActiveSession: (activeSession) => {
    if (activeSession) {
      const isRunning = activeSession.status === 'active';
      const durationSecs = activeSession.duration_minutes * 60;
      
      const startTime = new Date(activeSession.started_at).getTime();
      const now = Date.now();
      const elapsedSecs = activeSession.status === 'paused'
        ? (activeSession.actual_focus_seconds || 0)
        : Math.floor((now - startTime) / 1000);

      const remain = Math.max(0, durationSecs - elapsedSecs);

      set({
        activeSession,
        selectedTaskId: activeSession.task_id,
        totalSeconds: durationSecs,
        remainingSeconds: remain,
        isTimerRunning: isRunning && remain > 0,
      });
    } else {
      set({
        activeSession: null,
        isTimerRunning: false,
        remainingSeconds: 25 * 60,
        totalSeconds: 25 * 60,
      });
    }
  },

  setRemainingSeconds: (remainingSeconds) => set({ remainingSeconds }),
  setTotalSeconds: (totalSeconds) => set({ totalSeconds }),
  setIsTimerRunning: (isTimerRunning) => set({ isTimerRunning }),
  setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),

  decrementTimer: () => {
    const { remainingSeconds, isTimerRunning } = get();
    if (isTimerRunning && remainingSeconds > 0) {
      set({ remainingSeconds: remainingSeconds - 1 });
    }
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
