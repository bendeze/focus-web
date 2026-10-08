import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { api, getBaseUrl, setBaseUrl } from '../services/api';
import {
  X,
  LogOut,
  Save,
  Loader2,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, setUser, logout, addToast } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'password' | 'server'>('profile');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [apiUrl, setApiUrl] = useState(getBaseUrl());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const updated = await api.updateProfile({ full_name: fullName.trim() || undefined });
      setUser(updated);
      addToast('Profile updated', 'success');
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

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setBaseUrl(apiUrl);
    addToast('API Server endpoint updated', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-glass animate-fade-in">
      <div className="relative w-full max-w-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-2xl animate-slide-up text-light-text dark:text-dark-text">
        
        {/* Top Drag Handle (Mobile Style) */}
        <div className="w-9 h-1 rounded-full bg-light-borderSubtle dark:bg-dark-borderSubtle mx-auto mb-6" />

        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text hover:bg-light-fill dark:hover:bg-dark-fill transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Card Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-light-fill dark:bg-dark-fill border border-light-border dark:border-dark-border flex items-center justify-center text-xl font-bold uppercase text-light-text dark:text-dark-text">
            {user.full_name ? user.full_name.charAt(0) : (user.username || user.email || 'U').charAt(0)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-light-text dark:text-dark-text leading-tight">
              {user.full_name || user.username || 'User Profile'}
            </h2>
            <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary mt-0.5">
              {user.email || user.username || 'Authenticated'}
            </p>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex bg-light-fill dark:bg-dark-fill p-1 rounded-full mb-6 border border-light-border dark:border-dark-border text-xs">
          <button
            onClick={() => { setActiveSubTab('profile'); setError(null); }}
            className={`flex-1 py-1.5 rounded-full font-bold uppercase tracking-badge transition-all ${
              activeSubTab === 'profile'
                ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg'
                : 'text-light-textSecondary dark:text-dark-textSecondary'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => { setActiveSubTab('password'); setError(null); }}
            className={`flex-1 py-1.5 rounded-full font-bold uppercase tracking-badge transition-all ${
              activeSubTab === 'password'
                ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg'
                : 'text-light-textSecondary dark:text-dark-textSecondary'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => { setActiveSubTab('server'); setError(null); }}
            className={`flex-1 py-1.5 rounded-full font-bold uppercase tracking-badge transition-all ${
              activeSubTab === 'server'
                ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg'
                : 'text-light-textSecondary dark:text-dark-textSecondary'
            }`}
          >
            Cloud API
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-xs font-medium">
            {error}
          </div>
        )}

        {activeSubTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-xs focus:outline-none focus:border-light-text dark:focus:border-dark-text text-light-text dark:text-dark-text"
              />
            </div>

            <div className="p-3 rounded-2xl bg-light-fill dark:bg-dark-fill border border-light-border dark:border-dark-border text-xs space-y-1 text-light-textSecondary dark:text-dark-textSecondary">
              <div className="flex justify-between">
                <span>Username</span>
                <span className="font-semibold text-light-text dark:text-dark-text">{user.username || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Email</span>
                <span className="font-semibold text-light-text dark:text-dark-text">{user.email || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span>Member Since</span>
                <span className="font-semibold text-light-text dark:text-dark-text">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg text-xs font-bold tracking-brand uppercase flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Profile</span>}
            </button>
          </form>
        )}

        {activeSubTab === 'password' && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-xs focus:outline-none focus:border-light-text dark:focus:border-dark-text text-light-text dark:text-dark-text"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-xs focus:outline-none focus:border-light-text dark:focus:border-dark-text text-light-text dark:text-dark-text"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg text-xs font-bold tracking-brand uppercase flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Update Password</span>}
            </button>
          </form>
        )}

        {activeSubTab === 'server' && (
          <form onSubmit={handleSaveApiUrl} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary mb-1.5">
                FastAPI Server URL
              </label>
              <input
                type="url"
                required
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://focus-app-dff0d763.fastapicloud.dev"
                className="w-full px-4 py-2.5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-xs focus:outline-none focus:border-light-text dark:focus:border-dark-text text-light-text dark:text-dark-text font-mono"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setApiUrl('https://focus-app-dff0d763.fastapicloud.dev')}
                className="flex-1 py-1.5 rounded-xl bg-light-fill dark:bg-dark-fill text-[10px] font-bold uppercase border border-light-border dark:border-dark-border"
              >
                Cloud (Prod)
              </button>
              <button
                type="button"
                onClick={() => setApiUrl('http://127.0.0.1:8000')}
                className="flex-1 py-1.5 rounded-xl bg-light-fill dark:bg-dark-fill text-[10px] font-bold uppercase border border-light-border dark:border-dark-border"
              >
                Localhost
              </button>
            </div>

            <button
              type="submit"
              className="w-full h-11 rounded-full bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg text-xs font-bold tracking-brand uppercase flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Save Endpoint</span>
            </button>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-light-border dark:border-dark-border flex justify-center">
          <button
            onClick={() => {
              logout();
              onClose();
            }}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
