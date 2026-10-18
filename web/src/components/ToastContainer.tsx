import React from 'react';
import { useStore } from '../store/useStore';
import { Check, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex flex-col-reverse items-end max-sm:items-center max-sm:inset-x-0 max-sm:bottom-4 gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="pointer-events-auto flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-zinc-950/92 dark:bg-zinc-950/92 light:bg-white/95 text-zinc-100 dark:text-zinc-100 light:text-zinc-900 border border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200/90 shadow-xl shadow-black/25 dark:shadow-black/60 light:shadow-zinc-300/50 backdrop-blur-md animate-toast-in text-[13px] font-medium tracking-tight select-none max-w-full"
        >
          {/* Status Indicator */}
          {toast.type === 'success' && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 dark:bg-emerald-500/15 light:bg-emerald-500/10 shrink-0">
              <Check className="w-3 h-3 text-emerald-400 dark:text-emerald-400 light:text-emerald-600" strokeWidth={2.5} />
            </span>
          )}
          {toast.type === 'error' && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/15 dark:bg-rose-500/15 light:bg-rose-500/10 shrink-0">
              <AlertCircle className="w-3 h-3 text-rose-400 dark:text-rose-400 light:text-rose-600" strokeWidth={2.5} />
            </span>
          )}
          {toast.type === 'info' && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-500/15 dark:bg-zinc-500/15 light:bg-zinc-500/10 shrink-0">
              <Info className="w-3 h-3 text-zinc-400 dark:text-zinc-400 light:text-zinc-600" strokeWidth={2.5} />
            </span>
          )}

          {/* Toast Message */}
          <span className="flex-1 text-[13px] leading-snug">{toast.message}</span>

          {/* Dismiss Button */}
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 -mr-1 rounded-md text-zinc-500 hover:text-zinc-200 dark:text-zinc-500 dark:hover:text-zinc-200 light:text-zinc-400 light:hover:text-zinc-800 hover:bg-white/5 dark:hover:bg-white/10 light:hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

