import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';
import type { Task } from '../types';

export interface WeeklyBarChartDatum {
  day: string;
  fullDate: string;
  dateKey: string;
  minutes: number;
  seconds: number;
  tasksCompleted: number;
  tasks?: Task[];
  isToday: boolean;
}

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

interface WeeklyBarChartProps {
  data: WeeklyBarChartDatum[];
  theme?: string;
  completedTasksByDate?: Map<string, Task[]>;
  className?: string;
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({
  data,
  theme = 'dark',
  completedTasksByDate,
  className = 'h-28 w-full mt-2',
}) => {
  return (
    <div className={`${className} outline-none focus:outline-none select-none`}>
      <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 5, left: 5, bottom: 0 }}
          accessibilityLayer={false}
          tabIndex={-1}
          className="outline-none focus:outline-none select-none"
          style={{ outline: 'none' }}
        >
          <XAxis
            dataKey="dateKey"
            stroke="none"
            className="text-zinc-500 dark:text-zinc-400 light:text-zinc-500 select-none pointer-events-none"
            opacity={0.6}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(_, index) => ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index] || ''}
          />
          <RechartsTooltip
            cursor={{ fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)', radius: 4 }}
            wrapperStyle={{ outline: 'none', border: 'none', zIndex: 50 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as WeeklyBarChartDatum;
                const dateKey = item.dateKey;
                const dayTasks: Task[] = (item.tasks && item.tasks.length > 0)
                  ? item.tasks
                  : (completedTasksByDate?.get(dateKey) || []);
                const taskCount = dayTasks.length;
                const seconds = item.seconds || (taskCount > 0 ? taskCount * 25 * 60 : 0);

                return (
                  <div className="p-3 rounded-2xl bg-surface-dark dark:bg-surface-dark light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-white dark:text-white light:text-black shadow-2xl flex flex-col gap-2 min-w-[210px] max-w-xs select-none pointer-events-none">
                    <div className="flex items-center justify-between gap-3 text-xs border-b border-subtle-dark dark:border-subtle-dark light:border-subtle-light pb-1.5 font-medium">
                      <span className="text-zinc-300 dark:text-zinc-300 light:text-zinc-700 font-semibold text-[11px]">
                        {item.fullDate}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-white dark:text-white light:text-black">
                        {formatFocusDuration(seconds)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500 dark:text-zinc-400 font-medium">Completed Tasks</span>
                      <span className="text-emerald-400 font-bold font-mono">
                        {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>

                    {dayTasks.length > 0 ? (
                      <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1 pt-0.5 border-t border-subtle-dark dark:border-subtle-dark light:border-subtle-light">
                        {dayTasks.map((task) => (
                          <div key={task.id} className="flex items-start gap-1.5 text-xs text-zinc-300 dark:text-zinc-300 light:text-zinc-700">
                            <span className="text-emerald-400 shrink-0 font-bold text-[11px]">✓</span>
                            <span className="truncate" title={task.title}>{task.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : seconds > 0 ? (
                      <span className="text-[11px] text-zinc-500 pt-0.5 border-t border-subtle-dark dark:border-subtle-dark light:border-subtle-light">
                        Free focus sprint
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-500 pt-0.5 border-t border-subtle-dark dark:border-subtle-dark light:border-subtle-light">
                        No tasks completed
                      </span>
                    )}
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="minutes"
            minPointSize={4}
            radius={[4, 4, 4, 4]}
            stroke="none"
            activeBar={false}
            isAnimationActive={false}
            className="outline-none focus:outline-none"
            style={{ outline: 'none' }}
          >
            {data.map((entry, index) => {
              let barFill = theme === 'dark' ? '#1D1D20' : '#E4E4E7';
              if (entry.isToday) {
                barFill = '#10B981'; // Focus brand emerald for today
              } else if (entry.minutes > 0 || entry.tasksCompleted > 0) {
                barFill = theme === 'dark' ? '#3F3F46' : '#A1A1AA';
              }

              return (
                <Cell
                  key={`cell-${index}`}
                  fill={barFill}
                  stroke="none"
                  tabIndex={-1}
                  style={{ outline: 'none' }}
                  className="transition-colors hover:opacity-80 outline-none focus:outline-none"
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
