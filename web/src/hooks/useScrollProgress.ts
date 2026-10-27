import { useState, useEffect, useCallback, type RefObject } from 'react';

export interface ScrollProgress {
  scrollY: number;
  progress: number;
  direction: 'up' | 'down';
}

/**
 * Hook to track overall window scroll progress and velocity smoothly via RAF.
 */
export function useScrollProgress(): ScrollProgress {
  const [scrollState, setScrollState] = useState<ScrollProgress>({
    scrollY: 0,
    progress: 0,
    direction: 'down',
  });

  useEffect(() => {
    let ticking = false;
    let lastScrollY = window.scrollY;

    const updateScroll = () => {
      const currentScrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(Math.max(currentScrollY / docHeight, 0), 1) : 0;
      const direction: 'up' | 'down' = currentScrollY >= lastScrollY ? 'down' : 'up';

      lastScrollY = currentScrollY;

      setScrollState({
        scrollY: currentScrollY,
        progress,
        direction,
      });

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    // initial sync
    updateScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return scrollState;
}

/**
 * Hook to track how far a specific DOM element has traveled through the viewport (0 to 1).
 */
export function useElementScrollProgress<T extends HTMLElement>(ref: RefObject<T | null>): number {
  const [elementProgress, setElementProgress] = useState(0);

  const calculate = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // 0 when top enters bottom of viewport, 1 when bottom leaves top of viewport
    const totalDistance = windowHeight + rect.height;
    const currentPosition = windowHeight - rect.top;
    const rawProgress = currentPosition / totalDistance;

    setElementProgress(Math.min(Math.max(rawProgress, 0), 1));
  }, [ref]);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          calculate();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    calculate();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [calculate]);

  return elementProgress;
}
