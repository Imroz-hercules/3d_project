import { setTheme } from './themeStore';
import { useThemeName } from './useTheme';
import type { ThemeName } from './tokens';

const OPTIONS: { name: ThemeName; label: string; icon: string }[] = [
  { name: 'sentinel-night', label: 'Night', icon: '☾' },
  { name: 'sentinel-day', label: 'Day', icon: '☀' },
];

/** Segmented Night | Day control for the global toolbar. */
export function ThemeToggle() {
  const active = useThemeName();

  return (
    <div className="stwin-theme-toggle" role="group" aria-label="Theme">
      {OPTIONS.map((opt) => {
        const isActive = active === opt.name;
        return (
          <button
            key={opt.name}
            type="button"
            className={`stwin-theme-toggle__btn${isActive ? ' is-active' : ''}`}
            aria-pressed={isActive}
            onClick={() => setTheme(opt.name)}
          >
            <span aria-hidden="true">{opt.icon}</span>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
