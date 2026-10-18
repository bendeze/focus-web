import { format, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import type { Task, FocusSession, Project, FocusStats } from '../../types';

export interface WeeklyBarChartItem {
  day: string;
  fullDate: string;
  dateKey: string;
  minutes: number;
  seconds: number;
  tasksCompleted: number;
  tasks: Task[];
  isToday: boolean;
}

export interface WeeklyAnalytics {
  barChartData: WeeklyBarChartItem[];
  thisWeekTotalSecs: number;
  lastWeekTotalSecs: number;
  percentageChange: number;
  totalDisplay: string;
  avgDisplay: string;
  activeDaysCount: number;
  comparisonTrend: 'up' | 'down' | 'neutral';
  comparisonText: string;
}

export const formatFocusDuration = (seconds: number): string => {
  if (seconds <= 0) return '0m';
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 1) return '< 1m';
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  if (remainingMins === 0) return `${hours}h`;
  return `${hours}h ${remainingMins}m`;
};

export const getStatusBadge = (status: Task['status']) => {
  switch (status) {
    case 'in_progress':
      return {
        label: 'On going',
        className: 'text-white dark:text-black bg-black dark:bg-white border border-gray-900 dark:border-gray-100',
      };
    case 'paused':
      return {
        label: 'Paused',
        className: 'text-white dark:text-black bg-black dark:bg-white border border-gray-900 dark:border-gray-100',
      };
    case 'todo':
      return {
        label: 'To Do',
        className: 'text-white dark:text-black bg-black dark:bg-white border border-gray-900 dark:border-gray-100',
      };
    case 'completed':
      return {
        label: 'Completed',
        className: 'text-white dark:text-black bg-black dark:bg-white border border-gray-900 dark:border-gray-100',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        className: 'text-white dark:text-black bg-black dark:bg-white border border-gray-900 dark:border-gray-100',
      };
    default:
      return {
        label: 'To Do',
        className: 'text-white dark:text-black bg-black dark:bg-white border border-gray-900 dark:border-gray-100',
      };
  }
};

export const getCompletedTasksByDate = (tasks: Task[]): Map<string, Task[]> => {
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
};

export const calculateWeeklyAnalytics = (
  sessions: FocusSession[],
  completedTasksByDate: Map<string, Task[]>
): WeeklyAnalytics => {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 });     // Sunday
  const startOfPreviousWeek = subWeeks(startOfCurrentWeek, 1);
  const endOfPreviousWeek = subWeeks(endOfCurrentWeek, 1);

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

  const activeDaysCount = barChartData.filter((d) => d.seconds > 0 || d.tasksCompleted > 0).length;
  const avgSecondsPerDay = activeDaysCount > 0
    ? Math.round(thisWeekTotalSecs / activeDaysCount)
    : 0;

  const totalDisplay = formatFocusDuration(thisWeekTotalSecs);
  const avgDisplay = formatFocusDuration(avgSecondsPerDay);

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
    lastWeekTotalSecs,
    percentageChange,
    totalDisplay,
    avgDisplay,
    activeDaysCount,
    comparisonTrend,
    comparisonText,
  };
};

