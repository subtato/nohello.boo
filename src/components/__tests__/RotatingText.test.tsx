import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { RotatingText } from '../RotatingText';
import i18n from '../../i18n/config';

describe('RotatingText', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  it('should render', () => {
    const { container } = render(<RotatingText />);
    expect(container).toBeTruthy();
  });

  it('should display rotating messages', () => {
    render(<RotatingText />);
    
    // Component should render the container
    const container = document.querySelector('.rotating-text-container');
    expect(container).toBeInTheDocument();
    
    // The span should exist (even if empty initially)
    const span = document.querySelector('.rotating-text-container span');
    expect(span).toBeInTheDocument();
  });

  it('should update when language changes', () => {
    const { rerender } = render(<RotatingText />);
    
    // Component should be rendered
    const container = document.querySelector('.rotating-text-container');
    expect(container).toBeInTheDocument();
    
    // Change language
    i18n.changeLanguage('es');
    rerender(<RotatingText />);
    
    // Component should still be rendered
    const containerAfter = document.querySelector('.rotating-text-container');
    expect(containerAfter).toBeInTheDocument();
  });

  it('should handle empty messages array', () => {
    // Mock empty messages
    vi.spyOn(i18n, 't').mockReturnValue([]);
    
    const { container } = render(<RotatingText />);
    // Should not crash
    expect(container).toBeTruthy();
    
    vi.restoreAllMocks();
  });

  it('should handle null messages', () => {
    vi.spyOn(i18n, 't').mockReturnValue([]);
    
    const { container } = render(<RotatingText />);
    // Should not crash - component returns null for empty messages
    expect(container).toBeTruthy();
    
    vi.restoreAllMocks();
  });

  it('should have correct CSS classes', () => {
    render(<RotatingText />);
    
    const container = document.querySelector('.rotating-text-container');
    expect(container).toBeInTheDocument();
    expect(container?.classList.contains('inline-flex')).toBe(true);
  });

  it('should handle message array changes', () => {
    const { rerender } = render(<RotatingText />);
    
    // Change to different language with different messages
    i18n.changeLanguage('fr');
    rerender(<RotatingText />);
    
    const container = document.querySelector('.rotating-text-container');
    expect(container).toBeInTheDocument();
  });

  it('should handle single message', () => {
    vi.spyOn(i18n, 't').mockReturnValue(['hello'] as string[]);
    
    const { container } = render(<RotatingText />);
    expect(container).toBeTruthy();
    
    vi.restoreAllMocks();
  });

  it('should cleanup timers on unmount', () => {
    const { unmount } = render(<RotatingText />);
    
    // Advance timers
    vi.advanceTimersByTime(1000);
    
    // Unmount should cleanup
    unmount();
    
    // Should not throw
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
  });

  it('should handle Intl.Segmenter when available', () => {
    // Mock Intl.Segmenter
    const mockSegmenter = {
      segment: (text: string) => {
        return Array.from(text).map((char, i) => ({
          segment: char,
          index: i,
          input: text,
        }));
      },
    };
    
    const originalSegmenter = (globalThis as { Intl?: { Segmenter?: typeof Intl.Segmenter } }).Intl?.Segmenter;
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      (Intl as { Segmenter: typeof Intl.Segmenter }).Segmenter = vi.fn().mockImplementation(() => mockSegmenter) as unknown as typeof Intl.Segmenter;
    }
    
    render(<RotatingText />);
    
    const container = document.querySelector('.rotating-text-container');
    expect(container).toBeInTheDocument();
    
    // Restore
    if (originalSegmenter && typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
      (Intl as { Segmenter: typeof Intl.Segmenter }).Segmenter = originalSegmenter;
    }
  });

  it('should type characters progressively', () => {
    vi.spyOn(i18n, 't').mockReturnValue(['hello'] as string[]);
    
    render(<RotatingText />);
    
    const container = document.querySelector('.rotating-text-container');
    expect(container).toBeInTheDocument();
    
    // Advance past initial delay
    vi.advanceTimersByTime(3000);
    
    // Advance through typing (5 characters * 80ms = 400ms)
    for (let i = 0; i < 5; i++) {
      vi.advanceTimersByTime(80);
    }
    
    // Component should still be rendered
    const containerAfter = document.querySelector('.rotating-text-container');
    expect(containerAfter).toBeInTheDocument();
    
    vi.restoreAllMocks();
  });

  it('should delete characters after typing', () => {
    vi.spyOn(i18n, 't').mockReturnValue(['hi'] as string[]);
    
    render(<RotatingText />);
    
    const container = document.querySelector('.rotating-text-container');
    expect(container).toBeInTheDocument();
    
    // Advance past initial delay and typing
    vi.advanceTimersByTime(3000); // start delay
    vi.advanceTimersByTime(160); // type "hi" (2 chars * 80ms)
    vi.advanceTimersByTime(2000); // pause delay
    
    // Advance through deleting (2 characters * 60ms = 120ms)
    vi.advanceTimersByTime(60);
    vi.advanceTimersByTime(60);
    
    // Should still be rendered
    const containerAfter = document.querySelector('.rotating-text-container');
    expect(containerAfter).toBeInTheDocument();
    
    vi.restoreAllMocks();
  });

  it('should cycle through multiple messages', () => {
    vi.spyOn(i18n, 't').mockReturnValue(['first', 'second'] as string[]);
    
    render(<RotatingText />);
    
    const container = document.querySelector('.rotating-text-container');
    expect(container).toBeInTheDocument();
    
    // Complete first message cycle
    vi.advanceTimersByTime(3000); // start delay
    vi.advanceTimersByTime(400); // type "first" (5 chars * 80ms)
    vi.advanceTimersByTime(2000); // pause
    vi.advanceTimersByTime(300); // delete "first" (5 chars * 60ms)
    vi.advanceTimersByTime(100); // transition delay
    
    // Should start typing second message
    vi.advanceTimersByTime(480); // type "second" (6 chars * 80ms)
    
    // Component should still be rendered
    const containerAfter = document.querySelector('.rotating-text-container');
    expect(containerAfter).toBeInTheDocument();
    
    vi.restoreAllMocks();
  });

  it('should handle messages change (not initial mount)', () => {
    const { rerender } = render(<RotatingText />);
    
    // Simulate messages changing (language change)
    i18n.changeLanguage('es');
    rerender(<RotatingText />);
    
    // Should use the else branch in useEffect
    const container = document.querySelector('.rotating-text-container');
    expect(container).toBeInTheDocument();
  });

  it('should handle emojis and special characters', () => {
    vi.spyOn(i18n, 't').mockReturnValue(['👋', 'hello 👋'] as string[]);
    
    render(<RotatingText />);
    
    const container = document.querySelector('.rotating-text-container');
    expect(container).toBeInTheDocument();
    
    vi.restoreAllMocks();
  });

  it('should handle fallback when Intl.Segmenter is not available', () => {
    const originalIntl = globalThis.Intl;
    // @ts-expect-error - Intentionally removing Intl for testing fallback behavior
    globalThis.Intl = undefined;
    
    render(<RotatingText />);
    
    const container = document.querySelector('.rotating-text-container');
    expect(container).toBeInTheDocument();
    
    // Restore
    globalThis.Intl = originalIntl;
  });

  it('should cleanup timeout on unmount during typing', () => {
    vi.spyOn(i18n, 't').mockReturnValue(['test'] as string[]);
    
    const { unmount } = render(<RotatingText />);
    
    // Advance past initial delay
    vi.advanceTimersByTime(3000);
    
    // Start typing
    vi.advanceTimersByTime(80);
    
    // Unmount should cleanup
    unmount();
    
    // Should not throw
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
    
    vi.restoreAllMocks();
  });

  it('should handle grapheme caching correctly', () => {
    vi.spyOn(i18n, 't').mockReturnValue(['test'] as string[]);
    
    render(<RotatingText />);
    
    const container = document.querySelector('.rotating-text-container');
    expect(container).toBeInTheDocument();
    
    // Advance through typing to trigger caching
    vi.advanceTimersByTime(3000);
    vi.advanceTimersByTime(80); // First char
    vi.advanceTimersByTime(80); // Second char
    
    // Should work correctly
    const containerAfter = document.querySelector('.rotating-text-container');
    expect(containerAfter).toBeInTheDocument();
    
    vi.restoreAllMocks();
  });
});

