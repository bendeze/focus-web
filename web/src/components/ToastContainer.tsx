import React from 'react';
import { useStore } from '../store/useStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full bg-dark-fill text-white dark:bg-dark-fill dark:text-white dark:border dark:border-dark-border shadow-xl backdrop-glass animate-slide-down text-sm font-medium tracking-wide"
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-white" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-white" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-white/80" />}
          
          <span className="flex-1 text-xs sm:text-sm">{toast.message}</span>
          
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
