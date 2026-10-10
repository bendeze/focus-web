import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import {
  Clock,
  ListTodo,
  FolderKanban,
  CheckCircle2,
  Play,
  Pause,
  Plus,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Circle,
  Check,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from 'recharts';
import type { FocusStats, Project, Task } from '../types';

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
    setSelectedTaskId,
    remainingSeconds,
    setRemainingSeconds,
    totalSeconds,
    setTotalSeconds,
    isTimerRunning,
    setIsTimerRunning,
    activeSession,
    setActiveSession,
    addToast,
  } = useStore();

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(25);

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
    return activeTasks.filter((t) => t.status !== 'completed');
  }, [activeTasks]);

  const completedTasks = useMemo(() => {
    return activeTasks.filter((t) => t.status === 'completed');
  }, [activeTasks]);

  // Key Metrics
  const focusHours = stats ? (stats.total_focus_minutes / 60).toFixed(1) : '4.5';
  const backlogCount = pendingTasks.length;
  const projectsCount = projects.filter((p) => !p.is_deleted).length;
  const completionRate = activeTasks.length > 0
    ? Math.round((completedTasks.length / activeTasks.length) * 100)
    : 86;

  // 7-Day Focus Bar Chart Data
  const weeklyData = useMemo(() => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const currentDayIdx = (new Date().getDay() + 6) % 7; // Monday = 0
    return days.map((day, idx) => ({
      day,
      hours: idx === currentDayIdx ? 5.2 : [3.8, 4.2, 4.0, 4.8, 5.2, 2.5, 3.0][idx] || 3.5,
      isToday: idx === currentDayIdx,
    }));
  }, []);

  // Contribution Heatmap Grid (16 Weeks x 7 Days)
  const heatmapWeeks = useMemo(() => {
    const weeks = [];
    for (let w = 0; w < 16; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        // Deterministic realistic density
        const intensity = (w * 7 + d * 3) % 5;
        days.push(intensity);
      }
      weeks.push(days);
    }
    return weeks;
  }, []);

  // Timer formatted
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timerDisplay = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // Start Sprint Action
  const handleStartSprint = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (isTimerRunning) {
      setIsTimerRunning(false);
      if (activeSession) {
        try {
          await api.pauseFocusSession(activeSession.id);
        } catch {
          // ignore
        }
      }
    } else {
      const targetTask = pendingTasks[0];
      const targetDuration = targetTask?.estimated_minutes || 25;
      
      if (!selectedTaskId && targetTask) {
        setSelectedTaskId(targetTask.id);
        setTotalSeconds(targetDuration * 60);
        setRemainingSeconds(targetDuration * 60);
      }

      if (!activeSession && targetTask) {
        try {
          const session = await api.startFocusSession({
            task_id: targetTask.id,
            duration_minutes: targetDuration,
            auto_complete_task: true,
          });
          setActiveSession(session);
        } catch {
          // ignore
        }
      } else if (activeSession) {
        try {
          await api.resumeFocusSession(activeSession.id);
        } catch {
          // ignore
        }
      }
      setIsTimerRunning(true);
      addToast('Focus sprint in progress', 'success');
    }
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setRemainingSeconds(totalSeconds);
    addToast('Timer reset', 'info');
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      onRefresh?.();
    } catch (err: any) {
      addToast(err.message || 'Failed to update task', 'error');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onOpenAuth();
      return;
    }
    if (!newTaskTitle.trim()) return;

    try {
      await api.createTask({
        title: newTaskTitle.trim(),
        estimated_minutes: newTaskDuration,
      });
      setNewTaskTitle('');
      setIsAddingTask(false);
      addToast('Task added to backlog', 'success');
      onRefresh?.();
    } catch (err: any) {
      addToast(err.message || 'Failed to create task', 'error');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-6 md:px-10 flex flex-col gap-8 transition-colors">
      
      {/* 1. Header Greeting & Top CTA */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            {currentDateFormatted}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white dark:text-white light:text-black">
            Stay in the Flow
          </h1>
        </div>

        <button
          onClick={handleStartSprint}
          className="h-11 px-6 rounded-full bg-white dark:bg-white text-black light:bg-black light:text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-md self-start sm:self-auto cursor-pointer"
        >
          {isTimerRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause Sprint</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current ml-0.5" />
              <span>Start Sprint</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Top Metrics Cards (4 Stats Row) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: FOCUS TIME */}
        <div className="p-5 rounded-2xl bg-surface-dark dark:bg-surface-dark light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
              FOCUS TIME
            </span>
            <Clock className="w-4 h-4 text-zinc-500 dark:text-zinc-400 light:text-zinc-500" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight">
              {focusHours} hrs
            </div>
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>↑ 18%</span>
            </div>
          </div>
        </div>

        {/* Card 2: BACKLOG */}
        <div className="p-5 rounded-2xl bg-surface-dark dark:bg-surface-dark light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
              BACKLOG
            </span>
            <ListTodo className="w-4 h-4 text-zinc-500 dark:text-zinc-400 light:text-zinc-500" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight">
              {backlogCount.toString().padStart(2, '0')}
            </div>
            <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-0.5">
              {Math.min(3, backlogCount)} due today
            </div>
          </div>
        </div>

        {/* Card 3: PROJECTS */}
        <div className="p-5 rounded-2xl bg-surface-dark dark:bg-surface-dark light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
              PROJECTS
            </span>
            <FolderKanban className="w-4 h-4 text-zinc-500 dark:text-zinc-400 light:text-zinc-500" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight">
              {projectsCount.toString().padStart(2, '0')}
            </div>
            <div className="text-[11px] font-medium text-zinc-400 dark:text-zinc-400 light:text-zinc-500 mt-0.5">
              all on track
            </div>
          </div>
        </div>

        {/* Card 4: COMPLETION */}
        <div className="p-5 rounded-2xl bg-surface-dark dark:bg-surface-dark light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
              COMPLETION
            </span>
            <CheckCircle2 className="w-4 h-4 text-zinc-500 dark:text-zinc-400 light:text-zinc-500" />
          </div>
          <div>
            <div className="text-2xl md:text-3xl font-extrabold tabular-nums tracking-tight">
              {completionRate}%
            </div>
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>↑ 6%</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Main Content Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ================================================================= */}
        {/* LEFT COLUMN: "Next Up" Task Manager (7 Cols)                      */}
        {/* ================================================================= */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-surface-dark dark:bg-surface-dark light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-6">
          
          <div className="flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold tracking-tight text-white dark:text-white light:text-black">
                Next Up
              </h2>
              <button
                onClick={() => setIsAddingTask(true)}
                className="h-7 px-3 rounded-full bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-xs font-bold text-zinc-300 dark:text-zinc-300 light:text-zinc-700 hover:text-white dark:hover:text-white light:hover:text-black flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add task</span>
              </button>
            </div>

            {/* Inline Add Task Form */}
            {isAddingTask && (
              <form
                onSubmit={handleCreateTask}
                className="p-4 rounded-2xl bg-item-dark dark:bg-item-dark light:bg-item-light flex flex-col gap-3"
              >
                <input
                  type="text"
                  autoFocus
                  placeholder="Task title..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-xs outline-none"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {[15, 25, 45, 60].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setNewTaskDuration(m)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          newTaskDuration === m
                            ? 'bg-white dark:bg-white text-black light:bg-black light:text-white'
                            : 'opacity-50'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingTask(false)}
                      className="px-3 py-1 text-xs opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newTaskTitle.trim()}
                      className="h-8 px-4 rounded-full bg-white dark:bg-white text-black light:bg-black light:text-white text-xs font-bold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Task Rows */}
            <div className="flex flex-col gap-1.5">
              {pendingTasks.length === 0 ? (
                <div className="p-8 text-center text-xs opacity-40">
                  All clear! Add a task to keep the momentum going.
                </div>
              ) : (
                pendingTasks.slice(0, 5).map((task) => {
                  const project = projects.find((p) => p.id === task.project_id);
                  const isCompleted = task.status === 'completed';

                  return (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-2xl hover:bg-hover-dark dark:hover:bg-hover-dark light:hover:bg-hover-light transition-all flex items-center justify-between gap-4 group cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTaskStatus(task);
                          }}
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'border border-subtle-dark dark:border-subtle-dark light:border-subtle-light opacity-50 group-hover:opacity-100'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-3 h-3 stroke-[3]" />
                          ) : (
                            <Circle className="w-2.5 h-2.5 text-transparent" />
                          )}
                        </button>

                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold truncate text-white dark:text-white light:text-black">
                            {task.title}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
                            {project ? project.title : 'General focus'} · {task.estimated_minutes} min
                          </span>
                        </div>
                      </div>

                      {/* Right Tag */}
                      <span className="text-[11px] font-bold text-zinc-400 dark:text-zinc-400 light:text-zinc-500 px-2.5 py-1 rounded-full bg-item-dark dark:bg-item-dark light:bg-item-light flex-shrink-0">
                        Today
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Status */}
          <div className="pt-4 border-t border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 light:text-zinc-500 font-medium">
            <span>
              {completedTasks.length} of {activeTasks.length} tasks completed
            </span>
            <button
              onClick={() => setActiveTab('tasks')}
              className="font-bold text-white dark:text-white light:text-black flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: Widgets (5 Cols)                                    */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Widget 1: Today's Focus Timer Widget */}
          <div className="p-6 rounded-3xl bg-surface-dark dark:bg-surface-dark light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col items-center justify-between gap-6 text-center">
            
            <div className="w-full flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
                TODAY'S FOCUS
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                {isTimerRunning ? 'IN PROGRESS' : 'READY'}
              </span>
            </div>

            {/* Circular Progress Ring with Center Display */}
            <div className="relative flex items-center justify-center my-1">
              <svg className="w-44 h-44 -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="72"
                  className="text-subtle-dark dark:text-subtle-dark light:text-subtle-light"
                  stroke="currentColor"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="72"
                  stroke="currentColor"
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 72}
                  strokeDashoffset={2 * Math.PI * 72 * (1 - (totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0))}
                  strokeLinecap="round"
                  className="text-white dark:text-white light:text-black transition-all duration-1000 ease-linear"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold tracking-tight tabular-nums font-sans">
                  {timerDisplay}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-0.5">
                  {isTimerRunning ? 'FOCUSING' : 'READY'}
                </span>
              </div>
            </div>

            {/* Session Info & Progress Dots */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs font-bold tracking-wide">
                DEEP WORK — Session 01 of 04
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
                25 min focus · 5 min break
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-white dark:bg-white light:bg-black" />
                <span className="w-2 h-2 rounded-full bg-zinc-700 dark:bg-zinc-700 light:bg-zinc-300" />
                <span className="w-2 h-2 rounded-full bg-zinc-700 dark:bg-zinc-700 light:bg-zinc-300" />
                <span className="w-2 h-2 rounded-full bg-zinc-700 dark:bg-zinc-700 light:bg-zinc-300" />
              </div>
            </div>

            {/* Controls Button Row */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={handleStartSprint}
                className="flex-1 h-10 rounded-full bg-white dark:bg-white text-black light:bg-black light:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-sm"
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    <span>Start</span>
                  </>
                )}
              </button>

              <button
                onClick={handleResetTimer}
                className="w-10 h-10 rounded-full bg-hover-dark dark:bg-hover-dark light:bg-hover-light flex items-center justify-center text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black transition-colors"
                title="Reset Timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

          {/* Widget 2: This Week Focus Analytics Widget */}
          <div className="p-6 rounded-3xl bg-surface-dark dark:bg-surface-dark light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-4">
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
                THIS WEEK
              </span>
              <span className="text-xs font-bold tabular-nums">
                4.5h avg.
              </span>
            </div>

            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>↑ 18% more focus than last week</span>
            </div>

            {/* 7-Day Bar Chart */}
            <div className="h-28 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                  <XAxis
                    dataKey="day"
                    stroke="currentColor"
                    opacity={0.4}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-2 rounded-xl bg-canvas-dark dark:bg-canvas-dark light:bg-canvas-light text-white dark:text-white light:text-black shadow-xl text-[11px] font-bold">
                            {data.hours} hrs
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="hours" radius={[4, 4, 4, 4]}>
                    {weeklyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isToday ? (theme === 'dark' ? '#FFFFFF' : '#111113') : (theme === 'dark' ? '#2A2A2E' : '#D4D4D8')}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

          </div>

        </div>

      </div>

      {/* 4. Bottom Section: Daily Activity Contribution Heatmap */}
      <div className="p-6 md:p-8 rounded-3xl bg-surface-dark dark:bg-surface-dark light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col gap-5">
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-white dark:text-white light:text-black">
              Daily Activity
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
              Consistency over the last 16 weeks
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-item-dark dark:bg-item-dark light:bg-item-light" />
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-950 dark:bg-emerald-950 light:bg-emerald-200" />
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-700 dark:bg-emerald-700 light:bg-emerald-400" />
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-500 light:bg-emerald-600" />
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="w-full overflow-x-auto pb-2">
          <div className="flex items-center gap-1.5 min-w-[640px]">
            {heatmapWeeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5">
                {week.map((level, dIdx) => {
                  const getCellColor = (lvl: number) => {
                    if (lvl === 0) return 'bg-item-dark dark:bg-item-dark light:bg-item-light';
                    if (lvl === 1) return 'bg-emerald-950/80 dark:bg-emerald-950/80 light:bg-emerald-200';
                    if (lvl === 2) return 'bg-emerald-800 dark:bg-emerald-800 light:bg-emerald-300';
                    if (lvl === 3) return 'bg-emerald-600 dark:bg-emerald-600 light:bg-emerald-400';
                    return 'bg-emerald-400 dark:bg-emerald-400 light:bg-emerald-500';
                  };

                  return (
                    <div
                      key={dIdx}
                      className={`w-3.5 h-3.5 rounded-sm transition-all hover:scale-125 ${getCellColor(level)}`}
                      title={`Activity level: ${level}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 5. Footer Metadata */}
      <footer className="pt-4 pb-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-500 light:text-zinc-500 font-medium border-t border-subtle-dark dark:border-subtle-dark light:border-subtle-light">
        <div className="flex items-center gap-2">
          <span>PERSONAL WORKSPACE</span>
          <span>·</span>
          <span>ALL CHANGES SAVED</span>
        </div>
        <div>
          Less noise. More meaningful work.
        </div>
      </footer>

    </div>
  );
};
