import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { X, Lock, User as UserIcon, Loader2, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onOpenRegister,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setUser, setToken, addToast } = useStore();

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!identifier.trim()) {
        throw new Error('Please enter your username or email');
      }

      const res = await api.login({
        identifier: identifier.trim(),
        password,
      });

      setToken(res.access_token);
      setUser(res.user);
      addToast(`Welcome back, ${res.user.full_name || res.user.username || 'User'}!`, 'success');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all duration-300 animate-in fade-in"
    >
      <div className="relative w-full max-w-sm bg-zinc-950/95 border border-zinc-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl text-white transition-all">
        
        {/* Top Drag Handle Indicator */}
        <div className="w-9 h-1 rounded-full bg-zinc-800 mx-auto mb-5" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-light tracking-wider uppercase text-white mb-1">
            Sign In
          </h2>
          <p className="text-xs text-zinc-400 font-light">
            Sync your tasks and focus metrics across all devices
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/40 border border-red-900/50 text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <UserIcon className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                required
                autoFocus
                placeholder="username or email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 h-11 rounded-full bg-white text-black font-medium tracking-wider text-xs uppercase flex items-center justify-center gap-2 hover:bg-zinc-200 active:scale-98 transition-all disabled:opacity-50 cursor-pointer shadow-lg"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Register Journey */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 text-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onOpenRegister) onOpenRegister();
            }}
            className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            Don't have an account? <span className="font-semibold underline text-white">Start registration journey</span>
          </button>
        </div>

      </div>
    </div>
  );
};

