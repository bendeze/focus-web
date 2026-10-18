import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Sliders, X, Check, BellOff, Volume2, VolumeX } from 'lucide-react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { soundManager } from '../utils/sound';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import type { Task } from '../types';

interface PomodoroTimerWidgetProps {
  tasks: Task[];
  onSessionFinished?: () => Promise<void> | void;
}

type TimerMode = 'focus' | 'break';

export const PomodoroTimerWidget: React.FC<PomodoroTimerWidgetProps> = ({
  tasks,
  onSessionFinished,
}) => {
  const {
    remainingSeconds,
    totalSeconds,
    setRemainingSeconds,
    setTotalSeconds,
    isTimerRunning,
    setIsTimerRunning,
    decrementTimer,
    pauseCurrentTimer,
    resumeCurrentTimer,
    resetCurrentTimer,
    clearTaskTimer,
    selectedTaskId,
    setSelectedTaskId,
    addToast,
  } = useStore();

  // Pomodoro Customization Settings (saved in localStorage)
  const [pomodoroFocusDuration, setPomodoroFocusDuration] = useState<number>(() => {
    const saved = localStorage.getItem('pomodoro_focus_duration');
    return saved ? parseInt(saved, 10) : 25;
  });
  const [breakDuration, setBreakDuration] = useState<number>(() => {
    const saved = localStorage.getItem('pomodoro_break_duration');
    return saved ? parseInt(saved, 10) : 5;
  });
  const [totalSessions, setTotalSessions] = useState<number>(() => {
    const saved = localStorage.getItem('pomodoro_total_sessions');
    return saved ? parseInt(saved, 10) : 4;
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('pomodoro_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [dndEnabled, setDndEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('pomodoro_dnd_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  // Widget function: 'pomodoro' considers pomodoro settings; 'task' runs the clicked task's timer
  const [widgetFunction, setWidgetFunction] = useState<'pomodoro' | 'task'>('task');

  // State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0); // 0-based: 0 to totalSessions - 1

  const pendingTasks = tasks.filter((t) => t.status !== 'completed' && !t.is_deleted);
  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId && !t.is_deleted) : null;
  const activeTask = selectedTask || pendingTasks[0];

  // Keep a ref to avoid stale closures in interval
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Persist Pomodoro settings
  useEffect(() => {
    localStorage.setItem('pomodoro_focus_duration', pomodoroFocusDuration.toString());
  }, [pomodoroFocusDuration]);

  useEffect(() => {
    localStorage.setItem('pomodoro_break_duration', breakDuration.toString());
  }, [breakDuration]);

  useEffect(() => {
    localStorage.setItem('pomodoro_total_sessions', totalSessions.toString());
  }, [totalSessions]);

  useEffect(() => {
    localStorage.setItem('pomodoro_sound_enabled', soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('pomodoro_dnd_enabled', dndEnabled.toString());
  }, [dndEnabled]);

  // Sync settings when modified from the SettingsSidebar
  useEffect(() => {
    const handleSettingsUpdated = () => {
      const savedFocus = localStorage.getItem('pomodoro_focus_duration');
      if (savedFocus) setPomodoroFocusDuration(parseInt(savedFocus, 10));
      const savedBreak = localStorage.getItem('pomodoro_break_duration');
      if (savedBreak) setBreakDuration(parseInt(savedBreak, 10));
      const savedSound = localStorage.getItem('pomodoro_sound_enabled');
      if (savedSound !== null) setSoundEnabled(savedSound === 'true');
      const savedDnd = localStorage.getItem('pomodoro_dnd_enabled');
      if (savedDnd !== null) setDndEnabled(savedDnd === 'true');
    };

    window.addEventListener('focus-settings-changed', handleSettingsUpdated);
    window.addEventListener('storage', handleSettingsUpdated);
    return () => {
      window.removeEventListener('focus-settings-changed', handleSettingsUpdated);
      window.removeEventListener('storage', handleSettingsUpdated);
    };
  }, []);

  // When selectedTaskId changes, ensure we are in task mode and focus mode
  useEffect(() => {
    if (selectedTaskId) {
      setWidgetFunction('task');
      setTimerMode('focus');
    }
  }, [selectedTaskId]);

  // Handle switching between Pomodoro mode and Task Timer mode
  const handleSwitchFunction = (fn: 'pomodoro' | 'task') => {
    if (fn === widgetFunction) return;
    pauseCurrentTimer();
    setWidgetFunction(fn);
    if (fn === 'pomodoro') {
      setTimerMode('focus');
      const pomSecs = pomodoroFocusDuration * 60;
      setTotalSeconds(pomSecs);
      setRemainingSeconds(pomSecs);
    } else {
      setTimerMode('focus');
      const targetTask = selectedTask || activeTask;
      if (targetTask && !selectedTaskId) {
        setSelectedTaskId(targetTask.id);
      }
      const taskSecs = (targetTask?.estimated_minutes || 25) * 60;
      setTotalSeconds(taskSecs);
      setRemainingSeconds(taskSecs);
    }
  };

  // Timer complete handler
  const handleTimerComplete = async () => {
    setIsTimerRunning(false);

    if (timerMode === 'focus') {
      if (soundEnabledRef.current) {
        soundManager.playComplete();
      }

      if (widgetFunction === 'task') {
        const targetTaskId = selectedTaskId || activeTask?.id;
        const taskName = selectedTask?.title || activeTask?.title || 'Task';
        if (targetTaskId) {
          try {
            await api.updateTask(targetTaskId, { status: 'completed' });
            clearTaskTimer(targetTaskId);
          } catch {
            // ignore
          }
        }
        addToast(`Focus session complete for "${taskName}"!`, 'success');
        onSessionFinished?.();
        return;
      }

      addToast('Focus session complete! Take a break.', 'success');
      onSessionFinished?.();

      // Check if this was the final session in the cycle
      const nextSession = currentSessionIndex + 1;
      if (nextSession >= totalSessions) {
        setCurrentSessionIndex(0);
        setTimerMode('focus');
        setRemainingSeconds(pomodoroFocusDuration * 60);
        setTotalSeconds(pomodoroFocusDuration * 60);
        addToast('Full Pomodoro cycle finished! Excellent work.', 'success');
      } else {
        // Switch to Break Mode
        setCurrentSessionIndex(nextSession);
        setTimerMode('break');
        setRemainingSeconds(breakDuration * 60);
        setTotalSeconds(breakDuration * 60);
      }
    } else {
      // Break completed -> Switch back to Focus Mode for next session
      if (soundEnabledRef.current) {
        soundManager.playBreakEnd();
      }
      setTimerMode('focus');
      setRemainingSeconds(pomodoroFocusDuration * 60);
      setTotalSeconds(pomodoroFocusDuration * 60);
      addToast('Break over! Ready for the next focus sprint.', 'info');
    }
  };

  const handleTimerCompleteRef = useRef(handleTimerComplete);
  useEffect(() => {
    handleTimerCompleteRef.current = handleTimerComplete;
  });

  // Main countdown loop with 15-second tick-down sounds and auto-transition
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isTimerRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        // Sound: 15 seconds before end, play tick on each second (15, 14, ..., 1)
        if (soundEnabledRef.current && remainingSeconds - 1 <= 15 && remainingSeconds - 1 >= 1) {
          soundManager.playCountdownTick(remainingSeconds - 1);
        }

        if (remainingSeconds - 1 <= 0) {
          decrementTimer();
          handleTimerCompleteRef.current();
        } else {
          decrementTimer();
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, remainingSeconds, decrementTimer]);

  // Start / Pause Toggle
  const handleToggleTimer = () => {
    if (isTimerRunning) {
      pauseCurrentTimer();
    } else {
      if (soundEnabledRef.current) {
        soundManager.playStart();
      }
      resumeCurrentTimer();
    }
  };

  // Smart Reset
  const handleResetTimer = () => {
    if (widgetFunction === 'task') {
      const targetDuration = selectedTask?.estimated_minutes || activeTask?.estimated_minutes || 25;
      resetCurrentTimer(targetDuration);
      return;
    }

    setIsTimerRunning(false);
    const currentDuration = timerMode === 'focus' ? pomodoroFocusDuration * 60 : breakDuration * 60;
    const hasElapsed = remainingSeconds < totalSeconds;

    if (hasElapsed || isTimerRunning) {
      setRemainingSeconds(currentDuration);
      setTotalSeconds(currentDuration);
    } else {
      setCurrentSessionIndex(0);
      setTimerMode('focus');
      const focusSecs = pomodoroFocusDuration * 60;
      setRemainingSeconds(focusSecs);
      setTotalSeconds(focusSecs);
    }
  };

  // Apply new settings from the overlay
  const handleApplySettings = (newFocus: number, newBreak: number, newTotal: number) => {
    setPomodoroFocusDuration(newFocus);
    setBreakDuration(newBreak);
    setTotalSessions(newTotal);

    if (widgetFunction === 'pomodoro' && !isTimerRunning) {
      const duration = timerMode === 'focus' ? newFocus * 60 : newBreak * 60;
      setRemainingSeconds(duration);
      setTotalSeconds(duration);
    }
    setIsSettingsOpen(false);
    addToast('Pomodoro settings updated', 'info');
  };

  // Formatted countdown display (MM:SS)
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timerDisplay = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  // SVG Ring Progress (depletes smoothly)
  const radius = 108;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className="relative p-6 pt-6 pb-20 rounded-3xl bg-surface-dark dark:bg-zinc-950/95 light:bg-surface-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex flex-col items-center justify-between gap-5 text-center select-none overflow-hidden min-h-[415px]">

      {/* Top Header: Function Switcher (Pomodoro vs Task Timer) & Settings */}
      <div className="w-full flex items-center justify-between z-20">
        <div className="flex items-center p-0.5 rounded-full bg-zinc-900/90 dark:bg-zinc-900/90 light:bg-hover-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-[11px] font-bold">
          <button
            type="button"
            onClick={() => handleSwitchFunction('pomodoro')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              widgetFunction === 'pomodoro'
                ? 'bg-white dark:bg-white text-black light:bg-black light:text-white shadow-sm'
                : 'text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black'
            }`}
          >
            Pomodoro
          </button>
          <button
            type="button"
            onClick={() => handleSwitchFunction('task')}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              widgetFunction === 'task'
                ? 'bg-white dark:bg-white text-black light:bg-black light:text-white shadow-sm'
                : 'text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black'
            }`}
          >
            Task Timer
          </button>
        </div>

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-8 h-8 rounded-lg bg-hover-dark dark:bg-zinc-900/90 light:bg-hover-light border border-subtle-dark dark:border-subtle-dark light:border-subtle-light flex items-center justify-center text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black hover:border-zinc-500 transition-all cursor-pointer shadow-sm active:scale-95"
                aria-label="Pomodoro Settings"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            }
          />
          <TooltipContent side="left" sideOffset={8} className="px-2.5 py-1 text-xs">
            Pomodoro settings
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Circular Progress Ring (r=108, centered cx=114 cy=114, moved down away from top border) */}
      <div className="relative flex items-center justify-center mt-2 z-10">
        <svg className="w-[228px] h-[228px] -rotate-90" viewBox="0 0 228 228">
          <circle
            cx="114"
            cy="114"
            r={radius}
            className="text-subtle-dark dark:text-subtle-dark light:text-subtle-light"
            stroke="currentColor"
            strokeWidth="3.5"
            fill="transparent"
          />
          <circle
            cx="114"
            cy="114"
            r={radius}
            stroke="currentColor"
            strokeWidth="3.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${timerMode === 'break'
                ? 'text-emerald-400'
                : 'text-white dark:text-white light:text-black'
              } transition-all duration-1000 ease-linear`}
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center pointer-events-none">
          <span className="text-4xl font-extrabold tracking-tight tabular-nums font-sans text-white dark:text-white light:text-black">
            {timerDisplay}
          </span>
        </div>
      </div>

      {/* Dynamic Session Info & Progressive Line Indicators */}
      <div className="flex flex-col items-center gap-1.5 z-10 max-w-full px-4">
        {widgetFunction === 'task' && (selectedTask || activeTask) ? (
          <>
            <div className="flex items-center justify-center gap-1.5 max-w-[260px]">
              <span className="text-sm font-bold tracking-tight text-white dark:text-white light:text-black truncate">
                {(selectedTask || activeTask)?.title}
              </span>
            </div>
            {(selectedTask || activeTask)?.description ? (
              <p className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 line-clamp-2 max-w-[260px] text-center leading-relaxed">
                {(selectedTask || activeTask)?.description}
              </p>
            ) : (
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 light:text-zinc-500 font-medium">
                {(selectedTask || activeTask)?.estimated_minutes || 25} min focus sprint
              </span>
            )}
          </>
        ) : timerMode === 'break' ? (
          <>
            <div className="text-xs font-bold tracking-wide text-emerald-400">
              SHORT BREAK — Break {String(currentSessionIndex).padStart(2, '0')} of ${String(totalSessions).padStart(2, '0')}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 light:text-zinc-500 font-medium">
              {breakDuration} min break
            </div>
          </>
        ) : (
          <>
            <div className="text-xs font-bold tracking-wide text-white dark:text-white light:text-black">
              DEEP WORK — Session {String(currentSessionIndex + 1).padStart(2, '0')} of ${String(totalSessions).padStart(2, '0')}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 light:text-zinc-500 font-medium">
              {pomodoroFocusDuration} min focus · {breakDuration} min break
            </div>
          </>
        )}

        {/* Progress Indicator: Show Pomodoro cycle dots in pomodoro mode */}
        {widgetFunction === 'pomodoro' && (
          <div className="flex items-center gap-2 mt-2">
            {/* Active / Joined Emerald Line Segment */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => {
                      if (!isTimerRunning && currentSessionIndex > 0) {
                        setCurrentSessionIndex(0);
                        setTimerMode('focus');
                        const duration = pomodoroFocusDuration * 60;
                        setRemainingSeconds(duration);
                        setTotalSeconds(duration);
                      }
                    }}
                    style={{
                      width: `${Math.min(currentSessionIndex + 1, totalSessions) * 8 + (Math.min(currentSessionIndex + 1, totalSessions) - 1) * 8}px`,
                    }}
                    className="h-1 rounded-full bg-emerald-400/80 shadow-sm shadow-emerald-500/40 transition-all duration-500 ease-out flex-shrink-0 cursor-pointer"
                    aria-label={`Session 1 to ${currentSessionIndex + 1} active`}
                  />
                }
              />
              <TooltipContent side="top" sideOffset={8} className="px-2.5 py-1.5 flex flex-col gap-0.5 text-center">
                <span className="text-xs font-semibold text-white dark:text-white light:text-black">
                  {currentSessionIndex === 0
                    ? `Session 01 of ${String(totalSessions).padStart(2, '0')}`
                    : `Sessions 01–${String(currentSessionIndex + 1).padStart(2, '0')} of ${String(totalSessions).padStart(2, '0')}`}
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">
                  {timerMode === 'focus' ? 'In progress' : 'Short break'}
                </span>
              </TooltipContent>
            </Tooltip>

            {/* Remaining Upcoming Inactive Dots */}
            {Array.from({ length: Math.max(0, totalSessions - (currentSessionIndex + 1)) }).map((_, idx) => {
              const sessionNum = currentSessionIndex + 2 + idx;
              return (
                <Tooltip key={sessionNum}>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        onClick={() => {
                          if (!isTimerRunning) {
                            setCurrentSessionIndex(sessionNum - 1);
                            setTimerMode('focus');
                            const duration = pomodoroFocusDuration * 60;
                            setRemainingSeconds(duration);
                            setTotalSeconds(duration);
                          }
                        }}
                        disabled={isTimerRunning}
                        className="w-1 h-1 rounded-full bg-zinc-700 dark:bg-zinc-700 light:bg-zinc-300 hover:bg-zinc-500 dark:hover:bg-zinc-500 transition-all duration-500 flex-shrink-0 cursor-pointer disabled:cursor-default"
                        aria-label={`Session ${sessionNum} of ${totalSessions}`}
                      />
                    }
                  />
                  <TooltipContent side="top" sideOffset={8} className="px-2.5 py-1.5 flex flex-col gap-0.5 text-center">
                    <span className="text-xs font-semibold text-white dark:text-white light:text-black">
                      Session {String(sessionNum).padStart(2, '0')} of ${String(totalSessions).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {isTimerRunning ? 'Upcoming sprint' : 'Click to jump'}
                    </span>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>

      {/* Controls Button Row */}
      <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between z-10">
        <button
          onClick={handleToggleTimer}
          className="w-10 h-10 rounded-full bg-white dark:bg-white text-black light:bg-black light:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-sm"
          aria-label={isTimerRunning ? "Pause Timer" : "Start Timer"}
        >
          {isTimerRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </>
          )}
        </button>

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={handleResetTimer}
                className="w-10 h-10 rounded-full bg-hover-dark dark:bg-zinc-900/90 light:bg-hover-light flex items-center justify-center text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black transition-colors cursor-pointer"
                aria-label="Reset Timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            }
          />
          <TooltipContent side="top" sideOffset={8} className="px-2.5 py-1 text-xs">
            {remainingSeconds < totalSeconds || isTimerRunning
              ? 'Reset current sprint'
              : currentSessionIndex > 0 || timerMode === 'break'
              ? 'Reset cycle to Session 01'
              : 'Reset timer'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* ================================================================= */}
      {/* IN-WIDGET SETTINGS OVERLAY (Blurs only this widget on top)         */}
      {/* ================================================================= */}
      {isSettingsOpen && (
        <SettingsOverlay
          focusDuration={pomodoroFocusDuration}
          breakDuration={breakDuration}
          totalSessions={totalSessions}
          soundEnabled={soundEnabled}
          dndEnabled={dndEnabled}
          onSave={handleApplySettings}
          onToggleSound={() => setSoundEnabled((v) => !v)}
          onToggleDnd={() => setDndEnabled((v) => !v)}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};

// Inline Settings Overlay rendered on top of the blurred widget
interface SettingsOverlayProps {
  focusDuration: number;
  breakDuration: number;
  totalSessions: number;
  soundEnabled: boolean;
  dndEnabled: boolean;
  onSave: (focus: number, breakTime: number, total: number) => void;
  onToggleSound: () => void;
  onToggleDnd: () => void;
  onClose: () => void;
}

const SettingsOverlay: React.FC<SettingsOverlayProps> = ({
  focusDuration: initialFocus,
  breakDuration: initialBreak,
  totalSessions: initialTotal,
  soundEnabled,
  dndEnabled,
  onSave,
  onToggleSound,
  onToggleDnd,
  onClose,
}) => {
  const [focus, setFocus] = useState(initialFocus);
  const [breakTime, setBreakTime] = useState(initialBreak);
  const [sessions, setSessions] = useState(initialTotal);

  return (
    <div className="absolute inset-0 z-30 rounded-3xl bg-black/85 dark:bg-black/85 light:bg-white/95 backdrop-blur-md p-5 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-150">

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-subtle-dark dark:border-subtle-dark light:border-subtle-light">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white dark:text-white light:text-black">
          Timer Settings
        </span>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg hover:bg-hover-dark dark:hover:bg-hover-dark light:hover:bg-hover-light flex items-center justify-center text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black transition-colors"
          aria-label="Close Settings"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Grid */}
      <div className="flex flex-col gap-3.5 my-auto text-xs">
        {/* Focus Duration */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 dark:text-zinc-400 light:text-zinc-600 font-medium">
            Focus Session
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFocus((f) => Math.max(5, f - 5))}
              className="w-6 h-6 rounded bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-zinc-300 font-bold hover:bg-zinc-700 flex items-center justify-center transition-colors"
            >
              -
            </button>
            <span className="w-12 text-center font-bold tabular-nums text-white dark:text-white light:text-black">
              {focus}m
            </span>
            <button
              onClick={() => setFocus((f) => Math.min(120, f + 5))}
              className="w-6 h-6 rounded bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-zinc-300 font-bold hover:bg-zinc-700 flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Break Duration */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 dark:text-zinc-400 light:text-zinc-600 font-medium">
            Break Time
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setBreakTime((b) => Math.max(1, b - 1))}
              className="w-6 h-6 rounded bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-zinc-300 font-bold hover:bg-zinc-700 flex items-center justify-center transition-colors"
            >
              -
            </button>
            <span className="w-12 text-center font-bold tabular-nums text-white dark:text-white light:text-black">
              {breakTime}m
            </span>
            <button
              onClick={() => setBreakTime((b) => Math.min(60, b + 1))}
              className="w-6 h-6 rounded bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-zinc-300 font-bold hover:bg-zinc-700 flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Sessions Count */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 dark:text-zinc-400 light:text-zinc-600 font-medium">
            Sessions in Cycle
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSessions((s) => Math.max(1, s - 1))}
              className="w-6 h-6 rounded bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-zinc-300 font-bold hover:bg-zinc-700 flex items-center justify-center transition-colors"
            >
              -
            </button>
            <span className="w-12 text-center font-bold tabular-nums text-white dark:text-white light:text-black">
              {sessions}
            </span>
            <button
              onClick={() => setSessions((s) => Math.min(12, s + 1))}
              className="w-6 h-6 rounded bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-zinc-300 font-bold hover:bg-zinc-700 flex items-center justify-center transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Toggles Row (Sound & DND) */}
        <div className="flex items-center justify-between pt-2 border-t border-subtle-dark dark:border-subtle-dark light:border-subtle-light text-[11px]">
          <button
            onClick={onToggleSound}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Audio Cues On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                <span>Muted</span>
              </>
            )}
          </button>

          <button
            onClick={onToggleDnd}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-hover-dark dark:bg-hover-dark light:bg-hover-light text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <BellOff className={`w-3.5 h-3.5 ${dndEnabled ? 'text-emerald-400' : 'text-zinc-500'}`} />
            <span>{dndEnabled ? 'DND On' : 'DND Off'}</span>
          </button>
        </div>
      </div>

      {/* Done Button */}
      <button
        onClick={() => onSave(focus, breakTime, sessions)}
        className="w-full h-9 rounded-xl bg-white dark:bg-white text-black light:bg-black light:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-sm"
      >
        <Check className="w-3.5 h-3.5" />
        <span>Save & Apply</span>
      </button>

    </div>
  );
};
