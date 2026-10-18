import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import type { Task, Project } from '../types';
import {
  TaskHeader,
  TaskMetrics,
  TaskCreateCard,
  WorkspaceTasksTable,
  EditTaskModal,
} from './tasks';

interface TasksViewProps {
  tasks: Task[];
  projects: Project[];
  onRefresh: () => void;
  onOpenAuth?: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  projects,
  onRefresh,
  onOpenAuth,
}) => {
  const {
    user,
    selectedTaskId,
    isTimerRunning,
    selectAndStartTask,
    setActiveTab,
    addToast,
    taskProjectFilter,
    setTaskProjectFilter,
  } = useStore();

  const [selectedStatus, setSelectedStatus] = useState<'all' | 'todo' | 'completed'>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Non-deleted tasks pool
  const nonDeletedTasks = useMemo(
    () => tasks.filter((task) => !task.is_deleted),
    [tasks]
  );

  // Todo backlog tasks
  const todoTasks = useMemo(
    () => nonDeletedTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled'),
    [nonDeletedTasks]
  );

  // In-focus active tasks
  const inProgressTasks = useMemo(
    () => nonDeletedTasks.filter((t) => t.status === 'in_progress' || (selectedTaskId === t.id && isTimerRunning)),
    [nonDeletedTasks, selectedTaskId, isTimerRunning]
  );

  // Completed tasks
  const completedTasks = useMemo(
    () => nonDeletedTasks.filter((t) => t.status === 'completed'),
    [nonDeletedTasks]
  );

  // Focus minutes logged
  const totalFocusMinutes = useMemo(() => {
    return nonDeletedTasks.reduce((sum, t) => {
      if (t.total_focus_minutes > 0) return sum + t.total_focus_minutes;
      if (t.status === 'completed') return sum + (t.estimated_minutes || 25);
      return sum;
    }, 0);
  }, [nonDeletedTasks]);

  const completionRate = useMemo(() => {
    return nonDeletedTasks.length > 0
      ? Math.round((completedTasks.length / nonDeletedTasks.length) * 100)
      : 0;
  }, [nonDeletedTasks, completedTasks]);

  // Dynamic filter pipeline
  const filteredTasks = useMemo(() => {
    return nonDeletedTasks.filter((task) => {
      // 1. Project filter
      if (taskProjectFilter === 'standalone' && task.project_id !== null) return false;
      if (taskProjectFilter !== 'all' && taskProjectFilter !== 'standalone' && task.project_id !== taskProjectFilter) {
        return false;
      }

      // 2. Status filter
      if (selectedStatus === 'todo' && task.status === 'completed') return false;
      if (selectedStatus === 'completed' && task.status !== 'completed') return false;

      // 3. Priority filter
      if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description ? task.description.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [nonDeletedTasks, taskProjectFilter, selectedStatus, selectedPriority, searchQuery]);

  const handleToggleComplete = async (task: Task) => {
    if (!user) {
      onOpenAuth?.();
      return;
    }
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      addToast(nextStatus === 'completed' ? `Completed "${task.title}"` : `Moved "${task.title}" to To Do`, 'success');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to update task status', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      addToast('Task deleted', 'info');
      onRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to delete task', 'error');
    }
  };

  const handleStartFocusOnTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    selectAndStartTask(taskId, task?.estimated_minutes || 25);
    setActiveTab('dashboard');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setTaskProjectFilter('all');
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-6 md:px-10 flex flex-col gap-8 transition-colors select-none">
      {/* 1. Header Overview & New Task Button */}
      <TaskHeader
        totalCount={nonDeletedTasks.length}
        isCreating={isCreating}
        onToggleCreate={() => {
          if (!user) onOpenAuth?.();
          else setIsCreating((prev) => !prev);
        }}
      />

      {/* 2. Top Summary KPI Cards (100% Dynamic) */}
      <TaskMetrics
        totalTasksCount={nonDeletedTasks.length}
        todoCount={todoTasks.length}
        inProgressCount={inProgressTasks.length}
        completedCount={completedTasks.length}
        totalFocusHours={(totalFocusMinutes / 60).toFixed(1)}
        completionRate={completionRate}
      />

      {/* 3. Minimalist Add Task Form (Dashboard-inspired, Custom Duration, Priority & Project) */}
      {isCreating && (
        <TaskCreateCard
          projects={projects}
          defaultProjectId={taskProjectFilter}
          onClose={() => setIsCreating(false)}
          onCreated={onRefresh}
          onOpenAuth={onOpenAuth}
        />
      )}

      {/* 4. Sleek Workspace Tasks Table with Integrated Search, Project & Priority Selectors */}
      <WorkspaceTasksTable
        tasks={filteredTasks}
        projects={projects}
        allCount={nonDeletedTasks.length}
        todoCount={todoTasks.length}
        completedCount={completedTasks.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedProjectId={taskProjectFilter}
        onSelectProjectId={setTaskProjectFilter}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        selectedPriority={selectedPriority}
        onSelectPriority={setSelectedPriority}
        onToggleComplete={handleToggleComplete}
        onStartFocus={handleStartFocusOnTask}
        onEditTask={(task) => setEditingTask(task)}
        onDeleteTask={handleDeleteTask}
        onResetFilters={handleResetFilters}
      />

      {/* 5. Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        projects={projects}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        onRefresh={onRefresh}
        onDelete={handleDeleteTask}
      />
    </div>
  );
};
