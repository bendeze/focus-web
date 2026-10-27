import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface LandingHeroProps {
  onFocusNow: () => void;
  onExplore: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onFocusNow, onExplore }) => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Compute smooth opacity and translation based on natural scroll position:
  // scrollY <= 3: hidden smoothly at the top
  // scrollY 3 -> 60: reveals smoothly on scroll down; hides smoothly on scroll up
  // scrollY 60 -> 180: stays visible
  // scrollY 180 -> 330: disappears smoothly and slowly as scroll continues down
  // scrollY > 330: completely vanished
  let opacity = 0;
  let translateY = 16;

  if (scrollY <= 3) {
    opacity = 0;
    translateY = 16;
  } else if (scrollY <= 60) {
    const t = (scrollY - 3) / 57;
    opacity = t;
    translateY = 16 * (1 - t);
  } else if (scrollY <= 180) {
    opacity = 1;
    translateY = 0;
  } else if (scrollY <= 330) {
    const t = (scrollY - 180) / 150;
    opacity = 1 - t;
    translateY = -16 * t;
  } else {
    opacity = 0;
    translateY = -16;
  }

  return (
    <section
      id="hero"
      className="relative min-h-[92vh] sm:min-h-screen py-24 sm:py-28 px-6 sm:px-12 flex flex-col items-center justify-center text-center select-none overflow-hidden"
    >
      {/* Terra Industries Architectural Vertical Hairline Guides */}
      <span className="dash-y pointer-events-none absolute inset-y-0 left-6 sm:left-10 lg:left-16 hidden md:block w-px" />
      <span className="dash-y pointer-events-none absolute inset-y-0 right-6 sm:right-10 lg:right-16 hidden md:block w-px" />

      {/* 1. Display Headline in Terra Industries Rethink Sans tight tracking style */}
      <div className="max-w-4xl mx-auto mb-8 sm:mb-10 z-10">
        <h1 className="text-[clamp(38px,5.4vw,74px)] font-normal leading-[1.08] tracking-[-0.04em] text-white dark:text-white light:text-black">
          Silence the noise. <br />
          <span className="font-normal text-zinc-400 dark:text-zinc-400 light:text-[#7d7d7d]">
            Stay in uninterrupted flow.
          </span>
        </h1>

        {/* Smooth dynamic scroll-revealed narrative paragraph */}
        <div className="min-h-[58px] sm:min-h-[52px] flex items-center justify-center">
          <p
            className="mt-5 text-[17px] sm:text-[17.5px] font-medium leading-relaxed tracking-[-0.03em] text-zinc-400 dark:text-zinc-400 light:text-[#7d7d7d] max-w-2xl mx-auto"
            style={{
              opacity,
              transform: `translateY(${translateY.toFixed(2)}px)`,
              transition: 'opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: opacity > 0.1 ? 'auto' : 'none',
            }}
          >
            Engineered for builders, researchers, and engineers who demand deep concentration without surveillance, friction, or distraction.
          </p>
        </div>
      </div>

      {/* 2. Action Buttons in Terra Industries High-Contrast Pill Aesthetic */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-14 sm:mb-16 z-10">
        {/* Focus Workspace Button -> Redirects to Login / Auth */}
        <button
          onClick={onFocusNow}
          className="group w-full sm:w-auto inline-flex h-12 items-center justify-between sm:justify-center gap-4 px-8 rounded-full bg-white dark:bg-white light:bg-black text-black dark:text-black light:text-white font-medium text-[14px] tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg cursor-pointer"
        >
          <span>Focus Workspace</span>
          <span className="grid size-7 place-items-center rounded-full bg-black dark:bg-black light:bg-white text-white dark:text-white light:text-black transition-transform group-hover:translate-x-1">
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>

        {/* Explore The Solution Button -> Smooth Scrolls to Solution Section */}
        <button
          onClick={onExplore}
          className="group w-full sm:w-auto inline-flex h-12 items-center justify-between sm:justify-center gap-3 px-8 rounded-full border border-white/20 dark:border-white/20 light:border-black/20 bg-white/5 dark:bg-white/5 light:bg-white/60 font-bold text-[14px] tracking-wide text-white dark:text-white light:text-black hover:border-white/40 dark:hover:border-white/40 light:hover:border-black/40 transition-all cursor-pointer backdrop-blur-md"
        >
          <span>Explore Solution</span>
          <ChevronDown className="w-4 h-4 text-zinc-400 transition-transform group-hover:translate-y-0.5" />
        </button>
      </div>

      {/* 3. Terra Industries <dl> Specification Matrix */}
      <div className="relative w-full max-w-4xl z-10">
        {/* Corner Reticle Brackets */}
        <span className="hidden sm:block absolute size-6 border-white/20 dark:border-white/20 light:border-black/20 -left-3 -top-3 border-l-2 border-t-2 pointer-events-none" />
        <span className="hidden sm:block absolute size-6 border-white/20 dark:border-white/20 light:border-black/20 -right-3 -top-3 border-r-2 border-t-2 pointer-events-none" />
        <span className="hidden sm:block absolute size-6 border-white/20 dark:border-white/20 light:border-black/20 -bottom-3 -left-3 border-b-2 border-l-2 pointer-events-none" />
        <span className="hidden sm:block absolute size-6 border-white/20 dark:border-white/20 light:border-black/20 -bottom-3 -right-3 border-b-2 border-r-2 pointer-events-none" />

        <dl className="grid grid-cols-2 md:grid-cols-4 border-l border-t border-white/10 dark:border-white/10 light:border-black/10 bg-white/[0.02] dark:bg-white/[0.02] light:bg-white/60 rounded-xl overflow-hidden backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center p-5 sm:p-6 border-r border-b border-white/10 dark:border-white/10 light:border-black/10 text-center">
            <dt className="text-[12px] sm:text-[13px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 light:text-[#7d7d7d]">
              Sprint Cadence
            </dt>
            <dd className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-white dark:text-white light:text-black">
              25 <span className="text-xs font-normal text-zinc-500">MIN</span>
            </dd>
          </div>

          <div className="flex flex-col items-center justify-center p-5 sm:p-6 border-r border-b border-white/10 dark:border-white/10 light:border-black/10 text-center">
            <dt className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 light:text-[#7d7d7d]">
              Distraction Leak
            </dt>
            <dd className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-white dark:text-white light:text-black">
              0 <span className="text-xs font-normal text-zinc-500">%</span>
            </dd>
          </div>

          <div className="flex flex-col items-center justify-center p-5 sm:p-6 border-r border-b border-white/10 dark:border-white/10 light:border-black/10 text-center">
            <dt className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 light:text-[#7d7d7d]">
              Architecture
            </dt>
            <dd className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-white dark:text-white light:text-black">
              100 <span className="text-xs font-normal text-zinc-500">% Offline</span>
            </dd>
          </div>

          <div className="flex flex-col items-center justify-center p-5 sm:p-6 border-r border-b border-white/10 dark:border-white/10 light:border-black/10 text-center">
            <dt className="text-[12px] sm:text-[13px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 light:text-[#7d7d7d]">
              Harmonic Alerts
            </dt>
            <dd className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-white dark:text-white light:text-black">
              4 <span className="text-xs font-normal text-zinc-500">Tones</span>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
};
