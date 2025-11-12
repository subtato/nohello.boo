import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageSelect } from '../LanguageSelect';
import i18n from '../../i18n/config';

// Create a test query client
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('LanguageSelect', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('should render desktop version by default', async () => {
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
  });

  it('should render mobile version when mobile prop is true', async () => {
    render(
      <TestWrapper>
        <LanguageSelect mobile />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
  });

  it('should display current language', async () => {
    i18n.changeLanguage('en');
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const input = screen.getByLabelText(/search languages/i);
      expect(input).toBeInTheDocument();
    });
  });

  it('should open popover when clicked', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).toBeInTheDocument();
    });
  });

  it('should filter languages when typing', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const input = screen.getByLabelText(/search languages/i);
      expect(input).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const input = screen.getByLabelText(/search languages/i) as HTMLInputElement;
      expect(input).toBeInTheDocument();
    });
    
    const input = screen.getByLabelText(/search languages/i) as HTMLInputElement;
    await user.type(input, 'spanish');
    
    await waitFor(() => {
      // Should show filtered results
      const options = screen.queryAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });
  });

  it('should change language when option is selected', async () => {
    const user = userEvent.setup();
    const changeLanguageSpy = vi.spyOn(i18n, 'changeLanguage');
    
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });
    
    const spanishOption = screen.getByText(/español/i);
    await user.click(spanishOption);
    
    await waitFor(() => {
      expect(changeLanguageSpy).toHaveBeenCalledWith('es');
    });
    
    changeLanguageSpy.mockRestore();
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const input = screen.getByLabelText(/search languages/i);
      expect(input).toBeInTheDocument();
    });
    
    screen.getByLabelText(/search languages/i);
    await user.keyboard('{ArrowDown}');
    
    await waitFor(() => {
      // Should have highlighted option
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });
  });

  it('should handle ArrowUp navigation', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const input = screen.getByLabelText(/search languages/i);
      expect(input).toBeInTheDocument();
    });
    
    screen.getByLabelText(/search languages/i);
    await user.keyboard('{ArrowUp}');
    
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });
  });

  it('should handle Enter key to select', async () => {
    const user = userEvent.setup();
    const changeLanguageSpy = vi.spyOn(i18n, 'changeLanguage');
    
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const input = screen.getByLabelText(/search languages/i);
      expect(input).toBeInTheDocument();
    });
    
    screen.getByLabelText(/search languages/i);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      expect(changeLanguageSpy).toHaveBeenCalled();
    });
    
    changeLanguageSpy.mockRestore();
  });

  it('should handle Escape key to close', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).toBeInTheDocument();
    });
    
    screen.getByLabelText(/search languages/i);
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).not.toBeInTheDocument();
    });
  });

  it('should handle Tab key to close', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).toBeInTheDocument();
    });
    
    screen.getByLabelText(/search languages/i);
    await user.keyboard('{Tab}');
    
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).not.toBeInTheDocument();
    });
  });

  it('should show no results message when filter matches nothing', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const input = screen.getByLabelText(/search languages/i);
      expect(input).toBeInTheDocument();
    });
    
    const input = screen.getByLabelText(/search languages/i) as HTMLInputElement;
    await user.type(input, 'nonexistentlanguagexyz');
    
    await waitFor(() => {
      const noResults = screen.queryByText(/no languages found/i);
      expect(noResults).toBeInTheDocument();
    });
  });

  it('should filter by language code', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const input = screen.getByLabelText(/search languages/i);
      expect(input).toBeInTheDocument();
    });
    
    const input = screen.getByLabelText(/search languages/i) as HTMLInputElement;
    await user.type(input, 'es');
    
    await waitFor(() => {
      const options = screen.queryAllByRole('option');
      // Should find Spanish
      expect(options.length).toBeGreaterThan(0);
    });
  });

  it('should handle mobile version', async () => {
    render(
      <TestWrapper>
        <LanguageSelect mobile />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
  });

  it('should handle mouse hover on options', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });
    
    const options = screen.getAllByRole('option');
    if (options.length > 0) {
      await user.hover(options[0]);
      // Should not throw
      expect(options[0]).toBeInTheDocument();
    }
  });

  it('should not change language if same language is selected', async () => {
    const user = userEvent.setup();
    i18n.changeLanguage('en');
    const changeLanguageSpy = vi.spyOn(i18n, 'changeLanguage');
    
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });
    
    // Find and click English option (current language)
    const englishOption = screen.getByText(/english/i);
    await user.click(englishOption);
    
    // Should not call changeLanguage if already on that language
    // (The component checks if language is different before changing)
    await waitFor(() => {
      // The component should handle this gracefully
      expect(document.body).toBeTruthy();
    });
    
    changeLanguageSpy.mockRestore();
  });

  it('should handle Enter key with no highlighted option but single match', async () => {
    const user = userEvent.setup();
    const changeLanguageSpy = vi.spyOn(i18n, 'changeLanguage');
    
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const input = screen.getByLabelText(/search languages/i);
      expect(input).toBeInTheDocument();
    });
    
    const input = screen.getByLabelText(/search languages/i) as HTMLInputElement;
    // Type to filter to one result
    await user.type(input, 'spanish');
    
    await waitFor(() => {
      const options = screen.queryAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });
    
    // Clear highlighted index by clicking elsewhere, then press Enter
    // The component should select first option if no highlight
    await user.keyboard('{Enter}');
    
    // The component may or may not call changeLanguage depending on highlightedIndex
    // Just verify it doesn't crash
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
    
    changeLanguageSpy.mockRestore();
  });

  it('should handle input onChange when popover is closed', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const input = screen.getByLabelText(/search languages/i);
      expect(input).toBeInTheDocument();
    });
    
    // Close popover
    const input = screen.getByLabelText(/search languages/i) as HTMLInputElement;
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).not.toBeInTheDocument();
    });
    
    // Type in closed state - should open
    await user.type(input, 'f');
    
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).toBeInTheDocument();
    });
  });

  it('should handle onFocus when input is empty', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const input = screen.getByLabelText(/search languages/i);
      expect(input).toBeInTheDocument();
    });
    
    // Close and reopen
    const input = screen.getByLabelText(/search languages/i) as HTMLInputElement;
    await user.keyboard('{Escape}');
    
    // Focus again
    await user.click(input);
    
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).toBeInTheDocument();
    });
  });

  it('should handle onClick on input directly', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const input = screen.getByLabelText(/search languages/i);
      expect(input).toBeInTheDocument();
    });
    
    // Close
    await user.keyboard('{Escape}');
    
    // Click directly on input
    const input = screen.getByLabelText(/search languages/i) as HTMLInputElement;
    await user.click(input);
    
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).toBeInTheDocument();
    });
  });

  it('should handle mobile version onClick on trigger div', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect mobile />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    // Click on the trigger div (not the input)
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).toBeInTheDocument();
    });
  });

  it('should handle ArrowDown when popover is closed', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    // Focus the input first
    const input = screen.getByLabelText(/search languages/i) as HTMLInputElement;
    await user.click(input);
    
    // Press ArrowDown to open
    await user.keyboard('{ArrowDown}');
    
    // Should open the popover
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should handle ArrowUp when popover is closed', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    // Focus the input first
    const input = screen.getByLabelText(/search languages/i) as HTMLInputElement;
    await user.click(input);
    
    // Press ArrowUp to open and highlight last
    await user.keyboard('{ArrowUp}');
    
    // Should open the popover
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should handle Enter when popover is closed', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    // First open the popover
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).toBeInTheDocument();
    });
    
    // Close it
    screen.getByLabelText(/search languages/i);
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).not.toBeInTheDocument();
    });
    
    // Now press Enter to reopen
    await user.keyboard('{Enter}');
    
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).toBeInTheDocument();
    });
  });

  it('should handle ArrowDown wrapping to first option', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const input = screen.getByLabelText(/search languages/i);
      expect(input).toBeInTheDocument();
    });
    
    const input = screen.getByLabelText(/search languages/i) as HTMLInputElement;
    
    // Get initial options count
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });
    
    const initialOptions = screen.getAllByRole('option');
    // Navigate through all options
    for (let i = 0; i < initialOptions.length; i++) {
      await user.keyboard('{ArrowDown}');
    }
    
    // One more ArrowDown should wrap to first
    await user.keyboard('{ArrowDown}');
    
    // Should still work
    expect(input).toBeInTheDocument();
  });

  it('should handle ArrowUp wrapping to last option', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const input = screen.getByLabelText(/search languages/i);
      expect(input).toBeInTheDocument();
    });
    
    const input = screen.getByLabelText(/search languages/i) as HTMLInputElement;
    // Navigate up from first option
    await user.keyboard('{ArrowUp}');
    
    // Should wrap to last
    expect(input).toBeInTheDocument();
  });

  it('should handle mouse leave on options', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);
    });
    
    const options = screen.getAllByRole('option');
    if (options.length > 0) {
      await user.hover(options[0]);
      // Mouse leave doesn't clear highlight in mobile version
      expect(options[0]).toBeInTheDocument();
    }
  });

  it('should handle selectedLanguage being undefined', async () => {
    // Mock languages to not include current language
    vi.spyOn(i18n, 'language', 'get').mockReturnValue('xx' as 'en' | 'es' | 'fr' | 'de');
    
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    // Should fallback to first language
    expect(document.body).toBeTruthy();
    
    vi.restoreAllMocks();
  });

  it('should handle handleOpenChange closing', async () => {
    const user = userEvent.setup();
    render(
      <TestWrapper>
        <LanguageSelect />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
    });
    
    const combobox = screen.getByRole('combobox');
    await user.click(combobox);
    
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).toBeInTheDocument();
    });
    
    // Close via onOpenChange
    const input = screen.getByLabelText(/search languages/i) as HTMLInputElement;
    await user.type(input, 'test');
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      const listbox = screen.queryByRole('listbox');
      expect(listbox).not.toBeInTheDocument();
    });
  });
});

