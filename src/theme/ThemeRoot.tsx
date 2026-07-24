import { useEffect, useRef, type ReactNode } from 'react';
import { applyHudCssVariables } from './cssVariables';
import { getTheme, subscribeTheme } from './themeStore';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Syncs theme store → data-theme + CSS variables + short transition class.
 * No Three.js / scene logic.
 */
export function ThemeRoot({ children }: { children: ReactNode }) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const apply = (withTransition: boolean) => {
      const { name, tokens } = getTheme();
      const root = document.documentElement;
      root.dataset.theme = name;
      applyHudCssVariables(tokens.hud, tokens.motion, root);

      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (withTransition && !prefersReducedMotion()) {
        root.dataset.themeTransitioning = 'true';
        timerRef.current = window.setTimeout(() => {
          delete root.dataset.themeTransitioning;
          timerRef.current = null;
        }, tokens.motion.normal);
      } else {
        delete root.dataset.themeTransitioning;
      }
    };

    apply(false);
    return subscribeTheme(() => apply(true));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);

  return <>{children}</>;
}
