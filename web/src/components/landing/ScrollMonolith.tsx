import React, { useRef, useState } from 'react';
import focusDashboardImg from '../../assets/screenshot.png';
import { useElementScrollProgress } from '../../hooks/useScrollProgress';
import { Volume2 } from 'lucide-react';
import { soundManager } from '../../utils/sound';

export const ScrollMonolith: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progress = useElementScrollProgress(containerRef);

  // Subtle mouse tilt for depth
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x: x * 10, y: y * 10 });
  };

  const handleMouseLeave = () => {
    setMouseOffset({ x: 0, y: 0 });
  };

  // Smooth scroll interpolation
  const scale = 0.92 + Math.sin(progress * Math.PI) * 0.12; // 0.92 -> 1.04
  const rotateX = (0.5 - progress) * 16 + mouseOffset.y;
  const rotateY = mouseOffset.x;
  const translateY = (0.5 - progress) * 40;
  const glowOpacity = Math.sin(progress * Math.PI) * 0.85;

  const handlePlayTone = () => {
    soundManager.playStart();
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full py-16 sm:py-24 flex flex-col items-center justify-center overflow-hidden transition-colors select-none"
    >
      {/* Top Dashed Divider */}
      <div className="dash-x h-px w-full mb-8 sm:mb-12" />

      {/* Section Sub-Header Bar (Terra Industries Style) */}
      <div className="w-full max-w-6xl px-6 sm:px-12 flex items-center justify-end mb-8 sm:mb-12">
        <span className="text-[11px] sm:text-[12px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-500 light:text-zinc-400">
          FOCUS OS // V2.4
        </span>
      </div>

      {/* Terra Industries Architectural Vertical Hairline Guides */}
      <span className="dash-y pointer-events-none absolute inset-y-0 left-6 sm:left-10 lg:left-16 hidden md:block w-px" />
      <span className="dash-y pointer-events-none absolute inset-y-0 right-6 sm:right-10 lg:right-16 hidden md:block w-px" />


      {/* 3D Workspace Stage */}
      <div
        className="relative z-10 w-full max-w-5xl px-4 sm:px-8 flex items-center justify-center"
        style={{ perspective: 1200 }}
      >
        <div
          className="relative w-full transition-transform duration-200 ease-out will-change-transform"
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(${translateY}px) scale(${scale})`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Central Workspace Window with Terra Industries Corner Reticles */}
          <div className="relative rounded-2xl bg-zinc-950/90 dark:bg-black/95 light:bg-white border border-white/10 dark:border-white/10 light:border-black/10 shadow-2xl dark:shadow-[0_30px_90px_rgba(0,0,0,0.9)] light:shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-2xl overflow-hidden p-2 sm:p-3">
            
            {/* Window Top Console Chrome Bar */}
            <div className="px-4 py-1.5 mb-2 rounded-lg border border-white/5 dark:border-white/5 light:border-black/5 flex items-center justify-between bg-white/[0.02] dark:bg-white/[0.02] light:bg-black/[0.02]">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 light:text-zinc-700">
                 FOCUS // DESKTOP WORKSPACE
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-1.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  STAY IN FLOW
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider bg-white/5 dark:bg-white/5 light:bg-black/5 text-zinc-400 dark:text-zinc-400 light:text-zinc-600 border border-white/10 dark:border-white/10 light:border-black/10">
                  100% OFFLINE
                </span>
              </div>
            </div>

            {/* The Actual Focus App Screenshot */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 dark:border-white/10 light:border-black/10 bg-black">
              <img
                src={focusDashboardImg}
                alt="Focus App Workspace"
                className="w-full h-auto object-cover select-none pointer-events-none filter drop-shadow-2xl"
                loading="lazy"
              />
            </div>

          </div>

          {/* Floating Metric Pill: 12:01 SPRINT ACTIVE */}
          <div
            className="absolute -top-4 -left-3 sm:-top-3 sm:-left-6 px-4 py-1.5 rounded-full bg-black/90 dark:bg-black/95 light:bg-white border border-white/20 dark:border-white/20 light:border-black/15 text-xs font-mono tracking-wider shadow-lg flex items-center gap-2.5 backdrop-blur-md"
            style={{ transform: 'translateZ(40px)' }}
          >
            <span className="text-[9px] text-white dark:text-white light:text-black font-semibold">12:01 SPRINT ACTIVE</span>
          </div>

          {/* Floating Metric Pill: Sound Trigger */}
          <button
            onClick={handlePlayTone}
            className="absolute -bottom-4 -right-3 sm:-bottom-3 sm:-right-6 group px-4 py-1.5 rounded-full bg-black/90 dark:bg-black/95 light:bg-white border border-white/20 dark:border-white/20 light:border-black/15 text-xs font-mono tracking-wider shadow-lg flex items-center gap-2 backdrop-blur-md hover:border-white/40 dark:hover:border-white/40 light:hover:border-black/30 transition-all cursor-pointer"
            style={{ transform: 'translateZ(45px)' }}
            title="Test Acoustic Chime"
          >
            <Volume2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white dark:group-hover:text-white light:group-hover:text-black transition-colors" />
            <span className="text-[9px] text-zinc-300 dark:text-zinc-300 light:text-zinc-700 font-semibold group-hover:text-white dark:group-hover:text-white light:group-hover:text-black">
              Play Chime
            </span>
          </button>

        </div>
      </div>

      {/* Bottom Dashed Divider */}
      <div className="dash-x h-px w-full mt-14 sm:mt-20" />
    </section>
  );
};
