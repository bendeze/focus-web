import React from 'react';
import { useStore } from '../store/useStore';
import type { Project, Task, FocusStats } from '../types';
import {
  CheckSquare,
  FolderKanban,
  BarChart3,
  Flame,
  Play,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface DashboardViewProps {
  tasks: Task[];
  projects: Project[];
  stats: FocusStats | null;
  onOpenAuth?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  projects,
  stats,
}) => {
  const { user, setActiveTab, setSelectedTaskId, isTimerRunning, remainingSeconds } = useStore();

  const activeTasks = tasks.filter((t) => t.status !== 'completed' && !t.is_deleted);
  const completedTasks = tasks.filter((t) => t.status === 'completed' && !t.is_deleted);
  const activeProjects = projects.filter((p) => !p.is_deleted);

  const formatMinSec = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartFocus = (taskId?: string) => {
    if (taskId) {
      setSelectedTaskId(taskId);
    }
    setActiveTab('focus');
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-badge uppercase text-light-textSecondary dark:text-dark-textSecondary mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Productivity Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-light-text dark:text-dark-text">
            {user ? `Hello, ${user.full_name?.split(' ')[0] || user.username || 'Focus Runner'}` : 'Stay in the Flow'}
          </h1>
        </div>

        <button
          onClick={() => handleStartFocus()}
          className="h-12 px-6 rounded-full bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg text-xs font-bold tracking-brand uppercase flex items-center gap-2.5 hover:opacity-90 active:scale-95 transition-all shadow-xl self-start sm:self-auto"
        >
          {isTimerRunning ? (
            <>
              <Flame className="w-4 h-4 fill-current stroke-none animate-pulse" />
              <span>Resume ({formatMinSec(remainingSeconds)})</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current stroke-none" />
              <span>Start Focus Sprint</span>
            </>
          )}
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('analytics')}
          className="p-5 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-sm hover:border-light-text dark:hover:border-dark-text transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-light-textSecondary dark:text-dark-textSecondary mb-2">
            <span className="text-[10px] font-bold uppercase tracking-badge">Focus Time</span>
            <Flame className="w-4 h-4 text-light-text dark:text-dark-text" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black tabular-nums text-light-text dark:text-dark-text">
              {stats?.total_focus_minutes || 0}
              <span className="text-xs font-normal text-light-textSecondary dark:text-dark-textSecondary ml-1">mins</span>
            </div>
            <p className="text-[10px] text-light-textSecondary dark:text-dark-textSecondary mt-0.5">
              {stats?.completed_sessions_count || 0} sprints completed
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('tasks')}
          className="p-5 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-sm hover:border-light-text dark:hover:border-dark-text transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-light-textSecondary dark:text-dark-textSecondary mb-2">
            <span className="text-[10px] font-bold uppercase tracking-badge">Active Backlog</span>
            <CheckSquare className="w-4 h-4 text-light-text dark:text-dark-text" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black tabular-nums text-light-text dark:text-dark-text">
              {activeTasks.length}
            </div>
            <p className="text-[10px] text-light-textSecondary dark:text-dark-textSecondary mt-0.5">
              {completedTasks.length} done
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('projects')}
          className="p-5 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-sm hover:border-light-text dark:hover:border-dark-text transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-light-textSecondary dark:text-dark-textSecondary mb-2">
            <span className="text-[10px] font-bold uppercase tracking-badge">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-light-text dark:text-dark-text" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black tabular-nums text-light-text dark:text-dark-text">
              {activeProjects.length}
            </div>
            <p className="text-[10px] text-light-textSecondary dark:text-dark-textSecondary mt-0.5">
              Organized milestones
            </p>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('analytics')}
          className="p-5 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-sm hover:border-light-text dark:hover:border-dark-text transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-light-textSecondary dark:text-dark-textSecondary mb-2">
            <span className="text-[10px] font-bold uppercase tracking-badge">Completion Rate</span>
            <BarChart3 className="w-4 h-4 text-light-text dark:text-dark-text" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black tabular-nums text-light-text dark:text-dark-text">
              {tasks.length > 0
                ? Math.round((completedTasks.length / tasks.filter(t => !t.is_deleted).length) * 100)
                : 0}%
            </div>
            <p className="text-[10px] text-light-textSecondary dark:text-dark-textSecondary mt-0.5">
              Task velocity
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Next Up Tasks (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-badge text-light-text dark:text-dark-text">
                Next Up Backlog
              </h2>
              <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary">
                Priority items ready for your next focus sprint
              </p>
            </div>

            <button
              onClick={() => setActiveTab('tasks')}
              className="text-xs font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeTasks.length === 0 ? (
            <div className="py-10 text-center text-xs text-light-textSecondary dark:text-dark-textSecondary">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-light-text dark:text-dark-text" />
              <span>Backlog is clear! Add a task to start tracking.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-2xl bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border flex items-center justify-between gap-3 hover:border-light-text dark:hover:border-dark-text transition-colors"
                >
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-semibold text-light-text dark:text-dark-text truncate">
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-bold uppercase tracking-wider text-light-textSecondary dark:text-dark-textSecondary">
                      <span className="px-2 py-0.2 rounded-full bg-light-fill dark:bg-dark-fill">
                        {task.priority}
                      </span>
                      <span>~{task.estimated_minutes}m</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartFocus(task.id)}
                    className="px-3 py-1.5 rounded-full bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg text-xs font-bold tracking-brand uppercase flex items-center gap-1 hover:opacity-90 active:scale-95 transition-all shadow-sm flex-shrink-0"
                  >
                    <Play className="w-3 h-3 fill-current stroke-none" />
                    <span>Sprint</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects Summary (1 Col) */}
        <div className="p-6 rounded-3xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-badge text-light-text dark:text-dark-text">
                  Projects
                </h2>
                <p className="text-xs text-light-textSecondary dark:text-dark-textSecondary">
                  Goal milestones
                </p>
              </div>

              <button
                onClick={() => setActiveTab('projects')}
                className="text-xs font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeProjects.length === 0 ? (
              <div className="py-8 text-center text-xs text-light-textSecondary dark:text-dark-textSecondary">
                <span>No active projects yet.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {activeProjects.slice(0, 3).map((project) => {
                  const percent = project.total_tasks > 0
                    ? Math.round((project.completed_tasks / project.total_tasks) * 100)
                    : 0;

                  return (
                    <div
                      key={project.id}
                      onClick={() => setActiveTab('projects')}
                      className="cursor-pointer group"
                    >
                      <div className="flex justify-between items-center text-xs font-semibold text-light-text dark:text-dark-text mb-1">
                        <span className="truncate group-hover:underline">{project.title}</span>
                        <span className="tabular-nums text-light-textSecondary dark:text-dark-textSecondary">{percent}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-light-fill dark:bg-dark-fill overflow-hidden">
                        <div
                          className="h-full bg-light-text dark:bg-dark-text rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('projects')}
            className="w-full mt-6 py-2.5 rounded-2xl bg-light-fill dark:bg-dark-fill text-light-text dark:text-dark-text text-xs font-bold tracking-brand uppercase hover:bg-light-text hover:text-light-bg dark:hover:bg-dark-text dark:hover:text-dark-bg transition-colors"
          >
            Manage Projects
          </button>
        </div>
      </div>
    </div>
  );
};
