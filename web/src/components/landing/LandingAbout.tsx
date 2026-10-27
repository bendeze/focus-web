import React from 'react';
import { Command } from 'lucide-react';

export const LandingAbout: React.FC = () => {
  return (
    <section className="relative w-full py-20 px-6 sm:px-12 max-w-6xl mx-auto select-none">
      {/* Terra Industries Architectural Vertical Hairline Guides */}
      <span className="dash-y pointer-events-none absolute inset-y-0 left-6 sm:left-10 lg:left-16 hidden md:block w-px" />
      <span className="dash-y pointer-events-none absolute inset-y-0 right-6 sm:right-10 lg:right-16 hidden md:block w-px" />

      {/* 1. About Focus & Developer Falcon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 items-start mb-16 ml-6">
        <div>
          <p className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 light:text-[#7d7d7d] mb-2.5">
            MISSION & ORIGIN
          </p>
          <h2 className="text-[clamp(24px,2.8vw,36px)] font-semibold leading-[1.18] tracking-[-0.03em] text-white dark:text-white light:text-black">
            An architectural antidote <br />
            <span className="font-normal text-zinc-400 dark:text-zinc-400 light:text-[#7d7d7d]">
              to digital noise.
            </span>
          </h2>
        </div>

        <div className="space-y-4 text-[13px] sm:text-[14px] text-zinc-400 dark:text-zinc-400 light:text-[#7d7d7d] font-normal leading-relaxed">
          <p>
            Focus is a minimalist productivity workspace engineered for intentional, uninterrupted work. It replaces chaotic, notification-heavy task managers with a quiet environment combining tactile Pomodoro sprints, 7-day flow analytics, and offline-first autonomy.
          </p>
          <p>
            The solution was developed by <strong className="font-semibold text-white dark:text-white light:text-black">Falcon</strong>, an IT and software engineering company dedicated to crafting purposeful digital architecture and autonomous software tools for deep work.
          </p>
        </div>
      </div>

      {/* 2. Keyboard Architecture Quick Reference Matrix */}
      <div className="relative pt-10 border-t border-white/10 dark:border-white/10 light:border-black/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Command className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[12px] sm:text-[13px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 light:text-[#7d7d7d]">
              KEYBOARD ARCHITECTURE
            </span>
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-600 dark:text-zinc-500 light:text-zinc-400 hidden sm:inline">
            ZERO LATENCY
          </span>
        </div>

        {/* Technical Specification Matrix */}
        <div className="relative">
          {/* Corner Brackets */}
          <span className="hidden sm:block absolute size-5 border-white/30 dark:border-white/30 light:border-black/20 -left-2.5 -top-2.5 border-l-2 border-t-2 pointer-events-none" />
          <span className="hidden sm:block absolute size-5 border-white/30 dark:border-white/30 light:border-black/20 -right-2.5 -top-2.5 border-r-2 border-t-2 pointer-events-none" />
          <span className="hidden sm:block absolute size-5 border-white/30 dark:border-white/30 light:border-black/20 -bottom-2.5 -left-2.5 border-b-2 border-l-2 pointer-events-none" />
          <span className="hidden sm:block absolute size-5 border-white/30 dark:border-white/30 light:border-black/20 -bottom-2.5 -right-2.5 border-b-2 border-r-2 pointer-events-none" />

          <dl className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-white/10 dark:border-white/10 light:border-black/10 bg-white/[0.02] dark:bg-white/[0.02] light:bg-white/60 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-r border-b border-white/10 dark:border-white/10 light:border-black/10">
              <dt className="text-xs font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700">Toggle Timer</dt>
              <dd>
                <kbd className="px-2 py-0.5 rounded bg-white/10 dark:bg-white/10 light:bg-black/5 text-white dark:text-white light:text-black font-mono text-[11px] font-bold border border-white/15 dark:border-white/15 light:border-black/15 shadow-xs">
                  Space
                </kbd>
              </dd>
            </div>

            <div className="flex items-center justify-between p-3.5 sm:p-4 border-r border-b border-white/10 dark:border-white/10 light:border-black/10">
              <dt className="text-xs font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700">Reset Session</dt>
              <dd>
                <kbd className="px-2 py-0.5 rounded bg-white/10 dark:bg-white/10 light:bg-black/5 text-white dark:text-white light:text-black font-mono text-[11px] font-bold border border-white/15 dark:border-white/15 light:border-black/15 shadow-xs">
                  R
                </kbd>
              </dd>
            </div>

            <div className="flex items-center justify-between p-3.5 sm:p-4 border-r border-b border-white/10 dark:border-white/10 light:border-black/10">
              <dt className="text-xs font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700">Zen Mode</dt>
              <dd>
                <kbd className="px-2 py-0.5 rounded bg-white/10 dark:bg-white/10 light:bg-black/5 text-white dark:text-white light:text-black font-mono text-[11px] font-bold border border-white/15 dark:border-white/15 light:border-black/15 shadow-xs">
                  Z
                </kbd>
              </dd>
            </div>

            <div className="flex items-center justify-between p-3.5 sm:p-4 border-r border-b border-white/10 dark:border-white/10 light:border-black/10">
              <dt className="text-xs font-medium text-zinc-300 dark:text-zinc-300 light:text-zinc-700">New Task</dt>
              <dd>
                <kbd className="px-2 py-0.5 rounded bg-white/10 dark:bg-white/10 light:bg-black/5 text-white dark:text-white light:text-black font-mono text-[11px] font-bold border border-white/15 dark:border-white/15 light:border-black/15 shadow-xs">
                  N
                </kbd>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
};
