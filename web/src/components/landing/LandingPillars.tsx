import React from 'react';
import { Timer, BarChart3, Calendar, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface LandingPillarsProps {
  onEnterApp: () => void;
}

export const LandingPillars: React.FC<LandingPillarsProps> = ({ onEnterApp }) => {
  const pillars = [
    {
      number: '01',
      title: 'Monastic Sprint',
      category: 'TACTILE WORKFLOW',
      icon: Timer,
      description:
        'Tactile Pomodoro sprints with configurable work & break intervals, progressive circle indicators, and synthesized harmonic acoustic alerts tuned to C5–C6.',
      badge: 'Web Audio API',
    },
    {
      number: '02',
      title: 'Weekly Rhythm',
      category: 'DEEP METRICS',
      icon: BarChart3,
      description:
        'Recharts-powered 7-day focus duration bar charts. Monitor daily flow duration, compare trends against prior week milestones, and optimize high-energy windows.',
      badge: 'Recharts Engine',
    },
    {
      number: '03',
      title: 'Consistency Grid',
      category: 'HABIT VISUALIZATION',
      icon: Calendar,
      description:
        'A GitHub-style year-round activity heatmap mapping active focus sessions and completed tasks. Build unbroken momentum day by day.',
      badge: 'Activity Heatmap',
    },
    {
      number: '04',
      title: 'Privacy & Autonomy',
      category: 'INFRASTRUCTURE',
      icon: ShieldCheck,
      description:
        'Zero telemetry, offline-first local cache, and private cloud sync via FastAPI & SQLModel. Seamless companion sync with the Android mobile app.',
      badge: 'Offline-First + Mobile',
    },
  ];

  return (
    <section id="pillars" className="w-full py-28 px-6 sm:px-12 max-w-7xl mx-auto select-none">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500 light:text-zinc-500">
            [ 02 / THE ARCHITECTURE ]
          </span>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white dark:text-white light:text-black mt-3">
            Engineered for <span className="font-semibold italic">flow</span>, not distraction.
          </h2>
        </div>
        <p className="text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-600 max-w-md font-light leading-relaxed">
          Most productivity tools demand your attention. Focus gets out of the way so you can do your best thinking.
        </p>
      </div>

      {/* Grid of 4 Monastic Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.number}
              onClick={onEnterApp}
              className="group relative p-8 sm:p-10 rounded-3xl bg-zinc-950/70 dark:bg-zinc-950/80 light:bg-white border border-zinc-800/80 dark:border-zinc-800/80 light:border-zinc-200/90 hover:border-zinc-600 dark:hover:border-zinc-600 light:hover:border-zinc-400 transition-all duration-300 hover:shadow-2xl cursor-pointer flex flex-col justify-between"
            >
              {/* Top row: Number and Badge */}
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="font-mono text-2xl font-light text-zinc-600 dark:text-zinc-600 light:text-zinc-400 group-hover:text-white dark:group-hover:text-white light:group-hover:text-black transition-colors">
                    {pillar.number}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono tracking-wider uppercase px-2.5 py-1 rounded-full bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-100 border border-zinc-800 dark:border-zinc-800 light:border-zinc-200 text-zinc-400 dark:text-zinc-400 light:text-zinc-600">
                      {pillar.badge}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-100 border border-zinc-800 dark:border-zinc-800 light:border-zinc-300 flex items-center justify-center text-zinc-400 group-hover:text-white dark:group-hover:text-white light:group-hover:text-black group-hover:scale-110 transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Pillar Icon & Category */}
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.15em] text-zinc-500 mb-2">
                  <Icon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-400 light:text-zinc-600" />
                  <span>{pillar.category}</span>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-semibold text-white dark:text-white light:text-black mb-4">
                  {pillar.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-zinc-400 dark:text-zinc-400 light:text-zinc-600 font-light leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              {/* Bottom decorative bar */}
              <div className="w-full h-1 mt-8 bg-zinc-900 dark:bg-zinc-900 light:bg-zinc-100 rounded-full overflow-hidden">
                <div className="w-0 group-hover:w-full h-full bg-white dark:bg-white light:bg-black transition-all duration-500 ease-out" />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
