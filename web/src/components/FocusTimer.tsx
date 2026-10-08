import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import type { Task } from '../types';
import confetti from 'canvas-confetti';
import {
  Play,
  Pause,
  CheckCircle2,
  X,
  Maximize2,
  Minimize2,
  Flame,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

interface FocusTimerProps {
  tasks: Task[];
  onSessionFinished?: () => void;
  onOpenAuth?: () => void;
}

export const FocusTimer: React.FC<FocusTimerProps> = ({ tasks, onSessionFinished, onOpenAuth }) => {
  const {
    user,
    activeSession,
    setActiveSession,
    remainingSeconds,
    totalSeconds,
    isTimerRunning,
    selectedTaskId,
    setSelectedTaskId,
    setRemainingSeconds,
    setTotalSeconds,
    setIsTimerRunning,
    decrementTimer,
    isZenMode,
    setZenMode,
    addToast,
  } = useStore();

  const [selectedDuration, setSelectedDuration] = useState<number>(25);
  const [autoCompleteTask, setAutoCompleteTask] = useState<boolean>(true);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const triggerConfetti = React.useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#a0a0a0', '#000000'],
    });
  }, []);

  const handleAutoFinish = React.useCallback(async () => {
    setIsTimerRunning(false);
    triggerConfetti();
    if (activeSession) {
      try {
        await api.completeFocusSession(activeSession.id, {
          actual_focus_seconds: totalSeconds,
          notes: sessionNotes || undefined,
        });
        setActiveSession(null);
        addToast('Focus session completed! Great job.', 'success');
        onSessionFinished?.();
      } catch (err: any) {
        addToast(err.message || 'Failed to complete session', 'error');
      }
    }
  }, [activeSession, totalSeconds, sessionNotes, setActiveSession, setIsTimerRunning, triggerConfetti, addToast, onSessionFinished]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isTimerRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        decrementTimer();
      }, 1000);
    } else if (remainingSeconds === 0 && isTimerRunning) {
      handleAutoFinish();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, remainingSeconds, decrementTimer, handleAutoFinish]);

  const handleStart = async () => {
    if (!user) {
      onOpenAuth?.();
      return;
    }

    if (!selectedTaskId) {
      addToast('Please select a task to focus on', 'info');
      return;
    }

    setLoading(true);
    try {
      const session = await api.startFocusSession({
        task_id: selectedTaskId,
        duration_minutes: selectedDuration,
        auto_complete_task: autoCompleteTask,
      });
      setActiveSession(session);
      setTotalSeconds(selectedDuration * 60);
      setRemainingSeconds(selectedDuration * 60);
      setIsTimerRunning(true);
      addToast(`Focus session started (${selectedDuration}m)`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Could not start focus session', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      const updated = await api.pauseFocusSession(activeSession.id);
      setActiveSession(updated);
      setIsTimerRunning(false);
      addToast('Focus session paused', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to pause session', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResume = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      const updated = await api.resumeFocusSession(activeSession.id);
      setActiveSession(updated);
      setIsTimerRunning(true);
      addToast('Focus session resumed', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to resume session', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      const elapsed = Math.max(0, totalSeconds - remainingSeconds);
      const completed = await api.completeFocusSession(activeSession.id, {
        actual_focus_seconds: elapsed,
        notes: sessionNotes || undefined,
      });
      triggerConfetti();
      setActiveSession(null);
      addToast(
        completed.auto_complete_task
          ? 'Session completed and task marked as done!'
          : 'Session completed successfully!',
        'success'
      );
      onSessionFinished?.();
    } catch (err: any) {
      addToast(err.message || 'Failed to complete session', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!activeSession) {
      setRemainingSeconds(selectedDuration * 60);
      setIsTimerRunning(false);
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this focus sprint?')) return;

    setLoading(true);
    try {
      await api.cancelFocusSession(activeSession.id);
      setActiveSession(null);
      setRemainingSeconds(selectedDuration * 60);
      setIsTimerRunning(false);
      addToast('Session cancelled', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to cancel session', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;
  const currentTask = tasks.find((t) => t.id === (activeSession ? activeSession.task_id : selectedTaskId));
  const availableTasks = tasks.filter((t) => t.status !== 'completed' && !t.is_deleted);

  return (
    <div
      className={`relative w-full flex flex-col items-center justify-center transition-all duration-500 ${
        isZenMode
          ? 'fixed inset-0 z-50 bg-dark-bg text-dark-text p-6 backdrop-glass flex items-center justify-center'
          : 'max-w-xl mx-auto py-8 px-4'
      }`}
    >
      <button
        onClick={() => setZenMode(!isZenMode)}
        title={isZenMode ? 'Exit Zen Mode' : 'Enter Zen Fullscreen Mode'}
        className="absolute top-4 right-4 p-2.5 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text transition-all hover:scale-105"
      >
        {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-light-fill dark:bg-dark-fill text-light-textSecondary dark:text-dark-textSecondary text-[11px] font-bold tracking-badge uppercase mb-6 border border-light-border dark:border-dark-border">
        <Flame className="w-3.5 h-3.5 text-light-text dark:text-dark-text" />
        <span>Focus Mode</span>
      </div>

      {!activeSession ? (
        <div className="w-full max-w-sm mb-6">
          <label className="block text-center text-[10px] font-bold tracking-badge uppercase text-light-textSecondary dark:text-dark-textSecondary mb-2">
            Target Task
          </label>
          <div className="relative">
            <select
              value={selectedTaskId || ''}
              onChange={(e) => setSelectedTaskId(e.target.value || null)}
              className="w-full appearance-none px-4 py-2.5 rounded-2xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-sm font-medium focus:outline-none focus:border-light-text dark:focus:border-dark-text text-light-text dark:text-dark-text pr-10 truncate transition-colors"
            >
              <option value="">-- Choose a task to focus on --</option>
              {availableTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.priority.toUpperCase()} · ~{t.estimated_minutes}m)
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-light-textSecondary dark:text-dark-textSecondary pointer-events-none" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1 mb-6 text-center max-w-md">
          <span className="text-[10px] font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary">
            Currently Focusing On
          </span>
          <h3 className="text-base sm:text-lg font-bold text-light-text dark:text-dark-text line-clamp-1">
            {currentTask?.title || 'Active Sprint Task'}
          </h3>
          {currentTask?.priority && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-light-fill dark:bg-dark-fill text-light-textSecondary dark:text-dark-textSecondary border border-light-border dark:border-dark-border">
              {currentTask.priority}
            </span>
          )}
        </div>
      )}

      <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            className="stroke-light-border dark:stroke-dark-border"
            strokeWidth="3.5"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            className="stroke-light-text dark:stroke-dark-text transition-all duration-1000 ease-linear"
            strokeWidth="4"
            strokeDasharray={264}
            strokeDashoffset={264 - (264 * progressPercent) / 100}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
          <span className="tabular-nums font-black text-5xl sm:text-6xl tracking-tight text-light-text dark:text-dark-text">
            {formatTime(remainingSeconds)}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-badge text-light-textSecondary dark:text-dark-textSecondary mt-2">
            {isTimerRunning ? 'In Progress' : activeSession ? 'Paused' : 'Ready'}
          </span>
        </div>
      </div>

      {!activeSession && (
        <div className="flex items-center gap-2 my-4 bg-light-surface dark:bg-dark-surface p-1 rounded-full border border-light-border dark:border-dark-border">
          {[15, 25, 45, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => {
                setSelectedDuration(mins);
                setTotalSeconds(mins * 60);
                setRemainingSeconds(mins * 60);
              }}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
                selectedDuration === mins
                  ? 'bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg shadow-sm'
                  : 'text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-4">
        {!activeSession ? (
          <button
            onClick={handleStart}
            disabled={loading}
            className="h-13 px-8 rounded-full bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg font-bold tracking-brand text-xs uppercase flex items-center gap-3 hover:opacity-90 active:scale-95 transition-all shadow-xl disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current stroke-none" />
            <span>Start Focus</span>
          </button>
        ) : (
          <>
            {isTimerRunning ? (
              <button
                onClick={handlePause}
                disabled={loading}
                className="h-12 px-6 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text dark:text-dark-text font-bold tracking-brand text-xs uppercase flex items-center gap-2 hover:bg-light-fill dark:hover:bg-dark-fill active:scale-95 transition-all"
              >
                <Pause className="w-4 h-4 fill-current stroke-none" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleResume}
                disabled={loading}
                className="h-12 px-6 rounded-full bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg font-bold tracking-brand text-xs uppercase flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
              >
                <Play className="w-4 h-4 fill-current stroke-none" />
                <span>Resume</span>
              </button>
            )}

            <button
              onClick={handleComplete}
              disabled={loading}
              className="h-12 px-6 rounded-full bg-light-text text-light-bg dark:bg-dark-text dark:text-dark-bg font-bold tracking-brand text-xs uppercase flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Complete</span>
            </button>

            <button
              onClick={handleCancel}
              disabled={loading}
              title="Cancel Session"
              className="w-12 h-12 rounded-full bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text hover:bg-light-fill dark:hover:bg-dark-fill flex items-center justify-center active:scale-95 transition-all"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </>
        )}
      </div>

      {!isZenMode && (
        <div className="mt-8 flex flex-col items-center gap-3 text-xs text-light-textSecondary dark:text-dark-textSecondary">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoCompleteTask}
              onChange={(e) => setAutoCompleteTask(e.target.checked)}
              className="w-4 h-4 rounded border-light-border dark:border-dark-border accent-black dark:accent-white cursor-pointer"
            />
            <span>Auto-complete task when session finishes</span>
          </label>

          {activeSession && (
            <div className="w-full max-w-sm mt-2">
              <button
                type="button"
                onClick={() => setIsNotesOpen(!isNotesOpen)}
                className="text-[11px] font-bold tracking-badge uppercase text-light-textSecondary dark:text-dark-textSecondary hover:text-light-text dark:hover:text-dark-text flex items-center gap-1 mx-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isNotesOpen ? 'Hide Sprint Notes' : '+ Add Sprint Notes'}</span>
              </button>

              {isNotesOpen && (
                <textarea
                  placeholder="Record insights or accomplishments from this sprint..."
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  rows={2}
                  className="w-full mt-2 p-3 rounded-2xl bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border text-xs focus:outline-none focus:border-light-text dark:focus:border-dark-text text-light-text dark:text-dark-text"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
