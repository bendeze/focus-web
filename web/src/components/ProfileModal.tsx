import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import {
  X,
  LogOut,
  Save,
  Loader2,
  User as UserIcon,
  Mail,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, setUser, logout, addToast } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'security'>('profile');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [user, isOpen]);

  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    setContentHeight(el.scrollHeight);

    const resizeObserver = new ResizeObserver(() => {
      if (contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
    });

    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [activeSubTab, error]);

  if (!isOpen || !user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const updated = await api.updateProfile({
        full_name: fullName.trim() || undefined,
        username: username.trim() || undefined,
        email: email.trim() || undefined,
      });
      setUser(updated);
      addToast('Profile updated successfully', 'success');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await api.changePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      addToast('Password changed successfully', 'success');
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
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
      <div className="relative w-full max-w-md bg-zinc-950/95 border border-zinc-800/80 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl text-white transition-all">
        
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

        {/* Profile Card Header */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-13 h-13 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg font-bold uppercase text-white shadow-inner">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username || 'User'}
                className="w-full h-full rounded-full object-cover grayscale"
              />
            ) : (
              (user.full_name || user.username || 'U').substring(0, 2)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white truncate leading-tight">
              {user.full_name || user.username || 'User Profile'}
            </h2>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              {user.email || `@${user.username}` || 'Authenticated'}
            </p>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex p-1 mb-5 text-xs">
          <button
            onClick={() => { setActiveSubTab('profile'); setError(null); }}
            className={`flex-1 py-1.5 rounded-xl font-light uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'profile'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => { setActiveSubTab('security'); setError(null); }}
            className={`flex-1 py-1.5 rounded-xl font-light uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'security'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Security
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/40 border border-red-900/50 text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Animated Tab Content Container */}
        <div
          className="overflow-hidden transition-[height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ height: contentHeight !== undefined ? `${contentHeight}px` : 'auto' }}
        >
          <div ref={contentRef} key={activeSubTab} className="animate-in fade-in-0 duration-200">
            {/* Profile Tab */}
            {activeSubTab === 'profile' && (
              <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-3.5 pb-1">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-mono">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="w-full pl-8 pr-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="p-3 text-xs flex justify-between items-center text-zinc-400">
                  <span>Member Since</span>
                  <span className="font-light text-zinc-400">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
                  </span>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeSubTab === 'security' && (
              <form id="password-form" onSubmit={handleChangePassword} className="space-y-3.5 pb-1">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <ShieldCheck className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer Action Bar with Vertical Divider */}
        <div className="mt-2 pt-4 border-t border-zinc-800/80 flex items-center justify-center gap-6">
          {activeSubTab === 'profile' ? (
            <button
              type="submit"
              form="profile-form"
              disabled={loading}
              className="flex items-center gap-2 text-xs font-light uppercase tracking-wider text-white hover:text-zinc-300 disabled:opacity-40 transition-colors cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Profile</span>
            </button>
          ) : (
            <button
              type="submit"
              form="password-form"
              disabled={loading}
              className="flex items-center gap-2 text-xs font-light uppercase tracking-wider text-white hover:text-zinc-300 disabled:opacity-40 transition-colors cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Update Password</span>
            </button>
          )}

          {/* Vertical Separator */}
          <div className="w-[1px] h-4 bg-zinc-800" />

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>
    </div>
  );
};

