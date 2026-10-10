import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { ArrowRight, Check, ArrowLeft, X, Lock, Mail, Loader2 } from 'lucide-react';

interface RegisterJourneyProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export const RegisterJourney: React.FC<RegisterJourneyProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const { setUser, setToken, addToast } = useStore();

  // Journey Steps: 1 = Username, 2 = Password & Confirm, 3 = Email
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus the corresponding input when step changes
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (step === 1) usernameInputRef.current?.focus();
      else if (step === 2) passwordInputRef.current?.focus();
      else if (step === 3) emailInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [step, isOpen]);

  if (!isOpen) return null;

  const handleNextFromUsername = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Please choose a username to continue.');
      return;
    }
    if (cleanUsername.length < 2) {
      setError('Username must be at least 2 characters long.');
      return;
    }
    setStep(2);
  };

  const handleNextFromPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-check.');
      return;
    }
    setStep(3);
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.register({
        username: username.trim(),
        password,
        email: email.trim() || undefined,
      });

      setToken(res.access_token);
      setUser(res.user);
      addToast(`Welcome to Focus, ${res.user.username}!`, 'success');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between p-6 sm:p-12 overflow-y-auto animate-in fade-in duration-300 select-none">
      
      {/* Top Header: Progress indicators & Exit */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between">
        {/* Step indicator dashes */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-500 ${
                s === step
                  ? 'w-8 bg-white'
                  : s < step
                  ? 'w-4 bg-zinc-600'
                  : 'w-4 bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* Exit / Switch to Login */}
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            title="Exit registration"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Conversational Journey Container */}
      <div className="w-full max-w-lg mx-auto py-8">
        
        {/* Step 1: Username */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col gap-20">
            <div>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white mb-2">
                What should we call you?
              </h1>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Choose a unique username for your personal workspace and task records.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-300 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleNextFromUsername} className="flex flex-col gap-8">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-mono">@</span>
                <input
                  ref={usernameInputRef}
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="jean"
                  className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all font-mono"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwitchToLogin();
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                >
                  Already have an account?
                </button>

                <button
                  type="submit"
                  className="h-8 px-6 rounded-full bg-white text-black font-medium text-xs tracking-normal flex items-center gap-1 hover:bg-zinc-200 active:scale-98 transition-all cursor-pointer shadow-lg"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Password & Confirmation */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col gap-20">
            <div>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white mb-2">
                Nice to meet you, <span className="font-semibold text-white">@{username}</span>.
              </h1>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Set a secure password to protect your focus sessions and workspace.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-300 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleNextFromPassword} className="flex flex-col gap-8">
              <div className="space-y-6">
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    ref={passwordInputRef}
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min. 6 characters)"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                  />
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep(1);
                  }}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  className="h-8 px-6 rounded-full bg-white text-black font-medium text-xs tracking-normal flex items-center gap-2 hover:bg-zinc-200 active:scale-98 transition-all cursor-pointer shadow-lg"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Email (Final Step) */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col gap-20">
            <div>
              <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white mb-2">
                Almost there, <span className="font-semibold text-white">@{username}</span>.
              </h1>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Where can we reach you? Add your email address to sync seamlessly across mobile & web.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/50 text-red-300 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCompleteRegistration} className="flex flex-col gap-8">
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com (Optional)"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep(2);
                  }}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-8 px-7 rounded-full bg-white text-black font-medium text-xs tracking-wider flex items-center gap-2 hover:bg-zinc-200 active:scale-98 transition-all cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Space...</span>
                    </>
                  ) : (
                    <>
                      <span>Enter Focus</span>
                      <Check className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* Bottom Footer: Zen Philosophy */}
      <div className="w-full max-w-2xl mx-auto text-center">
      </div>

    </div>
  );
};
