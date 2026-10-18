import React, { useState } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { Task, Project } from '../../types';
import { DashboardTaskRow } from './DashboardTaskRow';
import { DashboardAddTaskForm } from './DashboardAddTaskForm';

interface DashboardNextUpProps {
  pendingTasks: Task[];
  completedTasksCount: number;
  totalActiveTasksCount: number;
  projects: Project[];
  selectedTaskId: string | null;
  isTimerRunning: boolean;
  onSelectTask: (task: Task) => void;
  onToggleStatus: (task: Task) => void;
  onViewAllTasks: () => void;
  onOpenAuth: () => void;
  onTaskCreated?: () => void;
  onEditTask?: (task: Task) => void;
}

export const DashboardNextUp: React.FC<DashboardNextUpProps> = ({
  pendingTasks,
  completedTasksCount,
  totalActiveTasksCount,
  projects,
  selectedTaskId,
  isTimerRunning,
  onSelectTask,
  onToggleStatus,
  onViewAllTasks,
  onOpenAuth,
  onTaskCreated,
  onEditTask,
}) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const { taskTimers } = useStore();

  return (
    <div className="lg:col-span-7 p-6 rounded-3xl bg-zinc-950/95 dark:bg-zinc-950/95 light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-6">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-light tracking-tight text-white dark:text-white light:text-black">
            Next Up
          </h2>
          <button
            onClick={() => setIsAddingTask(true)}
            className="h-7 px-3 rounded-full bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-hover-light text-xs font-bold text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-white dark:hover:text-white light:hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add task</span>
          </button>
        </div>

        {/* Inline Add Task Form */}
        {isAddingTask && (
          <DashboardAddTaskForm
            onClose={() => setIsAddingTask(false)}
            onOpenAuth={onOpenAuth}
            onCreated={onTaskCreated}
          />
        )}

        {/* Task Rows */}
        <div className="flex flex-col gap-1.5 max-h-[380px] sm:max-h-[440px] overflow-y-auto pr-1 focus-custom-scrollbar">
          {pendingTasks.length === 0 ? (
            <div className="p-8 text-center text-xs opacity-40">
              All clear! Add a task to keep the momentum going.
            </div>
          ) : (
            pendingTasks.map((task) => {
              const project = projects.find((p) => p.id === task.project_id);
              const isSelected = selectedTaskId === task.id;
              const isRunning = isSelected && isTimerRunning;
              const hasSavedProgress = Boolean(
                taskTimers[task.id] &&
                taskTimers[task.id].remainingSeconds < taskTimers[task.id].totalSeconds
              );

              return (
                <DashboardTaskRow
                  key={task.id}
                  task={task}
                  project={project}
                  isSelected={isSelected}
                  isRunning={isRunning}
                  hasSavedProgress={hasSavedProgress}
                  onSelectTask={onSelectTask}
                  onToggleStatus={onToggleStatus}
                  onEditTask={onEditTask}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Footer Status */}
      <div className="pt-4 border-t border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 light:text-zinc-500 font-medium">
        <span>
          {completedTasksCount} of {totalActiveTasksCount} tasks completed
        </span>
        <button
          onClick={onViewAllTasks}
          className="font-bold text-white dark:text-white light:text-black flex items-center gap-1 hover:underline cursor-pointer"
        >
          <span>View all</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
