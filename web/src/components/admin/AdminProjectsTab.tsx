import React, { useState, useMemo } from 'react';
import {
  Search,
  FolderKanban,
  FolderPlus,
  X,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Check,
  RefreshCw,
  LayoutGrid,
  List as ListIcon,
  AlertTriangle,
  User as UserIcon,
} from 'lucide-react';
import type { AdminProject, Task, AdminSystemUser } from '../../types';

interface AdminProjectsTabProps {
  projects: AdminProject[];
  tasks: Task[];
  users?: AdminSystemUser[];
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
  onUpdateProject?: (projectId: string, patch: Partial<AdminProject>) => void | Promise<void>;
  onCreateProject?: (projectData: {
    title: string;
    description?: string;
    user_id?: string;
    status?: string;
    color?: string;
  }) => void | Promise<void>;
  onDeleteProject?: (projectId: string, hardDelete?: boolean) => void | Promise<void>;
}

const COLOR_PRESETS = [
  { label: 'Slate', value: '#64748B' },
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Indigo', value: '#6366F1' },
  { label: 'Purple', value: '#A855F7' },
  { label: 'Emerald', value: '#10B981' },
  { label: 'Amber', value: '#F59E0B' },
  { label: 'Rose', value: '#F43F5E' },
  { label: 'Cyan', value: '#06B6D4' },
];

