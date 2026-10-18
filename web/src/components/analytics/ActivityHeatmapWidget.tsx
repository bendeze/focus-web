import React from 'react';
import { format, parseISO } from 'date-fns';
import type { Task } from '../../types';
import {
  CalendarHeatmap,
  CalendarHeatmapBody,
  CalendarHeatmapBlock,
  CalendarHeatmapLegend,
  CalendarHeatmapStat,
  CalendarHeatmapFooter,
} from '../heatmap/calendar-heatmap';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { CheckCircle2 } from 'lucide-react';

interface ActivityHeatmapWidgetProps {
  title: string;
  completedCount: number;
  activityData: { date: string; value: number }[];
  completedTasksByDate: Map<string, Task[]>;
  theme: string;
}

export const ActivityHeatmapWidget: React.FC<ActivityHeatmapWidgetProps> = ({
  title,
  completedCount,
  activityData,
  completedTasksByDate,
  theme,
}) => {
  return (
    <div className="p-6 md:p-8 rounded-3xl bg-transparent light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col gap-5 select-none">
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
              {title}
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 light:text-zinc-500">
              Completed task consistency over the last 16 weeks · {completedCount} tasks completed
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
  );
};
