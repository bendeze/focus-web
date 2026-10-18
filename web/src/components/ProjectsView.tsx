import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import type { Project, Task } from '../types';
import { Plus, FolderKanban } from 'lucide-react';
import { ProjectMetrics, ProjectCard, CreateProjectModal, EditProjectModal } from './projects';

interface ProjectsViewProps {
  projects: Project[];
  tasks?: Task[];
  onRefresh: () => void;
  onOpenAuth?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  tasks = [],
  onRefresh,
  onOpenAuth,
}) => {
  const {
    user,
    setActiveTab,
    setTaskProjectFilter,
    setAnalyticsProjectId,
    addToast,
  } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const activeProjects = useMemo(
    () => projects.filter((p) => !p.is_deleted),
    [projects]
  );

  // 100% Dynamic Global Projects Metrics
  const projectTasks = useMemo(
    () => tasks.filter((t) => !t.is_deleted && t.project_id !== null),
    [tasks]
  );

  const completedProjectTasks = useMemo(
    () => projectTasks.filter((t) => t.status === 'completed'),
    [projectTasks]
  );

  const backlogProjectTasks = useMemo(
    () => projectTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled'),
    [projectTasks]
  );

  const getTaskFocusMinutes = (t: Task) => {
    if (t.total_focus_minutes > 0) return t.total_focus_minutes;
    if (t.status === 'completed') return t.estimated_minutes || 25;
    return 0;
  };

  const totalProjectFocusMinutes = useMemo(
    () => projectTasks.reduce((sum, t) => sum + getTaskFocusMinutes(t), 0),
    [projectTasks]
  );

  const overallCompletionRate = useMemo(() => {
    return projectTasks.length > 0
      ? Math.round((completedProjectTasks.length / projectTasks.length) * 100)
      : 0;
  }, [projectTasks, completedProjectTasks]);

  const handleCreateProject = async (title: string, description: string) => {
    if (!user) {
      onOpenAuth?.();
      return;
    }
    try {
      await api.createProject({
        title,
        description: description || undefined,
      });
      addToast('Project created', 'success');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to create project', 'error');
      throw err;
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
    <div className="w-full max-w-7xl mx-auto py-8 px-6 md:px-10 flex flex-col gap-8 transition-colors select-none">
      {/* 1. Header Overview & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            <span className="tracking-wide uppercase text-[10px]">
              Workspace Directory
            </span>
            <span className="opacity-40">·</span>
            <span className="tracking-wide uppercase text-[10px]">
              {activeProjects.length} {activeProjects.length === 1 ? 'Active Project' : 'Active Projects'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white dark:text-white light:text-black">
            Projects & Goals
          </h1>
        </div>

        <button
          onClick={() => {
            if (!user) onOpenAuth?.();
            else setIsModalOpen(true);
          }}
          className="h-9 px-4 rounded-full text-xs font-medium flex items-center gap-2 bg-white dark:bg-white text-black light:bg-black light:text-white hover:opacity-90 active:scale-[0.85] transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <ProjectMetrics
        activeProjectsCount={activeProjects.length}
        projectTasksCount={projectTasks.length}
        backlogTasksCount={backlogProjectTasks.length}
        completedTasksCount={completedProjectTasks.length}
        totalFocusHours={(totalProjectFocusMinutes / 60).toFixed(1)}
        totalFocusMinutes={totalProjectFocusMinutes}
        overallCompletionRate={overallCompletionRate}
      />

      {/* 3. Projects Grid */}
      {activeProjects.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-zinc-950/95 dark:bg-zinc-950/95 light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900/80 dark:bg-zinc-900/80 light:bg-zinc-100 flex items-center justify-center text-zinc-500">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white dark:text-white light:text-black">
            No projects created yet
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 light:text-zinc-500 max-w-sm">
            Group your tasks into milestone goals, track deep focus sprints, and analyze project performance.
          </p>
          <button
            onClick={() => {
              if (!user) onOpenAuth?.();
              else setIsModalOpen(true);
            }}
            className="mt-2 h-9 px-4 rounded-full bg-white dark:bg-white text-black light:bg-black light:text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            Create first project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              tasks={tasks}
              onClick={() => {
                setAnalyticsProjectId(project.id);
                setActiveTab('analytics');
              }}
              onEdit={(proj, e) => {
                e.stopPropagation();
                setEditingProject(proj);
              }}
              onDelete={handleDeleteProject}
              onViewBacklog={(pId, e) => {
                e.stopPropagation();
                setTaskProjectFilter(pId);
                setActiveTab('tasks');
              }}
            />
          ))}
        </div>
      )}

      {/* 4. Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* 5. Edit Project Modal */}
      <EditProjectModal
        project={editingProject}
        isOpen={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
        onRefresh={onRefresh}
      />
    </div>
  );
};