export const AdminProjectsTab: React.FC<AdminProjectsTabProps> = ({
  projects,
  tasks,
  users = [],
  onRefresh,
  isRefreshing,
  onUpdateProject,
  onCreateProject,
  onDeleteProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<AdminProject | null>(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<AdminProject | null>(null);
  const [hardDelete, setHardDelete] = useState(false);

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newUserId, setNewUserId] = useState('');
  const [newStatus, setNewStatus] = useState<'active' | 'completed' | 'archived'>('active');
  const [newColor, setNewColor] = useState(COLOR_PRESETS[1].value);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'completed' | 'archived'>('active');
  const [editColor, setEditColor] = useState('');

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.username && p.username.toLowerCase().includes(q)) ||
        (p.user_email && p.user_email.toLowerCase().includes(q));

      const matchStatus = selectedStatus === 'all' || p.status === selectedStatus;
      const matchOwner = selectedOwner === 'all' || p.user_id === selectedOwner;

      return matchSearch && matchStatus && matchOwner && !p.is_deleted;
    });
  }, [projects, searchQuery, selectedStatus, selectedOwner]);

  // Aggregate project metrics
  const activeCount = projects.filter((p) => p.status === 'active' && !p.is_deleted).length;
  const completedCount = projects.filter((p) => p.status === 'completed' && !p.is_deleted).length;
  const archivedCount = projects.filter((p) => p.status === 'archived' && !p.is_deleted).length;

  const totalTasksCount = useMemo(() => {
    const fromProjects = projects.reduce((sum, p) => sum + (p.total_tasks || 0), 0);
    return fromProjects || tasks.filter((t) => !t.is_deleted && t.project_id).length;
  }, [projects, tasks]);

  const totalCompletedTasksCount = useMemo(() => {
    const fromProjects = projects.reduce((sum, p) => sum + (p.completed_tasks || 0), 0);
    return fromProjects || tasks.filter((t) => !t.is_deleted && t.project_id && t.status === 'completed').length;
  }, [projects, tasks]);

  const overallCompletionRate = totalTasksCount > 0
    ? Math.round((totalCompletedTasksCount / totalTasksCount) * 100)
    : 0;

  const totalFocusHours = useMemo(() => {
    const mins = projects.reduce((sum, p) => sum + (p.total_focus_minutes || 0), 0);
    return (mins / 60).toFixed(1);
  }, [projects]);

  const handleOpenCreate = () => {
    setNewTitle('');
    setNewDescription('');
    setNewUserId(users.length > 0 ? users[0].id : '');
    setNewStatus('active');
    setNewColor(COLOR_PRESETS[1].value);
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setCreateError('Project title is required');
      return;
    }
    if (onCreateProject) {
      await onCreateProject({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        user_id: newUserId || undefined,
        status: newStatus,
        color: newColor,
      });
    }
    setIsCreateOpen(false);
  };

  const handleOpenEdit = (proj: AdminProject) => {
    setEditingProject(proj);
    setEditTitle(proj.title);
    setEditDescription(proj.description || '');
    setEditStatus(proj.status);
    setEditColor(proj.color || COLOR_PRESETS[0].value);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject || !onUpdateProject) return;
    if (!editTitle.trim()) return;

    await onUpdateProject(editingProject.id, {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      status: editStatus,
      color: editColor || null,
    });
    setEditingProject(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmProject || !onDeleteProject) return;
    await onDeleteProject(deleteConfirmProject.id, hardDelete);
    setDeleteConfirmProject(null);
    setHardDelete(false);
  };

  const handleQuickStatusChange = async (proj: AdminProject, newStat: 'active' | 'completed' | 'archived') => {
    if (!onUpdateProject || proj.status === newStat) return;
    await onUpdateProject(proj.id, { status: newStat });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. Header with Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-medium tracking-tight text-white">
              Projects & Workspaces
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-900 border border-zinc-800 text-zinc-400">
              {projects.length} Total
            </span>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {filteredProjects.length} showing · {activeCount} active · {completedCount} completed · {archivedCount} archived
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={() => onRefresh()}
              disabled={isRefreshing}
              className="h-8 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Refresh project list"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="h-8 px-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Total Projects */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-zinc-500">Total Workspaces</span>
          <div className="mt-2">
            <div className="text-2xl font-light tracking-tight text-white tabular-nums">
              {projects.length}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-1">
              across all registered users
            </div>
          </div>
        </div>

        {/* Metric 2: Active */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-zinc-500">Active</span>
          <div className="mt-2">
            <div className="text-2xl font-light tracking-tight text-emerald-400 tabular-nums">
              {activeCount}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-1">
              {projects.length > 0 ? Math.round((activeCount / projects.length) * 100) : 0}% of all projects
            </div>
          </div>
        </div>

        {/* Metric 3: Task Progress */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-zinc-500">Project Tasks</span>
          <div className="mt-2">
            <div className="text-2xl font-light tracking-tight text-white tabular-nums">
              {totalTasksCount}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-1">
              {overallCompletionRate}% completed ({totalCompletedTasksCount})
            </div>
          </div>
        </div>

        {/* Metric 4: Focus Time */}
        <div className="p-4 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-zinc-500">Focus Hours</span>
          <div className="mt-2">
            <div className="text-2xl font-light tracking-tight text-white tabular-nums">
              {totalFocusHours} <span className="text-xs text-zinc-500 font-normal">hrs</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-1">
              logged across projects
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search, Filter & View Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search projects by title, description or owner..."
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

        {/* Filters and View Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8 px-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>

          {/* Owner filter (if available) */}
          {users.length > 0 && (
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="h-8 px-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 cursor-pointer max-w-[140px] truncate"
            >
              <option value="all">All Owners</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  @{u.username || u.email}
                </option>
              ))}
            </select>
          )}

          {/* View mode toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Table view"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Content: Table or Grid View */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-2xl bg-zinc-950 border border-subtle-dark py-16 px-4 flex flex-col items-center justify-center text-center gap-2">
          <FolderKanban className="w-8 h-8 text-zinc-600 mb-1" />
          <h3 className="text-sm font-medium text-white">No projects found</h3>
          <p className="text-xs text-zinc-500 max-w-sm">
            {searchQuery || selectedStatus !== 'all' || selectedOwner !== 'all'
              ? 'Try modifying your search or clearing active filters to view other projects.'
              : 'No projects have been provisioned in the system yet. Click "New Project" to create one.'}
          </p>
          {(searchQuery || selectedStatus !== 'all' || selectedOwner !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedStatus('all');
                setSelectedOwner('all');
              }}
              className="mt-2 text-xs font-mono text-zinc-400 hover:text-white underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="rounded-2xl bg-zinc-950 border border-subtle-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-subtle-dark text-zinc-400 font-mono text-[10px] tracking-wider uppercase bg-zinc-900/30">
                  <th className="py-3 px-5 font-medium">Project</th>
                  <th className="py-3 px-5 font-medium">Owner</th>
                  <th className="py-3 px-5 font-medium">Status</th>
                  <th className="py-3 px-5 font-medium">Task Progress</th>
                  <th className="py-3 px-5 font-medium">Focus Logged</th>
                  <th className="py-3 px-5 font-medium">Created</th>
                  <th className="py-3 px-5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60">
                {filteredProjects.map((proj) => {
                  const totalT = proj.total_tasks || 0;
                  const completedT = proj.completed_tasks || 0;
                  const percent = totalT > 0 ? Math.round((completedT / totalT) * 100) : 0;
                  const projColor = proj.color || '#64748B';

                  return (
                    <tr key={proj.id} className="hover:bg-zinc-900/30 transition-colors">
                      {/* Project Title & Color Accent */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: projColor }}
                          />
                          <div>
                            <div className="font-medium text-white flex items-center gap-1.5">
                              <span>{proj.title}</span>
                            </div>
                            {proj.description && (
                              <div className="text-[11px] text-zinc-500 font-light truncate max-w-xs mt-0.5">
                                {proj.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-mono text-zinc-400">
                            {(proj.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-zinc-300 font-mono text-[11px]">
                              @{proj.username || 'user'}
                            </span>
                            {proj.user_email && (
                              <span className="text-[10px] text-zinc-600 truncate max-w-[120px]">
                                {proj.user_email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              proj.status === 'active'
                                ? 'bg-emerald-400'
                                : proj.status === 'completed'
                                ? 'bg-blue-400'
                                : 'bg-zinc-500'
                            }`}
                          />
                          <span className="text-zinc-300 capitalize">
                            {proj.status}
                          </span>
                        </div>
                      </td>

                      {/* Task Progress */}
                      <td className="py-3.5 px-5">
                        <div className="flex flex-col gap-1 w-32">
                          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                            <span>{completedT}/{totalT} tasks</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 transition-all rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Focus Logged */}
                      <td className="py-3.5 px-5 text-zinc-400 font-mono tabular-nums text-[11px]">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          <span>
                            {proj.total_focus_minutes ? `${Math.round(proj.total_focus_minutes)}m` : '0m'}
                          </span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-5 text-zinc-500 font-mono text-[11px]">
                        {new Date(proj.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick status dropdown / toggle */}
                          <button
                            onClick={() =>
                              handleQuickStatusChange(
                                proj,
                                proj.status === 'active' ? 'completed' : 'active'
                              )
                            }
                            className="p-1.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title={proj.status === 'active' ? 'Mark Completed' : 'Mark Active'}
                          >
                            <CheckCircle2
                              className={`w-3.5 h-3.5 ${
                                proj.status === 'completed' ? 'text-blue-400' : ''
                              }`}
                            />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => handleOpenEdit(proj)}
                            className="p-1.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Edit Project"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => {
                              setDeleteConfirmProject(proj);
                              setHardDelete(false);
                            }}
                            className="p-1.5 rounded-lg bg-zinc-900/60 hover:bg-red-500/20 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete or Archive Project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((proj) => {
            const totalT = proj.total_tasks || 0;
            const completedT = proj.completed_tasks || 0;
            const percent = totalT > 0 ? Math.round((completedT / totalT) * 100) : 0;
            const projColor = proj.color || '#64748B';

            return (
              <div
                key={proj.id}
                className="p-5 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between gap-4 hover:border-zinc-800 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: projColor }}
                      />
                      <h3 className="font-medium text-white text-sm tracking-tight truncate max-w-[180px]">
                        {proj.title}
                      </h3>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono capitalize ${
                        proj.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : proj.status === 'completed'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}
                    >
                      {proj.status}
                    </span>
                  </div>

                  {proj.description && (
                    <p className="text-xs text-zinc-500 font-light line-clamp-2 mb-3">
                      {proj.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span>Tasks: {completedT}/{totalT}</span>
                      <span>{percent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer of card */}
                <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400 truncate">
                    <UserIcon className="w-3 h-3 text-zinc-500 shrink-0" />
                    <span className="truncate">@{proj.username || 'user'}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(proj)}
                      className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirmProject(proj);
                        setHardDelete(false);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Create Project Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-medium">Create New Project</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile App Redesign"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of goals and objectives"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              {users.length > 0 && (
                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                    Assign Owner
                  </label>
                  <select
                    value={newUserId}
                    onChange={(e) => setNewUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        @{u.username || u.email} {u.role === 'admin' ? '(Admin)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                    Initial Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                    Color Accent
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewColor(color.value)}
                        className={`w-5 h-5 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                          newColor === color.value ? 'scale-125 ring-2 ring-white/50' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      >
                        {newColor === color.value && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-900 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-medium transition-colors cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-zinc-300" />
                <h3 className="text-base font-medium">Edit Project</h3>
              </div>
              <button
                onClick={() => setEditingProject(null)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-mono text-[11px] mb-1">
                    Color Accent
                  </label>
                  <div className="flex items-center gap-1.5 pt-1">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setEditColor(color.value)}
                        className={`w-5 h-5 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                          editColor === color.value ? 'scale-125 ring-2 ring-white/50' : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      >
                        {editColor === color.value && <Check className="w-2.5 h-2.5 text-white" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-900 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-medium transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Modal */}
      {deleteConfirmProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-zinc-950 border border-red-500/20 p-6 shadow-2xl flex flex-col gap-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-medium text-white">
                  Delete Project '{deleteConfirmProject.title}'?
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  This project contains {deleteConfirmProject.total_tasks || 0} associated tasks.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hardDelete}
                  onChange={(e) => setHardDelete(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-red-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-zinc-300 font-medium">
                  Permanently purge from database (Hard delete)
                </span>
              </label>
              <p className="text-[11px] text-zinc-500 ml-5 font-light">
                {hardDelete
                  ? 'Warning: This will expunge the project and permanently purge all linked tasks and sessions.'
                  : 'Soft delete: The project will be marked as deleted and hidden from users, but can be recovered.'}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProject(null)}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                {hardDelete ? 'Permanently Purge' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
