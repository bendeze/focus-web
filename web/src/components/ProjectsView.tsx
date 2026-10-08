import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import type { Project } from '../types';
import {
  Plus,
  FolderKanban,
  Flame,
  Trash2,
  ArrowRight,
  Loader2,
  X,
} from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  onRefresh: () => void;
  onOpenAuth?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onRefresh,
  onOpenAuth,
}) => {
  const { user, setActiveTab, addToast } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeProjects = projects.filter((p) => !p.is_deleted);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth?.();
      return;
    }
    if (!newTitle.trim()) return;

    setSubmitting(true);
    try {
      await api.createProject({
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
      });
      setNewTitle('');
      setNewDescription('');
      setIsModalOpen(false);
      addToast('Project created', 'success');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to create project', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project and its tasks?')) return;

    try {
      await api.deleteProject(id);
      addToast('Project deleted', 'info');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete project', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-badge uppercase text-light-textSecondary dark:text-dark-textSecondary mb-1">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Project Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-light-text dark:text-dark-text">
            Projects & Goals
          </h1>
        </div>

        <button
          onClick={() => {
            if (!user) onOpenAuth?.();
            else setIsModalOpen(true);
          }}
          className="h-11 px-5 rounded-full bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg text-xs font-bold tracking-brand uppercase flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Project</span>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-glass animate-fade-in">
          <div className="relative w-full max-w-md bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-3xl p-6 sm:p-8 shadow-2xl animate-slide-up text-light-text dark:text-dark-text">
            
            <div className="w-9 h-1 rounded-full bg-light-borderSubtle dark:bg-dark-borderSubtle mx-auto mb-6" />

            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text hover:bg-light-fill dark:hover:bg-dark-fill transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold tracking-brand uppercase mb-1 text-center">
              New Project
            </h2>
            <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary text-center mb-6">
              Group tasks and track sprint progress for major goals
            </p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary mb-1.5">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Mobile App Release"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-sm font-medium focus:outline-none focus:border-light-text dark:focus:border-dark-text text-light-text dark:text-dark-text"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary mb-1.5">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Goals, target milestones, or scope..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border text-xs focus:outline-none focus:border-light-text dark:focus:border-dark-text text-light-text dark:text-dark-text"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-full bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg text-xs font-bold tracking-brand uppercase flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-md mt-4"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create Project</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeProjects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
          <FolderKanban className="w-8 h-8 text-light-textSecondary dark:text-dark-textSecondary mx-auto mb-3 opacity-40" />
          <p className="text-sm font-semibold text-light-textSecondary dark:text-dark-textSecondary">
            No active projects yet
          </p>
          <p className="text-xs text-light-textMuted dark:text-dark-textMuted mt-1">
            Click "New Project" to organize tasks under planning milestones
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {activeProjects.map((project) => {
            const percent = project.total_tasks > 0
              ? Math.round((project.completed_tasks / project.total_tasks) * 100)
              : 0;

            return (
              <div
                key={project.id}
                onClick={() => setActiveTab('tasks')}
                className="group p-6 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border hover:border-light-text dark:hover:border-dark-text transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-light-fill dark:bg-dark-fill text-light-textSecondary dark:text-dark-textSecondary border border-light-border dark:border-dark-border">
                      {project.status}
                    </span>

                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      className="p-1.5 rounded-full text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-light-text dark:text-dark-text mb-1 group-hover:underline">
                    {project.title}
                  </h3>

                  {project.description && (
                    <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary line-clamp-2 mb-4">
                      {project.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border">
                  <div className="flex items-center justify-between text-xs font-medium text-light-textSecondary dark:text-dark-textSecondary mb-2">
                    <span>{project.completed_tasks} of {project.total_tasks} tasks done</span>
                    <span className="font-bold text-light-text dark:text-dark-text tabular-nums">{percent}%</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-light-fill dark:bg-dark-fill overflow-hidden mb-4">
                    <div
                      className="h-full bg-light-text dark:bg-dark-text rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-light-textSecondary dark:text-dark-textSecondary">
                    <span className="flex items-center gap-1.5 text-light-text dark:text-dark-text">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{project.total_focus_minutes}m Focus</span>
                    </span>

                    <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>View Backlog</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
