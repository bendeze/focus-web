import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { soundManager } from '../utils/sound';

export function useKeyboardShortcuts() {
  const { isTimerRunning, toggleTimer, isZenMode, setZenMode, addToast } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in form inputs or editable content
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // 1. Space: Toggle focus sprint timer
      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleTimer();
        if (!isTimerRunning) {
          soundManager.playStart();
        }
      }

      // 2. Z: Toggle Zen mode
      if ((e.key === 'z' || e.key === 'Z') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        const nextZen = !isZenMode;
        setZenMode(nextZen);
        addToast(nextZen ? 'Zen mode activated' : 'Zen mode deactivated', 'info');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTimerRunning, toggleTimer, isZenMode, setZenMode, addToast]);
}
