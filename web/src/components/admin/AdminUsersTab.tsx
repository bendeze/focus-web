import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  KeyRound,
  Trash2,
  CheckCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { AdminSystemUser } from '../../types';

interface AdminUsersTabProps {
  users: AdminSystemUser[];
  onUpdateUser: (userId: string, patch: Partial<AdminSystemUser>) => void | Promise<void>;
  onAddUser: (user: Omit<AdminSystemUser, 'id' | 'created_at' | 'updated_at'> & { password?: string }) => void | Promise<void>;
  onDeleteUser: (userId: string, hardDelete?: boolean) => void | Promise<void>;
  onResetPassword?: (userId: string, tempPassword: string) => Promise<void>;
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
  isAddUserOpen: boolean;
  setIsAddUserOpen: (open: boolean) => void;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  users,
  onUpdateUser,
  onAddUser,
  onDeleteUser,
  onResetPassword,
  onRefresh,
  isRefreshing,
  isAddUserOpen,
  setIsAddUserOpen,
}) => {
  const { user: currentLoggedUser } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Password Reset Modal State
  const [resetModalUser, setResetModalUser] = useState<AdminSystemUser | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Delete & Hard Delete Modal State
  const [deleteModalUser, setDeleteModalUser] = useState<AdminSystemUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add User Form State
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [addError, setAddError] = useState<string | null>(null);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.full_name && u.full_name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q));

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      setAddError('All required fields must be filled');
      return;
    }

    if (newPassword.length < 6) {
      setAddError('Password must be at least 6 characters');
      return;
    }

    onAddUser({
      username: newUsername.trim().toLowerCase(),
      email: newEmail.trim().toLowerCase(),
      password: newPassword,
      full_name: newName.trim() || null,
      avatar_url: null,
      is_active: true,
      role: newRole,
      status: 'active',
      total_focus_minutes: 0,
      tasks_count: 0,
      last_active: 'Just now',
    });

    setNewName('');
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setNewRole('user');
    setIsAddUserOpen(false);
  };

  const handleOpenReset = async (user: AdminSystemUser) => {
    const generated = `Fcs!${Math.random().toString(36).substring(2, 8)}#`;
    setTempPassword(generated);
    setResetModalUser(user);
    setResetSuccess(false);

    if (onResetPassword) {
      await onResetPassword(user.id, generated).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      {/* 1. Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-medium tracking-tight text-white dark:text-white light:text-black">
            Users
          </h2>
          <span className="text-xs text-zinc-500 font-mono">
            {filteredUsers.length} of {users.length} members
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-8 px-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Fetch latest members"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
          )}
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="h-8 px-3.5 rounded-full bg-white text-black text-xs font-medium flex items-center gap-1.5 hover:bg-zinc-200 active:scale-98 transition-all cursor-pointer shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* 2. Minimalist Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-4 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="h-8 px-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">Member</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-8 px-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* 3. Minimalist Users Table */}
      <div className="rounded-2xl bg-zinc-950 border border-subtle-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-subtle-dark text-zinc-400 font-mono text-[10px] tracking-wider uppercase bg-zinc-900/30">
                <th className="py-3 px-5 font-medium">User</th>
                <th className="py-3 px-5 font-medium">Email</th>
                <th className="py-3 px-5 font-medium">Role</th>
                <th className="py-3 px-5 font-medium">Status</th>
                <th className="py-3 px-5 font-medium">Focus</th>
                <th className="py-3 px-5 font-medium">Tasks</th>
                <th className="py-3 px-5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500 font-light">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelf = currentLoggedUser?.id === user.id || (Boolean(user.username) && currentLoggedUser?.username === user.username);
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-900/30 transition-colors"
                    >
                      {/* User Info */}
                      <td className="py-3 px-5">
                        <div className="flex flex-col">
                          <span className="font-medium text-white dark:text-white light:text-black">
                            {user.full_name || user.username}
                          </span>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            @{user.username || 'user'}
                          </span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-5 text-zinc-400 font-mono text-[11px]">
                        {user.email || '—'}
                      </td>

                      {/* Role */}
                      <td className="py-3 px-5">
                        <button
                          onClick={() =>
                            onUpdateUser(user.id, {
                              role: user.role === 'admin' ? 'user' : 'admin',
                            })
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider transition-colors cursor-pointer ${
                            user.role === 'admin'
                              ? 'bg-zinc-800 text-white font-medium'
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                          title="Toggle role"
                        >
                          {user.role}
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-5">
                        <button
                          onClick={() =>
                            onUpdateUser(user.id, {
                              status: user.status === 'active' ? 'suspended' : 'active',
                              is_active: user.status !== 'active',
                            })
                          }
                          className="inline-flex items-center gap-1.5 text-[11px] font-mono transition-opacity cursor-pointer hover:opacity-80"
                          title="Toggle status"
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'active' ? 'bg-emerald-400' : 'bg-zinc-600'
                            }`}
                          />
                          <span className={user.status === 'active' ? 'text-zinc-300' : 'text-zinc-500'}>
                            {user.status}
                          </span>
                        </button>
                      </td>

                      {/* Focus Hours */}
                      <td className="py-3 px-5 text-zinc-400 font-mono tabular-nums text-[11px]">
                        {Math.round((user.total_focus_minutes || 0) / 60)}h
                      </td>

                      {/* Tasks Count */}
                      <td className="py-3 px-5 text-zinc-400 font-mono tabular-nums text-[11px]">
                        {user.tasks_count || 0}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenReset(user)}
                            className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteModalUser(user)}
                            disabled={isSelf}
                            className={`p-1 rounded-lg transition-colors ${
                              isSelf
                                ? 'opacity-20 cursor-not-allowed text-zinc-600'
                                : 'text-zinc-500 hover:text-red-400 hover:bg-red-950/20 cursor-pointer'
                            }`}
                            title={isSelf ? 'Cannot delete self' : 'Delete User'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal: Add Member */}
      {isAddUserOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddUserOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl text-white">
            <button
              onClick={() => setIsAddUserOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-medium text-white mb-4">
              Add Member
            </h3>

            {addError && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-950/40 border border-red-900/50 text-red-300 text-xs">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Optional name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="email@domain.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-400 mb-1">
                  Role
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('user')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      newRole === 'user'
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Member
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      newRole === 'admin'
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-9 rounded-full bg-white text-black font-medium text-xs flex items-center justify-center hover:bg-zinc-200 transition-all cursor-pointer"
                >
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Password Reset */}
      {resetModalUser && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setResetModalUser(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-xs bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl text-white">
            <button
              onClick={() => setResetModalUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-medium text-white mb-1">
              Reset Password
            </h3>
            <p className="text-xs text-zinc-500 font-mono mb-4">
              @{resetModalUser.username || resetModalUser.email}
            </p>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 mb-4 font-mono text-sm text-zinc-200 select-all text-center">
              {tempPassword}
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(tempPassword);
                setResetSuccess(true);
              }}
              className="w-full h-8 rounded-full bg-white text-black font-medium text-xs flex items-center justify-center gap-1.5 hover:bg-zinc-200 transition-all cursor-pointer"
            >
              {resetSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-black" />
                  <span>Copied</span>
                </>
              ) : (
                <span>Copy Password</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 6. Modal: Delete or Hard Delete */}
      {deleteModalUser && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setDeleteModalUser(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl text-white">
            <button
              onClick={() => !isDeleting && setDeleteModalUser(null)}
              disabled={isDeleting}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm font-medium text-white mb-1">
              Delete Account
            </h3>
            <p className="text-xs text-zinc-500 font-mono mb-4">
              @{deleteModalUser.username || deleteModalUser.email}
            </p>

            <div className="flex flex-col gap-2 mb-4">
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await onDeleteUser(deleteModalUser.id, false);
                    setDeleteModalUser(null);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="w-full h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white text-xs font-medium transition-all cursor-pointer flex items-center justify-center"
              >
                Deactivate (Preserve Data)
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await onDeleteUser(deleteModalUser.id, true);
                    setDeleteModalUser(null);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="w-full h-9 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-900/60 text-red-300 text-xs font-medium transition-all cursor-pointer flex items-center justify-center"
              >
                {isDeleting ? 'Purging...' : 'Permanently Delete'}
              </button>
            </div>

            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setDeleteModalUser(null)}
              className="w-full text-center text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer pt-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