export const calculateActivityData = (completedTasksByDate: Map<string, Task[]>) => {
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

export interface MetricTrend {
  text: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface CalculatedMetrics {
  focusHours: string;
  focusTrend: MetricTrend;
  backlogCount: number;
  backlogSubtitle: string;
  projectsCount: number;
  projectsSubtitle: string;
  completionRate: number;
  completionTrend: MetricTrend;
}

export const calculateDashboardMetrics = ({
  stats,
  sessions,
  tasks,
  projects,
  weeklyAnalytics,
  completedTasksByDate,
}: {
  stats: FocusStats | null;
  sessions: FocusSession[];
  tasks: Task[];
  projects: Project[];
  weeklyAnalytics: WeeklyAnalytics;
  completedTasksByDate: Map<string, Task[]>;
}): CalculatedMetrics => {
  const activeTasks = tasks.filter((t) => !t.is_deleted);
  const pendingTasks = activeTasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled'
  );
  const completedTasks = activeTasks.filter((t) => t.status === 'completed');
  const activeProjects = projects.filter((p) => !p.is_deleted);

  // 1. Focus Time & Dynamic Trend
  let totalFocusMinutes = 0;
  if (stats && typeof stats.total_focus_minutes === 'number' && stats.total_focus_minutes > 0) {
    totalFocusMinutes = stats.total_focus_minutes;
  } else {
    totalFocusMinutes = Math.round(
      sessions
        .filter((s) => s.status === 'completed')
        .reduce((acc, s) => acc + (s.actual_focus_seconds || s.duration_minutes * 60), 0) / 60
    );
  }
  const focusHours = (totalFocusMinutes / 60).toFixed(1);

  let focusTrend: MetricTrend;
  if (weeklyAnalytics.lastWeekTotalSecs > 0) {
    const change = weeklyAnalytics.percentageChange;
    if (change > 0) {
      focusTrend = { text: `↑ ${change}%`, trend: 'up' };
    } else if (change < 0) {
      focusTrend = { text: `↓ ${Math.abs(change)}%`, trend: 'down' };
    } else {
      focusTrend = { text: '0%', trend: 'neutral' };
    }
  } else if (weeklyAnalytics.thisWeekTotalSecs > 0) {
    focusTrend = { text: `↑ ${weeklyAnalytics.totalDisplay}`, trend: 'up' };
  } else {
    focusTrend = { text: 'No activity yet', trend: 'neutral' };
  }

  // 2. Backlog Count & Dynamic Subtitle
  const backlogCount = pendingTasks.length;
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const createdTodayCount = pendingTasks.filter(
    (t) => t.created_at && t.created_at.startsWith(todayStr)
  ).length;
  const highPriorityCount = pendingTasks.filter(
    (t) => t.priority === 'urgent' || t.priority === 'high'
  ).length;

  let backlogSubtitle = 'all caught up';
  if (highPriorityCount > 0) {
    backlogSubtitle = `${highPriorityCount} high priority`;
  } else if (createdTodayCount > 0) {
    backlogSubtitle = `${createdTodayCount} added today`;
  } else if (backlogCount > 0) {
    backlogSubtitle = `${backlogCount} in queue`;
  }

  // 3. Projects Count & Dynamic Subtitle
  const projectsCount = activeProjects.length;
  const completedProjects = activeProjects.filter((p) => p.status === 'completed').length;
  const tasksWithProject = activeTasks.filter((t) => t.project_id !== null).length;

  let projectsSubtitle = 'all on track';
  if (completedProjects > 0) {
    projectsSubtitle = `${completedProjects} completed`;
  } else if (tasksWithProject > 0) {
    projectsSubtitle = `${tasksWithProject} task${tasksWithProject === 1 ? '' : 's'} linked`;
  } else if (projectsCount > 0) {
    projectsSubtitle = `${projectsCount} active`;
  } else {
    projectsSubtitle = 'no projects yet';
  }

  // 4. Completion Rate & Dynamic Trend (Week-over-Week actual task comparison)
  const completionRate =
    activeTasks.length > 0
      ? Math.round((completedTasks.length / activeTasks.length) * 100)
      : 0;

  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 1 });
  const startOfPreviousWeek = subWeeks(startOfCurrentWeek, 1);
  const endOfPreviousWeek = subWeeks(endOfCurrentWeek, 1);

  const currentWeekDays = eachDayOfInterval({
    start: startOfCurrentWeek,
    end: endOfCurrentWeek,
  });
  const previousWeekDays = eachDayOfInterval({
    start: startOfPreviousWeek,
    end: endOfPreviousWeek,
  });

  const thisWeekCompletedCount = currentWeekDays.reduce(
    (acc, d) => acc + (completedTasksByDate.get(format(d, 'yyyy-MM-dd'))?.length || 0),
    0
  );
  const lastWeekCompletedCount = previousWeekDays.reduce(
    (acc, d) => acc + (completedTasksByDate.get(format(d, 'yyyy-MM-dd'))?.length || 0),
    0
  );

  let completionTrend: MetricTrend;
  if (lastWeekCompletedCount > 0) {
    const diff = Math.round(
      ((thisWeekCompletedCount - lastWeekCompletedCount) / lastWeekCompletedCount) * 100
    );
    if (diff > 0) {
      completionTrend = { text: `↑ ${diff}%`, trend: 'up' };
    } else if (diff < 0) {
      completionTrend = { text: `↓ ${Math.abs(diff)}%`, trend: 'down' };
    } else {
      completionTrend = { text: '0%', trend: 'neutral' };
    }
  } else if (thisWeekCompletedCount > 0) {
    completionTrend = { text: `+${thisWeekCompletedCount} this week`, trend: 'up' };
  } else if (completedTasks.length > 0) {
    completionTrend = { text: `${completedTasks.length} total done`, trend: 'neutral' };
  } else {
    completionTrend = { text: 'No tasks done', trend: 'neutral' };
  }

  return {
    focusHours,
    focusTrend,
    backlogCount,
    backlogSubtitle,
    projectsCount,
    projectsSubtitle,
    completionRate,
    completionTrend,
  };
};
