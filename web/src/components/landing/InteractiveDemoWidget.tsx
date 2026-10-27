import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { soundManager } from '../../utils/sound';
import confetti from 'canvas-confetti';

interface InteractiveDemoWidgetProps {
  onEnterApp?: () => void;
  onOpenAuth?: () => void;
}

export const InteractiveDemoWidget: React.FC<InteractiveDemoWidgetProps> = ({ onOpenAuth }) => {
  const selectedDuration = 60;
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<number | null>(null);

  const sectionRef = useRef<HTMLElement | null>(null);
  const hasAutoStartedRef = useRef(false);

  const handleStart = useCallback(() => {
    setRemainingSeconds((prev) => (prev === 0 ? selectedDuration : prev));
    soundManager.playStart();
    setIsRunning(true);
  }, [selectedDuration]);

  const handlePause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const handleReset = useCallback((duration = selectedDuration) => {
    setIsRunning(false);
    setRemainingSeconds(duration);
  }, [selectedDuration]);

  // 1. Auto-start immediately when this section scrolls into the viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAutoStartedRef.current && remainingSeconds > 0) {
          hasAutoStartedRef.current = true;
          handleStart();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [handleStart, remainingSeconds]);

  // 2. Countdown timer loop & trigger login upon completion
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            soundManager.playComplete();
            try {
              confetti({
                particleCount: 40,
                spread: 60,
                origin: { y: 0.65 },
                colors: ['#FFFFFF', '#10B981'],
              });
            } catch {
              // ignore
            }

            // Immediately launch the login modal when the timer finishes
            setTimeout(() => {
              onOpenAuth?.();
            }, 600);

            return 0;
          }

          if (prev <= 6 && prev > 1) {
            soundManager.playCountdownTick(prev - 1);
          }

          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, onOpenAuth]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (remainingSeconds / selectedDuration) * circumference;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-20 px-6 sm:px-12 max-w-2xl mx-auto select-none"
    >
      {/* Terra Industries Architectural Vertical Hairline Guides */}
      <span className="dash-y pointer-events-none absolute inset-y-0 left-2 sm:left-4 hidden md:block w-px" />
      <span className="dash-y pointer-events-none absolute inset-y-0 right-2 sm:right-4 hidden md:block w-px" />

      {/* Main Architectural Container */}
      <div className="relative p-8 sm:p-12 rounded-none bg-black/80 dark:bg-black/90 light:bg-white border border-white/10 dark:border-white/10 light:border-black/10 shadow-2xl flex flex-col items-center text-center">
        
        {/* Reticle Corner Brackets */}
        <span className="absolute size-6 border-white/30 dark:border-white/30 light:border-black/20 -left-2 -top-2 border-l-2 border-t-2 pointer-events-none" />
        <span className="absolute size-6 border-white/30 dark:border-white/30 light:border-black/20 -right-2 -top-2 border-r-2 border-t-2 pointer-events-none" />
        <span className="absolute size-6 border-white/30 dark:border-white/30 light:border-black/20 -bottom-2 -left-2 border-b-2 border-l-2 pointer-events-none" />
        <span className="absolute size-6 border-white/30 dark:border-white/30 light:border-black/20 -bottom-2 -right-2 border-b-2 border-r-2 pointer-events-none" />

        <h3 className="text-2xl sm:text-3xl font-medium tracking-[-0.03em] text-white dark:text-white light:text-black mb-1">
          Experience 60 Seconds of Flow
        </h3>
        <p className="text-sm font-normal text-zinc-400 dark:text-zinc-400 light:text-[#7d7d7d] mb-8 max-w-sm">
          Hands-on simulation. Watch the countdown or let it guide you into focus.
        </p>

        {/* Circular Countdown Ring */}
        <div className="relative w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className="stroke-white/10 dark:stroke-white/10 light:stroke-black/10"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className="stroke-white dark:stroke-white light:stroke-black transition-all duration-500 ease-linear"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-5xl font-bold tabular-nums text-white dark:text-white light:text-black tracking-tight">
              {formatTime(remainingSeconds)}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 light:text-zinc-500 mt-2">
              {remainingSeconds === 0 ? 'COMPLETE' : isRunning ? 'IN FLOW' : 'RESTING'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="group inline-flex h-12 items-center gap-3 px-7 rounded-full bg-white dark:bg-white light:bg-black text-black dark:text-black light:text-white font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.03] active:scale-95 shadow-md cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{remainingSeconds < selectedDuration ? 'Resume' : 'Start Demo'}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="group inline-flex h-12 items-center gap-3 px-7 rounded-full bg-zinc-800 dark:bg-zinc-800 light:bg-zinc-200 text-white dark:text-white light:text-black font-bold text-xs uppercase tracking-wider transition-all hover:scale-[1.03] active:scale-95 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={() => handleReset()}
            className="size-12 rounded-full flex items-center justify-center border border-white/10 dark:border-white/10 light:border-black/10 bg-white/5 dark:bg-white/5 light:bg-black/5 text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black transition-colors cursor-pointer"
            title="Reset Countdown"
            aria-label="Reset Countdown"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => soundManager.playStart()}
            className="size-12 rounded-full flex items-center justify-center border border-white/10 dark:border-white/10 light:border-black/10 bg-white/5 dark:bg-white/5 light:bg-black/5 text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black transition-colors cursor-pointer"
            title="Test Chime Tone"
            aria-label="Test Chime Tone"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
