import { Moon, Sun } from 'lucide-react';

import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggleTheme}
      className="relative z-[100] inline-flex h-10 w-16 shrink-0 items-center rounded-full border border-stone-200/90 bg-stone-100/90 p-1 shadow-sm transition-colors dark:border-stone-600/60 dark:bg-stone-700/80"
    >
      <span
        className={[
          'absolute top-1 left-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-200 ease-out dark:bg-stone-600',
          isDark ? 'translate-x-6' : 'translate-x-0',
        ].join(' ')}
      >
        {isDark ? <Moon className="h-4 w-4 text-violet-200" strokeWidth={2} /> : <Sun className="h-4 w-4 text-amber-500" strokeWidth={2} />}
      </span>
      <span className="sr-only">{isDark ? 'Dark' : 'Light'} mode</span>
    </button>
  );
}
