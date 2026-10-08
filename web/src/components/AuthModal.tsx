import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { X, Lock, User as UserIcon, Mail, ArrowRight, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setUser, setToken, addToast } = useStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!username && !email) {
          throw new Error('Please provide either a username or an email');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const res = await api.register({
          username: username.trim() || undefined,
          email: email.trim() || undefined,
          password,
          full_name: fullName.trim() || undefined,
        });

        setToken(res.access_token);
        setUser(res.user);
        addToast(`Welcome to Focus, ${res.user.full_name || res.user.username || 'User'}!`, 'success');
        onClose();
      } else {
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
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-glass animate-fade-in">
      <div className="relative w-full max-w-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-2xl animate-slide-up text-light-text dark:text-dark-text">
        
        {/* Top Sheet Drag Handle Indicator (Mobile Style) */}
        <div className="w-9 h-1 rounded-full bg-light-borderSubtle dark:bg-dark-borderSubtle mx-auto mb-6" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text hover:bg-light-fill dark:hover:bg-dark-fill transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold tracking-brand uppercase mb-1">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary">
            {isRegister
              ? 'Join the distraction-free productivity environment'
              : 'Sign in to sync your tasks and focus metrics'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-light-fill dark:bg-dark-fill p-1 rounded-full mb-6 border border-light-border dark:border-dark-border">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(null); }}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold tracking-badge uppercase transition-all ${
              !isRegister
                ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg shadow-sm'
                : 'text-light-textSecondary dark:text-dark-textSecondary'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(null); }}
            className={`flex-1 py-1.5 rounded-full text-xs font-bold tracking-badge uppercase transition-all ${
              isRegister
                ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg shadow-sm'
                : 'text-light-textSecondary dark:text-dark-textSecondary'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-xs font-medium tracking-wide">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isRegister ? (
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-light-textSecondary dark:text-dark-textSecondary" />
                <input
                  type="text"
                  required
                  placeholder="e.g. alex or alex@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-sm focus:outline-none focus:border-light-text dark:focus:border-dark-text transition-colors text-light-text dark:text-dark-text"
                />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary mb-1.5">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-sm focus:outline-none focus:border-light-text dark:focus:border-dark-text transition-colors text-light-text dark:text-dark-text"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-light-textSecondary dark:text-dark-textSecondary" />
                  <input
                    type="text"
                    placeholder="e.g. alexrivera"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-sm focus:outline-none focus:border-light-text dark:focus:border-dark-text transition-colors text-light-text dark:text-dark-text"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-light-textSecondary dark:text-dark-textSecondary" />
                  <input
                    type="email"
                    placeholder="e.g. alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-sm focus:outline-none focus:border-light-text dark:focus:border-dark-text transition-colors text-light-text dark:text-dark-text"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-light-textSecondary dark:text-dark-textSecondary" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-sm focus:outline-none focus:border-light-text dark:focus:border-dark-text transition-colors text-light-text dark:text-dark-text"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 h-12 rounded-full bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg font-bold tracking-brand text-xs uppercase flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
