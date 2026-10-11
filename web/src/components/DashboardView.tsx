import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  TrendingDown,
  Circle,
  Check,
} from 'lucide-react';
import { WeeklyBarChart } from './WeeklyBarChart';
import { PomodoroTimerWidget } from './PomodoroTimerWidget';
import {
  CalendarHeatmap,
  CalendarHeatmapBody,
  CalendarHeatmapBlock,
  CalendarHeatmapLegend,
  CalendarHeatmapStat,
  CalendarHeatmapFooter,
} from './heatmap/calendar-heatmap';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { subWeeks, eachDayOfInterval, format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import type { FocusSession, FocusStats, Project, Task } from '../types';

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
    setRemainingSeconds,
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
  const [sessions, setSessions] = useState<FocusSession[]>([]);

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

  // Group completed tasks by date string (YYYY-MM-DD)
  const completedTasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((t) => {
      if (t.status === 'completed' && !t.is_deleted) {
        const rawDate = t.completed_at || t.updated_at || t.created_at;
        if (rawDate) {
          try {
            const dateKey = format(new Date(rawDate), 'yyyy-MM-dd');
            if (!map.has(dateKey)) {
              map.set(dateKey, []);
            }
            map.get(dateKey)!.push(t);
          } catch {
            const dateKey = rawDate.slice(0, 10);
            if (!map.has(dateKey)) {
              map.set(dateKey, []);
            }
            map.get(dateKey)!.push(t);
          }
        }
      }
    });
    return map;
  }, [tasks]);

  // Helper to format duration: shows minutes when few, hours + minutes when longer
  const formatFocusDuration = (seconds: number): string => {
    if (seconds <= 0) return '0m';
    const totalMinutes = Math.round(seconds / 60);
    if (totalMinutes < 1) return '< 1m';
    if (totalMinutes < 60) return `${totalMinutes}m`;
    const hours = Math.floor(totalMinutes / 60);
    const remainingMins = totalMinutes % 60;
    if (remainingMins === 0) return `${hours}h`;
    return `${hours}h ${remainingMins}m`;
  };

  // 7-Day Focus Performance & Comparison against Last Week (Real Data)
  const weeklyAnalytics = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 });     // Sunday
    const startOfPreviousWeek = subWeeks(startOfCurrentWeek, 1);
    const endOfPreviousWeek = subWeeks(endOfCurrentWeek, 1);

    // Calculate total focus seconds for a given date YYYY-MM-DD
    const getFocusSecondsForDate = (dateKey: string) => {
      // 1. Completed focus sessions on this date
      const daySessions = sessions.filter((s) => {
        if (s.status !== 'completed' || !s.started_at) return false;
        try {
          return format(new Date(s.started_at), 'yyyy-MM-dd') === dateKey;
        } catch {
          return s.started_at.startsWith(dateKey);
        }
      });
      const sessionSeconds = daySessions.reduce(
        (acc, s) => acc + (s.actual_focus_seconds || s.duration_minutes * 60),
        0
      );

      // 2. Completed tasks on this date (factor in task duration if session wasn't recorded)
      const dayTasks = completedTasksByDate.get(dateKey) || [];
      const sessionTaskIds = new Set(daySessions.map((s) => s.task_id));
      const orphanTasksSeconds = dayTasks
        .filter((t) => !sessionTaskIds.has(t.id))
        .reduce((acc, t) => {
          const taskSecs = t.total_focus_minutes > 0
            ? t.total_focus_minutes * 60
            : (t.estimated_minutes || 25) * 60;
          return acc + taskSecs;
        }, 0);

      return sessionSeconds + orphanTasksSeconds;
    };

    // Days of current week (Mon..Sun)
    const currentWeekDays = eachDayOfInterval({
      start: startOfCurrentWeek,
      end: endOfCurrentWeek,
    });

    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    const barChartData = currentWeekDays.map((d, index) => {
      const dateKey = format(d, 'yyyy-MM-dd');
      const seconds = getFocusSecondsForDate(dateKey);
      const minutes = Math.round(seconds / 60);
      const dayTasks = completedTasksByDate.get(dateKey) || [];
      const completedTaskCount = dayTasks.length;
      const isToday = dateKey === todayStr;

      return {
        day: dayLabels[index],
        fullDate: format(d, 'EEEE, MMM d'),
        dateKey,
        minutes,
        seconds,
        tasksCompleted: completedTaskCount,
        tasks: dayTasks,
        isToday,
      };
    });

    const thisWeekTotalSecs = barChartData.reduce((acc, d) => acc + d.seconds, 0);

    // Days of previous week (Mon..Sun)
    const previousWeekDays = eachDayOfInterval({
      start: startOfPreviousWeek,
      end: endOfPreviousWeek,
    });
    const lastWeekTotalSecs = previousWeekDays.reduce((acc, d) => {
      const dateKey = format(d, 'yyyy-MM-dd');
      return acc + getFocusSecondsForDate(dateKey);
    }, 0);

    // Active days count: account for days where user had no tasks or was resting
    // The average is computed over active days with focus/tasks rather than penalizing non-task days
    const activeDaysCount = barChartData.filter((d) => d.seconds > 0 || d.tasksCompleted > 0).length;
    const avgSecondsPerDay = activeDaysCount > 0
      ? Math.round(thisWeekTotalSecs / activeDaysCount)
      : 0;

    const totalDisplay = formatFocusDuration(thisWeekTotalSecs);
    const avgDisplay = formatFocusDuration(avgSecondsPerDay);

    // Comparison against previous week
    let percentageChange = 0;
    let comparisonTrend: 'up' | 'down' | 'neutral' = 'neutral';
    let comparisonText = 'No focus activity recorded yet';

    if (lastWeekTotalSecs > 0) {
      percentageChange = Math.round(((thisWeekTotalSecs - lastWeekTotalSecs) / lastWeekTotalSecs) * 100);
      if (percentageChange > 0) {
        comparisonTrend = 'up';
        comparisonText = `↑ ${percentageChange}% more focus than last week`;
      } else if (percentageChange < 0) {
        comparisonTrend = 'down';
        comparisonText = `↓ ${Math.abs(percentageChange)}% less focus than last week`;
      } else {
        comparisonTrend = 'neutral';
        comparisonText = 'Equal focus compared to last week';
      }
    } else if (thisWeekTotalSecs > 0) {
      comparisonTrend = 'up';
      comparisonText = `↑ ${totalDisplay} logged this week`;
    }

    return {
      barChartData,
      thisWeekTotalSecs,
      totalDisplay,
      avgDisplay,
      activeDaysCount,
      comparisonTrend,
      comparisonText,
    };
  }, [sessions, completedTasksByDate]);

  // Continuous activity array for the last 16 weeks (recalculated whenever tasks update)
  const activityData = useMemo(() => {
    const today = new Date();
    const startDate = subWeeks(today, 16);
    const days = eachDayOfInterval({ start: startDate, end: today });
    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayTasks = completedTasksByDate.get(dateStr) || [];
      return {
        date: dateStr,
        value: dayTasks.length,
      };
    });
  }, [completedTasksByDate]);

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

  const handleToggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'todo' : 'completed';
    try {
      await api.updateTask(task.id, { status: nextStatus });
      await loadSessions();
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
          
          {/* Widget 1: Pomodoro Focus Timer Widget */}
          <PomodoroTimerWidget
            tasks={tasks}
            onSessionFinished={onRefresh}
          />

          {/* Widget 2: This Week Focus Analytics Widget */}
          <div className="p-6 rounded-3xl bg-surface-dark dark:bg-surface-dark light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-4 select-none">
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
                THIS WEEK
              </span>
              <div className="flex items-center gap-1.5 tabular-nums">
                <span className="text-xs font-bold text-white dark:text-white light:text-black">
                  {weeklyAnalytics.totalDisplay}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium">
                  ({weeklyAnalytics.avgDisplay}/day)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {weeklyAnalytics.comparisonTrend === 'up' ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400">{weeklyAnalytics.comparisonText}</span>
                </>
              ) : weeklyAnalytics.comparisonTrend === 'down' ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-400 light:text-zinc-600 shrink-0" />
                  <span className="text-zinc-400 dark:text-zinc-400 light:text-zinc-600">{weeklyAnalytics.comparisonText}</span>
                </>
              ) : (
                <span className="text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
                  {weeklyAnalytics.comparisonText}
                </span>
              )}
            </div>

            {/* 7-Day Bar Chart */}
            <WeeklyBarChart
              data={weeklyAnalytics.barChartData}
              theme={theme}
              completedTasksByDate={completedTasksByDate}
            />

          </div>

        </div>

      </div>

      {/* 4. Bottom Section: Daily Activity Contribution Heatmap */}
      <div className="p-6 md:p-8 rounded-3xl bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col gap-5">
        <CalendarHeatmap
          data={activityData}
          weekStart={1}
          blockSize={13}
          blockMargin={4}
          blockRadius={3}
          levels={5}
          maxCount={4}
          colors={{
            empty: theme === 'light' ? '#E4E4E7' : '#1D1D20',
            scale: '#10B981',
          }}
          className="p-0 w-full"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
            <div className="flex flex-col">
              <h3 className="text-base font-bold text-white dark:text-white light:text-black">
                Daily Activity
              </h3>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
                Consistency over the last 16 weeks · {completedTasks.length} total tasks completed
              </span>
            </div>

            <CalendarHeatmapLegend
              className="text-xs"
              labels={{ less: 'Less', more: 'More' }}
            />
          </div>

          {/* Heatmap SVG Grid */}
          <div className="w-full overflow-x-auto pb-1">
            <CalendarHeatmapBody
              labelClassName="text-zinc-500 dark:text-zinc-400 light:text-zinc-500 fill-zinc-500 dark:fill-zinc-400 light:fill-zinc-500 text-[11px]"
              className="py-1 gap-4 min-w-[640px]"
            >
              {({ activity, dayIndex, weekIndex }) => {
                const dayTasks = completedTasksByDate.get(activity.date) || [];
                const formattedDate = format(parseISO(activity.date), 'EEEE, MMMM d, yyyy');

                return (
                  <Tooltip key={activity.date}>
                    <TooltipTrigger
                      render={
                        <CalendarHeatmapBlock
                          activity={activity}
                          dayIndex={dayIndex}
                          weekIndex={weekIndex}
                        />
                      }
                    />
                    <TooltipContent
                      side="top"
                      sideOffset={6}
                      className="p-3 min-w-[200px] max-w-xs flex flex-col gap-2 pointer-events-auto"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs border-b border-subtle-dark dark:border-subtle-dark light:border-subtle-light pb-1.5 font-medium">
                        <span className="text-zinc-300 dark:text-zinc-300 light:text-zinc-700 font-semibold">
                          {formattedDate}
                        </span>
                        <span className="text-emerald-400 font-bold font-mono text-[11px] shrink-0">
                          {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>
                      {dayTasks.length > 0 ? (
                        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {dayTasks.map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center gap-1.5 text-[11px] text-zinc-300 dark:text-zinc-300 light:text-zinc-800"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate">{t.title}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-500 py-0.5">
                          No completed tasks on this day
                        </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              }}
            </CalendarHeatmapBody>
          </div>

          <CalendarHeatmapFooter className="pt-2 text-xs text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
            <CalendarHeatmapStat label="{{value}} tasks completed across this period" />
          </CalendarHeatmapFooter>
        </CalendarHeatmap>
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
