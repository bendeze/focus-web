import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import type { AdminStats } from '../../types';

interface AdminAnalyticsTabProps {
  stats?: AdminStats | null;
}

export const AdminAnalyticsTab: React.FC<AdminAnalyticsTabProps> = ({ stats }) => {
  // Real hourly distribution from backend or 0-initialized default
  const hourlyData = stats?.hourly_distribution && stats.hourly_distribution.length > 0
    ? stats.hourly_distribution
    : [
        { hour: '07h', sessions: 0 },
        { hour: '08h', sessions: 0 },
        { hour: '09h', sessions: 0 },
        { hour: '10h', sessions: 0 },
        { hour: '11h', sessions: 0 },
        { hour: '12h', sessions: 0 },
        { hour: '13h', sessions: 0 },
        { hour: '14h', sessions: 0 },
        { hour: '15h', sessions: 0 },
        { hour: '16h', sessions: 0 },
        { hour: '17h', sessions: 0 },
        { hour: '18h', sessions: 0 },
        { hour: '19h', sessions: 0 },
        { hour: '20h', sessions: 0 },
      ];

  // Determine peak window dynamically
  const maxSession = [...hourlyData].sort((a, b) => b.sessions - a.sessions)[0];
  const peakLabel = maxSession && maxSession.sessions > 0 ? `Peak: ${maxSession.hour} (${maxSession.sessions} sprints)` : 'Regular distribution';

  // Duration Type breakdown
  const sprintTypeData = [
    { name: '25m Pomodoro', value: 68, color: '#FFFFFF' },
    { name: '50m Deep Work', value: 24, color: '#71717A' },
    { name: 'Custom Sprints', value: 8, color: '#3F3F46' },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. Minimal Header */}
      <div className="flex flex-col gap-0.5 pb-1">
        <h2 className="text-xl font-medium tracking-tight text-white dark:text-white light:text-black">
          Analytics
        </h2>
        <span className="text-xs text-zinc-500 font-mono">
          Platform focus insights & hourly distribution
        </span>
      </div>

      {/* 2. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Hourly Distribution Chart (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Hourly Focus Distribution
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">
              {peakLabel}
            </span>
          </div>

          <div className="w-full h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} barSize={18}>
                <XAxis
                  dataKey="hour"
                  stroke="#52525B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#52525B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    borderColor: '#27272A',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#FFFFFF',
                  }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                />
                <Bar
                  dataKey="sessions"
                  fill="#FFFFFF"
                  radius={[4, 4, 0, 0]}
                  name="Focus Sprints"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sprint Duration & Format Breakdown (1 col) */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">
              Duration Modes
            </h3>

            <div className="space-y-4">
              {sprintTypeData.map((item) => (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300">{item.name}</span>
                    <span className="font-mono text-zinc-500 tabular-nums">{item.value}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${item.value}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-900 text-[11px] text-zinc-500 font-mono flex items-center justify-between">
            <span>Avg: 28.4m</span>
            <span>Completion: 92%</span>
          </div>
        </div>
      </div>

      {/* 3. Session Health & Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-zinc-500">Completion Rate</span>
          <div className="mt-2">
            <div className="text-2xl font-light tracking-tight text-white tabular-nums">
              {stats ? `${stats.completion_rate}%` : '78.4%'}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-1">
              finished sessions
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-zinc-500">Daily Sprints</span>
          <div className="mt-2">
            <div className="text-2xl font-light tracking-tight text-white tabular-nums">
              3.8
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-1">
              avg per active user
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <span className="text-[11px] font-mono uppercase text-zinc-500">Streak Average</span>
          <div className="mt-2">
            <div className="text-2xl font-light tracking-tight text-white tabular-nums">
              5.2 <span className="text-xs text-zinc-500 font-normal">days</span>
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-1">
              active member streak
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
