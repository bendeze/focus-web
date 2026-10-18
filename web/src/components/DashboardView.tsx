import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { PomodoroTimerWidget } from './PomodoroTimerWidget';
import { soundManager } from '../utils/sound';
import type { FocusSession, FocusStats, Project, Task } from '../types';
import {
  DashboardHeader,
  DashboardMetrics,
  DashboardNextUp,
  WeeklyFocusWidget,
  ActivityHeatmapSection,
  DashboardFooter,
  calculateWeeklyAnalytics,
  calculateActivityData,
  calculateDashboardMetrics,
  getCompletedTasksByDate,
} from './dashboard';
import { EditTaskModal } from './tasks';

interface DashboardViewProps {
  stats: FocusStats | null;
  projects: Project[];
  tasks: Task[];
  onOpenAuth: () => void;
  onRefresh?: () => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  projects,
  tasks,
  onOpenAuth,
  onRefresh,
}) => {
  const {
    user,
    theme,
    setActiveTab,
    selectedTaskId,
    isTimerRunning,
    selectAndStartTask,
    pauseCurrentTimer,
    resumeCurrentTimer,
    clearTaskTimer,
    addToast,
  } = useStore();

  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Load completed focus sessions for analytics
  const loadSessions = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.listFocusSessions();
      setSessions(data);
    } catch {
      // quiet fail
    }
  }, [user]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions, tasks]);

  // Formatted Current Date (e.g. FRIDAY, OCTOBER 9)
  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).toUpperCase();
  }, []);

  // Filter tasks
  const activeTasks = useMemo(() => {
    return tasks.filter((t) => !t.is_deleted);
  }, [tasks]);

  const pendingTasks = useMemo(() => {
    return activeTasks
      .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
      .sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });
  }, [activeTasks]);

  const completedTasks = useMemo(() => {
    return activeTasks.filter((t) => t.status === 'completed');
  }, [activeTasks]);

  // Group completed tasks by date string (YYYY-MM-DD)
  const completedTasksByDate = useMemo(() => {
    return getCompletedTasksByDate(tasks);
  }, [tasks]);

  // 7-Day Focus Performance & Comparison against Last Week
  const weeklyAnalytics = useMemo(() => {
    return calculateWeeklyAnalytics(sessions, completedTasksByDate);
  }, [sessions, completedTasksByDate]);

  // 100% Dynamic Dashboard Metrics (Focus hours, Backlog, Projects, Completion + Trends)
  const metrics = useMemo(() => {
    return calculateDashboardMetrics({
      stats,
      sessions,
      tasks,
      projects,
      weeklyAnalytics,
      completedTasksByDate,
    });
  }, [stats, sessions, tasks, projects, weeklyAnalytics, completedTasksByDate]);

  // Continuous activity array for the last 16 weeks
  const activityData = useMemo(() => {
    return calculateActivityData(completedTasksByDate);
  }, [completedTasksByDate]);

  // Instant Task Switcher when clicking on a task row in Next Up
  const handleStartTaskTimer = (task: Task) => {
    selectAndStartTask(task.id, task.estimated_minutes);
    soundManager.playStart();
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      if (nextStatus === 'completed') {
        clearTaskTimer(task.id);
        soundManager.playComplete();
      }
      await loadSessions();
      onRefresh?.();
    } catch (err: any) {
      addToast(err.message || 'Failed to update task', 'error');
    }
  };

  const handleToggleSprint = () => {
    if (isTimerRunning) {
      pauseCurrentTimer();
      return;
    }

    if (!user) {
      onOpenAuth();
      return;
    }

    soundManager.playStart();
    if (selectedTaskId) {
      resumeCurrentTimer();
    } else if (pendingTasks.length > 0) {
      const firstTask = pendingTasks[0];
      selectAndStartTask(firstTask.id, firstTask.estimated_minutes);
    } else {
      resumeCurrentTimer();
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-6 md:px-10 flex flex-col gap-8 transition-colors">
      
      {/* 1. Header Overview & Live Status */}
      <DashboardHeader
        currentDateFormatted={currentDateFormatted}
        isTimerRunning={isTimerRunning}
        onToggleSprint={handleToggleSprint}
      />

      {/* 2. Top Metrics Cards (4 Stats Row - 100% Dynamic) */}
      <DashboardMetrics
        focusHours={metrics.focusHours}
        focusTrend={metrics.focusTrend}
        backlogCount={metrics.backlogCount}
        backlogSubtitle={metrics.backlogSubtitle}
        projectsCount={metrics.projectsCount}
        projectsSubtitle={metrics.projectsSubtitle}
        completionRate={metrics.completionRate}
        completionTrend={metrics.completionTrend}
      />

      {/* 3. Main Content Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: "Next Up" Task Manager (7 Cols) */}
        <DashboardNextUp
          pendingTasks={pendingTasks}
          completedTasksCount={completedTasks.length}
          totalActiveTasksCount={activeTasks.length}
          projects={projects}
          selectedTaskId={selectedTaskId}
          isTimerRunning={isTimerRunning}
          onSelectTask={handleStartTaskTimer}
          onToggleStatus={handleToggleTaskStatus}
          onViewAllTasks={() => setActiveTab('tasks')}
          onOpenAuth={onOpenAuth}
          onTaskCreated={onRefresh}
          onEditTask={(task) => setEditingTask(task)}
        />

        {/* RIGHT COLUMN: Widgets (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <PomodoroTimerWidget
            tasks={tasks}
            onSessionFinished={onRefresh}
          />

          <WeeklyFocusWidget
            weeklyAnalytics={weeklyAnalytics}
            completedTasksByDate={completedTasksByDate}
            theme={theme}
          />
        </div>

      </div>

      {/* 4. Bottom Section: Daily Activity Contribution Heatmap */}
      <ActivityHeatmapSection
        activityData={activityData}
        completedTasksByDate={completedTasksByDate}
        completedTasksCount={completedTasks.length}
        theme={theme}
      />

      {/* 5. Footer Metadata */}
      <DashboardFooter />

      {/* 6. Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        projects={projects}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onRefresh={() => {
          loadSessions();
          onRefresh?.();
        }}
      />

    </div>
  );
};
