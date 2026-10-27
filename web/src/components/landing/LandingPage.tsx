import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useScrollProgress } from '../../hooks/useScrollProgress';
import { LandingNavbar } from './LandingNavbar';
import { LandingHero } from './LandingHero';
import { ScrollMonolith } from './ScrollMonolith';
import { InteractiveDemoWidget } from './InteractiveDemoWidget';
import { LandingEcosystem } from './LandingEcosystem';
import { LandingAbout } from './LandingAbout';
import { LandingFooter } from './LandingFooter';

interface LandingPageProps {
  onOpenAuth?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const { setActiveTab } = useStore();
  const { progress } = useScrollProgress();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleEnterApp = () => {
    setActiveTab('dashboard');
  };

  const handleFocusNow = () => {
    if (onOpenAuth) {
      onOpenAuth();
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleExplore = () => {
    const el = document.getElementById('solution');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-black dark:bg-black light:bg-[#f0efea] text-white dark:text-white light:text-black overflow-x-hidden transition-colors selection:bg-white selection:text-black dark:selection:bg-white dark:selection:text-black light:selection:bg-black light:selection:text-white">
      
      {/* Pinned Vertical Scroll Progress Hairline Indicator */}
      <div
        className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-center gap-2 pointer-events-none"
        aria-hidden="true"
      >
        <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest -rotate-90 origin-center mb-4">
          FLOW
        </span>
        <div className="w-[1.5px] h-32 bg-zinc-800/80 dark:bg-zinc-800/80 light:bg-zinc-300 rounded-full overflow-hidden">
          <div
            className="w-full bg-white dark:bg-white light:bg-black transition-all duration-150 ease-out"
            style={{ height: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <span className="text-[9px] font-mono text-zinc-500 tabular-nums mt-1">
          {Math.round(progress * 100)}%
        </span>
      </div>

      {/* 1. Ultra Minimalist Header: Left Triangle; Right Theme, User, and Launch Button */}
      <LandingNavbar onEnterApp={handleEnterApp} onOpenAuth={onOpenAuth} />

      {/* 2. Hero Section: Short phrase, Focus Now (Login) + Explore Solution, and Statistics */}
      <LandingHero onFocusNow={handleFocusNow} onExplore={handleExplore} />

      {/* 3. The 3D Scroll-Animated Monolith Showcase */}
      <ScrollMonolith />

      {/* 4. Interactive 60s Focus Demo (Auto-starts on screen, launches login on completion) */}
      <InteractiveDemoWidget onEnterApp={handleEnterApp} onOpenAuth={onOpenAuth} />

      {/* 5. From Your Desk To Your Pocket: Web System & Android APK Download */}
      <LandingEcosystem onEnterApp={handleEnterApp} />

      {/* 6. About Falcon & Keyboard Architecture */}
      <LandingAbout />

      {/* 7. Minimalist Footer: Falcon Branding, Mail Contact & Social Icons */}
      <LandingFooter />

    </div>
  );
};
