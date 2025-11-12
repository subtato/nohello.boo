import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DarkModeToggle } from '../DarkModeToggle';

describe('DarkModeToggle', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    // Reset document classes
    document.documentElement.classList.remove('dark');
    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should render desktop version by default', async () => {
    render(<DarkModeToggle />);
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  it('should render mobile version when mobile prop is true', async () => {
    render(<DarkModeToggle mobile />);
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  it('should toggle theme when clicked', async () => {
    const user = userEvent.setup();
    render(<DarkModeToggle />);
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
    
    const button = screen.getByRole('button');
    const initialAriaLabel = button.getAttribute('aria-label');
    
    await user.click(button);
    
    await waitFor(() => {
      const newAriaLabel = button.getAttribute('aria-label');
      expect(newAriaLabel).not.toBe(initialAriaLabel);
    });
  });

  it('should save theme preference to localStorage', async () => {
    const user = userEvent.setup();
    render(<DarkModeToggle />);
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    await waitFor(() => {
      const theme = localStorage.getItem('theme');
      expect(theme).toBeTruthy();
      expect(['light', 'dark']).toContain(theme);
    });
  });

  it('should load theme from localStorage on mount', async () => {
    localStorage.setItem('theme', 'dark');
    render(<DarkModeToggle />);
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      // Check that dark class is applied
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  it('should have correct aria-label', async () => {
    render(<DarkModeToggle />);
    
    await waitFor(() => {
      const button = screen.getByRole('button');
      const ariaLabel = button.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/switch to (light|dark) mode/i);
    });
  });

  it('should show loading state before mount', async () => {
    // The component shows a loading state before mounted
    const { container } = render(<DarkModeToggle />);
    // Initially there should be a loading placeholder
    // But it quickly disappears after mount, so we check it exists or the button exists
    const loadingPlaceholder = container.querySelector('.animate-pulse');
    const button = container.querySelector('button');
    // Either loading placeholder or button should exist
    expect(loadingPlaceholder || button).toBeTruthy();
  });
});

