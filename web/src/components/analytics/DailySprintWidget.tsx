import React from 'react';
import type { WeeklyChartDatum } from './analyticsUtils';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DailySprintWidgetProps {
  weeklyChartData: WeeklyChartDatum[];
  weekRangeLabel: string;
  chartMetric: 'tasks' | 'time';
  onToggleMetric: (metric: 'tasks' | 'time') => void;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onResetWeek: () => void;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string | null) => void;
  thisWeekTotalTasks: number;
  thisWeekTotalMinutes: number;
  maxWeeklyTasks: number;
  maxWeeklyMinutes: number;
}

export const DailySprintWidget: React.FC<DailySprintWidgetProps> = ({
  weeklyChartData,
  weekRangeLabel,
  chartMetric,
  onToggleMetric,
  weekOffset,
  onPrevWeek,
  onNextWeek,
  onResetWeek,
  selectedDateKey,
  onSelectDate,
  thisWeekTotalTasks,
  thisWeekTotalMinutes,
  maxWeeklyTasks,
  maxWeeklyMinutes,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-zinc-950/95 dark:bg-zinc-950/95 light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col justify-between gap-6 select-none">
      {/* 1. Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-400 light:text-zinc-600">
              {weekRangeLabel}
            </span>
          </div>
          <h3 className="text-base font-semibold text-white dark:text-white light:text-black">
            Daily Sprint Distribution
          </h3>
        </div>

        {/* Metric Switcher & Week Navigator */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Metric Toggle: Tasks Done vs Focus Time */}
          <div className="flex items-center p-0.5 rounded-xl bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-zinc-100 border border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-xs font-medium">
            <button
              type="button"
              onClick={() => onToggleMetric('tasks')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartMetric === 'tasks'
                  ? 'bg-emerald-500 text-black font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black'
              }`}
              title="Show completed tasks per day"
            >
              Tasks ({thisWeekTotalTasks})
            </button>
            <button
              type="button"
              onClick={() => onToggleMetric('time')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                chartMetric === 'time'
                  ? 'bg-emerald-500 text-black font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black'
              }`}
              title="Show focus minutes per day"
            >
              Focus Time ({thisWeekTotalMinutes}m)
            </button>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-1 bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-zinc-100 p-0.5 rounded-lg border border-subtle-dark dark:border-subtle-dark light:border-subtle-light">
            <button
              type="button"
              onClick={onPrevWeek}
              className="p-1 rounded hover:bg-zinc-800 dark:hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black transition-colors cursor-pointer"
              title="Previous week"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {weekOffset !== 0 && (
              <button
                type="button"
                onClick={onResetWeek}
                className="px-1.5 py-0.5 text-[10px] font-mono text-emerald-400 hover:underline cursor-pointer"
                title="Return to current week"
              >
                Current
              </button>
            )}
            <button
              type="button"
              disabled={weekOffset >= 0}
              onClick={onNextWeek}
              className={`p-1 rounded transition-colors ${
                weekOffset >= 0
                  ? 'text-zinc-700 dark:text-zinc-700 light:text-zinc-300 cursor-not-allowed'
                  : 'hover:bg-zinc-800 dark:hover:bg-zinc-800 light:hover:bg-zinc-200 text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black cursor-pointer'
              }`}
              title="Next week"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 7-Day Bar Chart Visual */}
      <div className="flex items-end justify-between gap-2 sm:gap-3 h-48 pt-4 px-2">
        {weeklyChartData.map((item) => {
          const value = chartMetric === 'tasks' ? item.tasksCompleted : item.minutes;
          const maxValue = chartMetric === 'tasks' ? maxWeeklyTasks : maxWeeklyMinutes;
          const heightRatio = maxValue > 0 ? value / maxValue : 0;
          const barHeightPercent = Math.max(
            Math.round(heightRatio * 100),
            value > 0 ? 18 : 6
          );
          const hasActivity = item.tasksCompleted > 0 || item.minutes > 0;
          const isSelected = selectedDateKey === item.dateKey;

          return (
            <Tooltip key={item.dateKey}>
              <TooltipTrigger
                render={
                  <div
                    onClick={() => {
                      onSelectDate(isSelected ? null : item.dateKey);
                    }}
                    className={`flex-1 flex flex-col items-center gap-2 group h-full justify-end cursor-pointer outline-none select-none transition-transform ${
                      isSelected ? 'scale-105' : 'hover:scale-[1.02]'
                    }`}
                  >
                    {/* Value Label above Bar */}
                    <div
                      className={`text-[10px] font-mono tabular-nums transition-opacity ${
                        hasActivity
                          ? 'text-emerald-400 font-bold opacity-100'
                          : 'text-zinc-600 dark:text-zinc-600 light:text-zinc-400 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {chartMetric === 'tasks'
                        ? item.tasksCompleted > 0
                          ? `${item.tasksCompleted}`
                          : '0'
                        : item.minutes > 0
                        ? `${item.minutes}m`
                        : '0m'}
                    </div>

                    {/* Bar Pillar */}
                    <div
                      className={`w-full max-w-[36px] bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-zinc-100 rounded-xl h-32 flex items-end p-1 transition-all ${
                        isSelected
                          ? 'ring-2 ring-emerald-400 ring-offset-none ring-offset-zinc-950 bg-zinc-900'
                          : 'group-hover:bg-zinc-900/90 dark:group-hover:bg-zinc-900/90 light:group-hover:bg-zinc-200'
                      }`}
                    >
                      <div
                        className={`w-full rounded-lg transition-all duration-500 ${
                          hasActivity
                            ? item.isToday
                              ? 'bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                              : 'bg-emerald-500/90 dark:bg-emerald-400 light:bg-emerald-600 group-hover:brightness-110'
                            : item.isToday
                            ? 'bg-emerald-500/30'
                            : 'bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200'
                        }`}
                        style={{ height: `${barHeightPercent}%` }}
                      />
                    </div>

                    {/* Day Label */}
                    <span
                      className={`text-[11px] font-mono font-medium transition-colors ${
                        isSelected
                          ? 'text-emerald-400 font-extrabold underline decoration-emerald-400 decoration-2 underline-offset-4'
                          : item.isToday
                          ? 'text-emerald-400 font-bold'
                          : hasActivity
                          ? 'text-white dark:text-white light:text-black font-semibold'
                          : 'text-zinc-500 dark:text-zinc-400 light:text-zinc-500'
                      }`}
                    >
                      {item.day}
                    </span>
                  </div>
                }
              />
              <TooltipContent
                side="top"
                sideOffset={8}
                className="p-3 min-w-[210px] max-w-xs flex flex-col gap-2 pointer-events-auto"
              >
                <div className="flex items-center justify-between gap-3 text-xs border-b border-subtle-dark dark:border-subtle-dark light:border-subtle-light pb-1.5 font-medium">
                  <span className="text-zinc-300 dark:text-zinc-300 light:text-zinc-700 font-semibold text-[11px]">
                    {item.fullDate}
                  </span>
                  <span className="text-xs font-bold tabular-nums text-white dark:text-white light:text-black">
                    {item.minutes}m focus
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium">Completed Tasks</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {item.tasksCompleted} {item.tasksCompleted === 1 ? 'task' : 'tasks'}
                  </span>
                </div>

                {item.tasks && item.tasks.length > 0 ? (
                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1 pt-0.5 border-t border-subtle-dark dark:border-subtle-dark light:border-subtle-light">
                    {item.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-1.5 text-xs text-zinc-300 dark:text-zinc-300 light:text-zinc-700"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="truncate" title={task.title}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-[11px] text-zinc-500 pt-0.5 border-t border-subtle-dark dark:border-subtle-dark light:border-subtle-light">
                    No completed tasks on this day
                  </span>
                )}

                <div className="pt-1 border-t border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-[10px] text-zinc-500 flex items-center justify-between">
                  <span>Click bar to {isSelected ? 'clear filter' : 'filter tasks'}</span>
                  {isSelected && <span className="text-emerald-400 font-semibold">Active Filter</span>}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* 3. Bottom Bar Aggregation Footer */}
      <div className="pt-3 border-t border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
        <div className="flex items-center gap-1.5">
          <span>{chartMetric === 'tasks' ? 'Tasks completed per day' : 'Focus sprint duration'}</span>
          {selectedDateKey && (
            <button
              onClick={() => onSelectDate(null)}
              className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline ml-2 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Clear day filter</span>
            </button>
          )}
        </div>
        <span className="font-mono text-emerald-400 font-medium">
          {chartMetric === 'tasks'
            ? `${thisWeekTotalTasks} tasks total`
            : `${thisWeekTotalMinutes}m total focus`}
        </span>
      </div>
    </div>
  );
};
