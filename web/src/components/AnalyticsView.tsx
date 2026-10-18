import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { soundManager } from '../utils/sound';
import type { FocusSession, FocusStats, Project, Task } from '../types';
import {
  AnalyticsHeader,
  AnalyticsKpiCards,
  DailySprintWidget,
  MilestoneProgressWidget,
  ActivityHeatmapWidget,
  ProjectTasksTable,
  groupCompletedTasksByDate,
  calculateTotalFocusMinutes,
  calculateWeeklyChartData,
  calculateActivityData,
  getWeekRangeLabel,
  parseToDateKey,
} from './analytics';
import { EditProjectModal } from './projects';
import { EditTaskModal } from './tasks';

interface AnalyticsViewProps {
  stats: FocusStats | null;
  tasks: Task[];
  projects?: Project[];
  onRefresh?: () => Promise<void> | void;
  onOpenAuth?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  stats,
  tasks,
  projects = [],
  onRefresh,
  onOpenAuth,
}) => {
  const {
    user,
    theme,
    analyticsProjectId,
    setAnalyticsProjectId,
    setTaskProjectFilter,
    setActiveTab,
    selectAndStartTask,
    clearTaskTimer,
    addToast,
  } = useStore();

  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [taskTableTab, setTaskTableTab] = useState<'all' | 'todo' | 'completed'>('all');
  const [chartMetric, setChartMetric] = useState<'tasks' | 'time'>('tasks');
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Load sessions from API
  const loadSessions = useCallback(async () => {
    try {
      const data = await api.listFocusSessions();
      setSessions(data);
    } catch {
      // quiet fail
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, loadSessions]);

  // Active Projects
  const activeProjects = useMemo(
    () => projects.filter((p) => !p.is_deleted),
    [projects]
  );

  const currentProject = useMemo(() => {
    if (!analyticsProjectId) return null;
    return activeProjects.find((p) => p.id === analyticsProjectId) || null;
  }, [activeProjects, analyticsProjectId]);

  // Filter tasks belonging to current project or all workspace
  const scopeTasks = useMemo(() => {
    if (currentProject) {
      return tasks.filter((t) => t.project_id === currentProject.id && !t.is_deleted);
    }
    return tasks.filter((t) => !t.is_deleted);
  }, [tasks, currentProject]);

  const completedTasks = useMemo(
    () => scopeTasks.filter((t) => t.status === 'completed'),
    [scopeTasks]
  );

  const pendingTasks = useMemo(
    () => scopeTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled'),
    [scopeTasks]
  );

  // Filter sessions belonging to tasks in scope
  const scopeSessions = useMemo(() => {
    if (currentProject) {
      const pTaskIds = new Set(scopeTasks.map((t) => t.id));
      return sessions.filter((s) => s.status === 'completed' && pTaskIds.has(s.task_id));
    }
    return sessions.filter((s) => s.status === 'completed');
  }, [sessions, scopeTasks, currentProject]);

  // Group completed tasks by date string
  const completedTasksByDate = useMemo(() => {
    return groupCompletedTasksByDate(completedTasks);
  }, [completedTasks]);

  // Dynamic Metrics
  const totalFocusMinutes = useMemo(() => {
    return calculateTotalFocusMinutes(scopeSessions, completedTasks, currentProject, stats);
  }, [scopeSessions, completedTasks, currentProject, stats]);

  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  const completionRate = useMemo(() => {
    return scopeTasks.length > 0
      ? Math.round((completedTasks.length / scopeTasks.length) * 100)
      : 0;
  }, [scopeTasks, completedTasks]);

  // 16-Week Activity Heatmap Data
  const activityData = useMemo(() => {
    return calculateActivityData(completedTasksByDate);
  }, [completedTasksByDate]);

  // 7-Day Sprint Focus & Task Distribution
  const targetWeekDate = useMemo(() => {
    const today = new Date();
    if (weekOffset === 0) return today;
    const d = new Date(today);
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekRangeLabel = useMemo(() => {
    return getWeekRangeLabel(targetWeekDate, weekOffset);
  }, [targetWeekDate, weekOffset]);

  const weeklyChartData = useMemo(() => {
    return calculateWeeklyChartData(targetWeekDate, scopeSessions, completedTasksByDate);
  }, [targetWeekDate, scopeSessions, completedTasksByDate]);

  const thisWeekTotalMinutes = useMemo(() => {
    return weeklyChartData.reduce((acc, d) => acc + d.minutes, 0);
  }, [weeklyChartData]);

  const thisWeekTotalTasks = useMemo(() => {
    return weeklyChartData.reduce((acc, d) => acc + d.tasksCompleted, 0);
  }, [weeklyChartData]);

  const maxWeeklyTasks = useMemo(() => {
    const max = Math.max(...weeklyChartData.map((d) => d.tasksCompleted), 0);
    return Math.max(max, 3);
  }, [weeklyChartData]);

  const maxWeeklyMinutes = useMemo(() => {
    const max = Math.max(...weeklyChartData.map((d) => d.minutes), 0);
    return Math.max(max, 60);
  }, [weeklyChartData]);

  const avgEstimationMinutes = useMemo(() => {
    if (scopeTasks.length === 0) return 25;
    return Math.round(
      scopeTasks.reduce((acc, t) => acc + (t.estimated_minutes || 25), 0) / scopeTasks.length
    );
  }, [scopeTasks]);

  // Filtered task table items (tab + optional day filter)
  const tableTasks = useMemo(() => {
    let list = scopeTasks;
    if (taskTableTab === 'todo') list = pendingTasks;
    else if (taskTableTab === 'completed') list = completedTasks;

    if (selectedDateKey) {
      list = list.filter((t) => {
        const dateKey =
          parseToDateKey(t.completed_at) ||
          parseToDateKey(t.updated_at) ||
          parseToDateKey(t.created_at);
        return dateKey === selectedDateKey;
      });
    }
    return list;
  }, [taskTableTab, pendingTasks, completedTasks, scopeTasks, selectedDateKey]);

  // Toggle Task Status
  const handleToggleTaskStatus = async (task: Task) => {
    if (!user) {
      onOpenAuth?.();
      return;
    }
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      if (nextStatus === 'completed') {
        clearTaskTimer(task.id);
        soundManager.playComplete();
      }
      await loadSessions();
      onRefresh?.();
      addToast(
        nextStatus === 'completed'
          ? `Completed "${task.title}"`
          : `Moved "${task.title}" to To Do`,
        'success'
      );
    } catch (err: any) {
      addToast(err.message || 'Failed to update task', 'error');
    }
  };

  // Start Sprint on clicked task
  const handleStartTaskSprint = (task: Task) => {
    selectAndStartTask(task.id, task.estimated_minutes);
    soundManager.playStart();
    addToast(`Focus sprint started for "${task.title}"`, 'success');
    setActiveTab('dashboard');
  };

  // Delete task directly
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      addToast('Task deleted', 'info');
      await loadSessions();
      onRefresh?.();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete task', 'error');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-6 md:px-10 flex flex-col gap-8 transition-colors select-none">
      {/* 1. Header with Breadcrumbs & Switcher */}
      <AnalyticsHeader
        currentProject={currentProject}
        activeProjects={activeProjects}
        analyticsProjectId={analyticsProjectId}
        onSelectProject={(id) => setAnalyticsProjectId(id)}
        onBackToProjects={() => {
          setAnalyticsProjectId(null);
          setActiveTab('projects');
        }}
        onViewBacklog={(pId) => {
          setTaskProjectFilter(pId);
          setActiveTab('tasks');
        }}
        onEditProject={(proj) => setEditingProject(proj)}
      />

      {/* 2. Dynamic KPI Cards */}
      <AnalyticsKpiCards
        totalFocusHours={totalFocusHours}
        totalFocusMinutes={totalFocusMinutes}
        pendingCount={pendingTasks.length}
        completedCount={completedTasks.length}
        totalCount={scopeTasks.length}
        completionRate={completionRate}
      />

      {/* 3. Daily Sprint Distribution & Milestone Health Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <DailySprintWidget
            weeklyChartData={weeklyChartData}
            weekRangeLabel={weekRangeLabel}
            chartMetric={chartMetric}
            onToggleMetric={setChartMetric}
            weekOffset={weekOffset}
            onPrevWeek={() => setWeekOffset((prev) => prev - 1)}
            onNextWeek={() => setWeekOffset((prev) => prev + 1)}
            onResetWeek={() => setWeekOffset(0)}
            selectedDateKey={selectedDateKey}
            onSelectDate={setSelectedDateKey}
            thisWeekTotalTasks={thisWeekTotalTasks}
            thisWeekTotalMinutes={thisWeekTotalMinutes}
            maxWeeklyTasks={maxWeeklyTasks}
            maxWeeklyMinutes={maxWeeklyMinutes}
          />
        </div>

        <div className="lg:col-span-5">
          <MilestoneProgressWidget
            completedCount={completedTasks.length}
            totalCount={scopeTasks.length}
            completionRate={completionRate}
            pendingCount={pendingTasks.length}
            sessionsCount={scopeSessions.length}
            avgEstimationMinutes={avgEstimationMinutes}
            onOpenBacklog={() => {
              if (currentProject) {
                setTaskProjectFilter(currentProject.id);
              }
              setActiveTab('tasks');
            }}
          />
        </div>
      </div>

      {/* 4. 16-Week Activity Heatmap */}
      <ActivityHeatmapWidget
        title={currentProject ? `${currentProject.title} Activity` : 'Daily Activity'}
        completedCount={completedTasks.length}
        activityData={activityData}
        completedTasksByDate={completedTasksByDate}
        theme={theme}
      />

      {/* 5. Filterable Tasks Table */}
      <ProjectTasksTable
        currentProject={currentProject}
        tasks={tableTasks}
        allCount={scopeTasks.length}
        todoCount={pendingTasks.length}
        completedCount={completedTasks.length}
        activeTab={taskTableTab}
        onTabChange={setTaskTableTab}
        selectedDateKey={selectedDateKey}
        onClearDateFilter={() => setSelectedDateKey(null)}
        onToggleTaskStatus={handleToggleTaskStatus}
        onStartTaskSprint={handleStartTaskSprint}
        onEditTask={(task) => setEditingTask(task)}
        onDeleteTask={handleDeleteTask}
      />

      {/* 6. Edit Project Modal */}
      <EditProjectModal
        project={editingProject}
        isOpen={Boolean(editingProject)}
        onClose={() => setEditingProject(null)}
        onRefresh={() => {
          onRefresh?.();
        }}
      />

      {/* 7. Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        projects={projects}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onDelete={handleDeleteTask}
        onRefresh={async () => {
          await loadSessions();
          onRefresh?.();
        }}
      />
    </div>
  );
};
