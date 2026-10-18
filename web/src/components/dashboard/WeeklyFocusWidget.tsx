import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Task } from '../../types';
import { WeeklyBarChart } from '../WeeklyBarChart';
import type { WeeklyAnalytics } from './dashboardUtils';

interface WeeklyFocusWidgetProps {
  weeklyAnalytics: WeeklyAnalytics;
  completedTasksByDate: Map<string, Task[]>;
  theme: string;
}

export const WeeklyFocusWidget: React.FC<WeeklyFocusWidgetProps> = ({
  weeklyAnalytics,
  completedTasksByDate,
  theme,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-zinc-950/95 dark:bg-zinc-950/95 light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-4 select-none">
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
            <span className="text-zinc-400 dark:text-zinc-400 light:text-zinc-600">
              {weeklyAnalytics.comparisonText}
            </span>
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
  );
};
