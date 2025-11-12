import { memo, useEffect, useState } from 'react';

interface DarkModeToggleProps {
  mobile?: boolean;
}

export const DarkModeToggle = memo(function DarkModeToggle({ mobile = false }: DarkModeToggleProps) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDark(shouldBeDark);
    updateTheme(shouldBeDark);
  }, []);

  const updateTheme = (dark: boolean) => {
    const root = document.documentElement;
    // Use requestAnimationFrame to ensure smooth transition
    requestAnimationFrame(() => {
      if (dark) {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    });
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    updateTheme(newIsDark);
  };

  if (!mounted) {
    return mobile ? (
      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    ) : (
      <div className="fixed top-4 left-4 w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  if (mobile) {
    return (
      <button
        onClick={toggleTheme}
        className="w-10 h-10 rounded-full shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 flex items-center justify-center text-lg"
        style={{ background: 'linear-gradient(to bottom right, var(--color-bg-secondary), var(--color-bg-tertiary))', borderColor: 'var(--color-border)', borderWidth: '1px', borderStyle: 'solid' }}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        type="button"
      >
        <span className="transition-all duration-500 transform">
          {isDark ? '☀️' : '🌙'}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 left-4 z-50 w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center text-xl backdrop-blur-sm"
      style={{ background: 'linear-gradient(to bottom right, var(--color-bg-secondary), var(--color-bg-tertiary))', borderColor: 'var(--color-border)', borderWidth: '1px', borderStyle: 'solid' }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      type="button"
    >
      <span className="transition-all duration-500 transform">
        {isDark ? '☀️' : '🌙'}
      </span>
    </button>
  );
});

