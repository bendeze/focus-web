import {
  format,
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
} from 'date-fns';
import type { FocusSession, FocusStats, Project, Task } from '../../types';

export interface WeeklyChartDatum {
  day: string;
  fullDate: string;
  dateKey: string;
  minutes: number;
  seconds: number;
  tasksCompleted: number;
  tasks: Task[];
  isToday: boolean;
}

/**
 * Safely parses any ISO/date string into local YYYY-MM-DD date key.
 */
export const parseToDateKey = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? parseISO(raw) : new Date(raw);
    if (!isNaN(parsed.getTime())) {
      return format(parsed, 'yyyy-MM-dd');
    }
  } catch {
    // fallback
  }
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return format(d, 'yyyy-MM-dd');
    }
  } catch {
    // fallback
  }
  if (typeof raw === 'string' && raw.length >= 10) {
    return raw.slice(0, 10);
  }
  return null;
};

/**
 * Groups completed tasks into a Map keyed by date (YYYY-MM-DD).
 */
export const groupCompletedTasksByDate = (tasks: Task[]): Map<string, Task[]> => {
  const map = new Map<string, Task[]>();
  tasks.forEach((t) => {
    if (t.status === 'completed' && !t.is_deleted) {
      const dateKey =
        parseToDateKey(t.completed_at) ||
        parseToDateKey(t.updated_at) ||
        parseToDateKey(t.created_at) ||
        format(new Date(), 'yyyy-MM-dd');

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(t);
    }
  });
  return map;
};

/**
 * Computes total focus minutes, combining recorded focus sessions
 * and completed tasks (using estimated duration when sessions are unrecorded).
 */
export const calculateTotalFocusMinutes = (
  scopeSessions: FocusSession[],
  completedTasks: Task[],
  currentProject: Project | null,
  stats: FocusStats | null
): number => {
  const sessionSeconds = scopeSessions.reduce(
    (acc, s) => acc + (s.actual_focus_seconds || s.duration_minutes * 60),
    0
  );
  const sessionTaskIds = new Set(scopeSessions.map((s) => s.task_id));

  // Factor in completed tasks that don't have a logged focus session
  const orphanCompletedMinutes = completedTasks
    .filter((t) => !sessionTaskIds.has(t.id))
    .reduce((acc, t) => {
      return acc + (t.total_focus_minutes > 0 ? t.total_focus_minutes : (t.estimated_minutes || 25));
    }, 0);

  const totalCalculated = Math.round(sessionSeconds / 60) + orphanCompletedMinutes;
  if (totalCalculated > 0) return totalCalculated;

  if (!currentProject && stats && typeof stats.total_focus_minutes === 'number') {
    return stats.total_focus_minutes;
  }

  return 0;
};

/**
 * Calculates 7-day bar chart data for target week (Mon..Sun).
 */
export const calculateWeeklyChartData = (
  targetWeekDate: Date,
  scopeSessions: FocusSession[],
  completedTasksByDate: Map<string, Task[]>
): WeeklyChartDatum[] => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const startOfTargetWeek = startOfWeek(targetWeekDate, { weekStartsOn: 1 });
  const endOfTargetWeek = endOfWeek(targetWeekDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: startOfTargetWeek,
    end: endOfTargetWeek,
  });

  return weekDays.map((d) => {
    const dateKey = format(d, 'yyyy-MM-dd');
    const dayName = format(d, 'EEE');
    const isToday = dateKey === todayStr;

    // Filter sessions for this day
    const daySessions = scopeSessions.filter((s) => {
      if (!s.started_at) return false;
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

    const dayTasks = completedTasksByDate.get(dateKey) || [];

    // Duration for completed tasks without sessions
    const sessionTaskIds = new Set(daySessions.map((s) => s.task_id));
    const orphanTasksSeconds = dayTasks
      .filter((t) => !sessionTaskIds.has(t.id))
      .reduce((acc, t) => {
        const taskSecs = (t.total_focus_minutes > 0 ? t.total_focus_minutes : (t.estimated_minutes || 25)) * 60;
        return acc + taskSecs;
      }, 0);

    const totalDaySeconds = sessionSeconds + orphanTasksSeconds;
    const totalDayMinutes = Math.round(totalDaySeconds / 60);

    return {
      day: dayName,
      fullDate: format(d, 'EEEE, MMM d'),
      dateKey,
      minutes: totalDayMinutes,
      seconds: totalDaySeconds,
      tasksCompleted: dayTasks.length,
      tasks: dayTasks,
      isToday,
    };
  });
};

/**
 * Calculates continuous 16-week daily activity data for the heatmap.
 */
export const calculateActivityData = (
  completedTasksByDate: Map<string, Task[]>
): { date: string; value: number }[] => {
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
};

/**
 * Returns formatted human-readable week range label.
 */
export const getWeekRangeLabel = (targetWeekDate: Date, weekOffset: number): string => {
  const start = startOfWeek(targetWeekDate, { weekStartsOn: 1 });
  const end = endOfWeek(targetWeekDate, { weekStartsOn: 1 });
  if (weekOffset === 0) {
    return `This Week (${format(start, 'MMM d')} – ${format(end, 'MMM d')})`;
  }
  if (weekOffset === -1) {
    return `Last Week (${format(start, 'MMM d')} – ${format(end, 'MMM d')})`;
  }
  return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
};
