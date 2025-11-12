import { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { useQuery } from '@tanstack/react-query';
import { fetchLanguages, type Language } from '../api/languages';
import i18n from '../i18n/config';

interface LanguageSelectProps {
  mobile?: boolean;
}

export const LanguageSelect = memo(function LanguageSelect({ mobile = false }: LanguageSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLButtonElement[]>([]);
  const filteredLanguagesRef = useRef<Language[]>([]);
  const listboxId = useMemo(() => `language-listbox-${mobile ? 'mobile' : 'desktop'}`, [mobile]);
  const inputId = useMemo(() => `language-input-${mobile ? 'mobile' : 'desktop'}`, [mobile]);

  // Subscribe to language changes only, not all i18n updates
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  // Fetch languages using TanStack Query
  const { data: languages = [], isLoading } = useQuery<Language[]>({
    queryKey: ['languages'],
    queryFn: fetchLanguages,
  });

  // Find current selected language - only updates when language actually changes
  const selectedLanguage = useMemo(
    () => languages.find((lang) => lang.code === currentLanguage) || languages[0],
    [languages, currentLanguage]
  );

  // Filter languages based on search query
  const filteredLanguages = useMemo(() => {
    if (!query) return languages;
    return languages.filter((lang) =>
      lang.name.toLowerCase().includes(query.toLowerCase()) ||
      lang.code.toLowerCase().includes(query.toLowerCase())
    );
  }, [languages, query]);

  // Update ref for use in callbacks without causing re-renders
  filteredLanguagesRef.current = filteredLanguages;

  // Auto-highlight first option when filtered languages change (only when open)
  useEffect(() => {
    if (!open) return;
    
    if (filteredLanguages.length > 0) {
      setHighlightedIndex(0);
      // Use requestAnimationFrame instead of setTimeout for better performance
      requestAnimationFrame(() => {
        optionsRef.current[0]?.scrollIntoView({ block: 'nearest' });
      });
    } else {
      setHighlightedIndex(-1);
    }
  }, [filteredLanguages, open]); // Depend on filteredLanguages array itself, not just length

  // Get current highlighted option name for screen reader announcements
  const highlightedOptionName = useMemo(() => {
    if (highlightedIndex >= 0 && highlightedIndex < filteredLanguages.length) {
      return filteredLanguages[highlightedIndex].name;
    }
    return null;
  }, [highlightedIndex, filteredLanguages]);

  // Handle language change - batch state updates
  const handleChange = useCallback(
    (language: Language) => {
      // Only change language if it's actually different
      if (i18n.language !== language.code) {
        i18n.changeLanguage(language.code);
      }
      // Batch state updates
      setQuery('');
      setOpen(false);
    },
    [i18n]
  );

  // Handle open change
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset query and highlighted index when closing without selection
      setQuery('');
      setHighlightedIndex(-1);
    } else {
      // Focus input when opening
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        // Highlight first option when opening (if there are options)
        const options = filteredLanguagesRef.current;
        if (options.length > 0) {
          setHighlightedIndex(0);
          requestAnimationFrame(() => {
            optionsRef.current[0]?.scrollIntoView({ block: 'nearest' });
          });
        } else {
          setHighlightedIndex(-1);
        }
      });
    }
  }, []); // No dependencies - use ref instead

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const options = filteredLanguagesRef.current;
      const maxIndex = options.length - 1;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          // Open popover if closed
          if (!open) {
            setOpen(true);
            // Highlight first option when opening with arrow down
            requestAnimationFrame(() => {
              if (options.length > 0) {
                setHighlightedIndex(0);
                requestAnimationFrame(() => {
                  optionsRef.current[0]?.scrollIntoView({ block: 'nearest' });
                });
              }
            });
            return;
          }
          // Navigate down when open - batch state update
          setHighlightedIndex((prev) => {
            const next = prev < maxIndex ? prev + 1 : 0;
            requestAnimationFrame(() => {
              optionsRef.current[next]?.scrollIntoView({ block: 'nearest' });
            });
            return next;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          // Open popover if closed
          if (!open) {
            setOpen(true);
            // Highlight last option when opening with arrow up
            requestAnimationFrame(() => {
              if (options.length > 0) {
                const lastIndex = options.length - 1;
                setHighlightedIndex(lastIndex);
                requestAnimationFrame(() => {
                  optionsRef.current[lastIndex]?.scrollIntoView({ block: 'nearest' });
                });
              }
            });
            return;
          }
          // Navigate up when open - batch state update
          setHighlightedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : maxIndex;
            requestAnimationFrame(() => {
              optionsRef.current[next]?.scrollIntoView({ block: 'nearest' });
            });
            return next;
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (!open) {
            // Open popover if closed
            setOpen(true);
            return;
          }
          // Select highlighted option when open
          if (highlightedIndex >= 0 && highlightedIndex < options.length) {
            handleChange(options[highlightedIndex]);
          } else if (options.length === 1) {
            // If only one option matches, select it
            handleChange(options[0]);
          } else if (options.length > 0) {
            // If no option highlighted but options available, select first
            handleChange(options[0]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (open) {
            setOpen(false);
          }
          break;
        case 'Tab':
          // Allow Tab to work normally (close popover if open)
          if (open) {
            setOpen(false);
          }
          break;
      }
    },
    [open, highlightedIndex, handleChange] // Removed filteredLanguages dependency
  );

  // Get display value for the input
  // When popover is open: show only query (even if empty)
  // When popover is closed: show selected language
  const inputValue = useMemo(() => {
    if (open) {
      // When open, always show query (even if empty) - don't prefill with selected value
      return query;
    }
    // When closed, show selected language
    return selectedLanguage ? `${selectedLanguage.flag} ${selectedLanguage.name}` : '';
  }, [query, selectedLanguage, open]);

  if (isLoading) {
    return mobile ? (
      <div className="animate-pulse rounded" style={{ backgroundColor: 'var(--color-bg-overlay)', minWidth: '100px', height: '28px' }} />
    ) : (
      <div className="px-3 py-2 rounded-xl backdrop-blur-sm animate-pulse" style={{ borderColor: 'var(--color-border)', borderWidth: '1px', borderStyle: 'solid', backgroundColor: 'var(--color-bg-overlay)', minWidth: '140px', height: '36px' }} />
    );
  }

  if (mobile) {
    return (
      <div style={{ minWidth: '100px' }}>
        <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <Popover.Trigger asChild>
          <div
            className="w-full flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-sm transition-colors duration-[500ms] cursor-pointer"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              minHeight: '28px',
            }}
            onClick={(e) => {
              // Don't open if clicking directly on input (handled by input's onClick)
              if (e.target === inputRef.current) {
                return;
              }
              setOpen(true);
              requestAnimationFrame(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
              });
            }}
            role="combobox"
            aria-label="Select language"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={listboxId}
          >
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={inputValue}
              onChange={(e) => {
                const newValue = e.target.value;
                setQuery(newValue);
                if (!open) {
                  setOpen(true);
                }
                // Highlight will be updated by useEffect when filteredLanguages changes
              }}
              onKeyDown={handleKeyDown}
              onFocus={(e) => {
                // Only open and clear if not already open and user clicked directly on input
                if (!open) {
                  setOpen(true);
                  // Only clear if input is empty or showing selected language
                  if (!query || query === inputValue) {
                    setQuery('');
                  }
                }
                // Ensure input is selectable
                e.currentTarget.select();
              }}
              onClick={(e) => {
                // Prevent event from bubbling to parent div
                e.stopPropagation();
                if (!open) {
                  setOpen(true);
                  // Select all text when clicking
                  e.currentTarget.select();
                }
              }}
              className="flex-1 bg-transparent border-0 outline-none text-sm w-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              style={{ 
                color: 'var(--color-text-primary)',
                cursor: open ? 'text' : 'pointer'
              }}
              aria-label="Search languages"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={
                highlightedIndex >= 0 && highlightedIndex < filteredLanguages.length
                  ? `${listboxId}-option-${highlightedIndex}`
                  : undefined
              }
              aria-expanded={open}
              spellCheck={false}
              autoComplete="off"
              readOnly={!open}
            />
            <svg
              className="h-3.5 w-3.5 flex-shrink-0 ml-1.5 pointer-events-none"
              style={{ color: 'var(--color-text-secondary)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              className="z-50 w-[var(--radix-popover-trigger-width)] max-h-60 overflow-auto rounded-lg shadow-xl border"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
              }}
              sideOffset={4}
              align="start"
            >
              <div
                id={listboxId}
                role="listbox"
                aria-label="Language options"
                aria-live="polite"
                aria-atomic="false"
              >
                {filteredLanguages.length === 0 && query !== '' ? (
                  <div
                    className="px-3 py-2 text-sm"
                    style={{ color: 'var(--color-text-tertiary)' }}
                    role="option"
                    aria-disabled="true"
                  >
                    No languages found.
                  </div>
                ) : (
                  filteredLanguages.map((language, index) => {
                    const isHighlighted = highlightedIndex === index;
                    const isSelected = selectedLanguage?.code === language.code;
                    const optionId = `${listboxId}-option-${index}`;
                    return (
                      <button
                        key={language.code}
                        id={optionId}
                        ref={(el) => {
                          if (el) optionsRef.current[index] = el;
                        }}
                        type="button"
                        onClick={() => handleChange(language)}
                        className="w-full text-left px-3 py-2.5 text-sm cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                        style={{
                          backgroundColor: isSelected
                            ? 'var(--color-blue)'
                            : isHighlighted
                            ? 'var(--color-bg-tertiary)'
                            : 'transparent',
                          color: isSelected ? 'white' : 'var(--color-text-primary)',
                        }}
                        role="option"
                        aria-selected={isSelected}
                        tabIndex={-1}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onMouseLeave={() => {
                          // Don't clear highlight on mouse leave if keyboard navigation is active
                          // Only clear if no keyboard interaction has happened
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <span aria-hidden="true" className="text-base">{language.flag}</span>
                          <span className="font-medium">{language.name}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              {/* Screen reader announcement for filtered results and navigation */}
              <div
                className="sr-only"
                aria-live="polite"
                aria-atomic="true"
              >
                {open && (
                  <>
                    {query && filteredLanguages.length > 0
                      ? `${filteredLanguages.length} language${filteredLanguages.length !== 1 ? 's' : ''} found${highlightedOptionName ? `, ${highlightedOptionName} is highlighted` : ''}`
                      : !query && filteredLanguages.length > 0
                      ? `${filteredLanguages.length} language${filteredLanguages.length !== 1 ? 's' : ''} available${highlightedOptionName ? `, ${highlightedOptionName} is highlighted` : ''}`
                      : query && filteredLanguages.length === 0
                      ? 'No languages found'
                      : ''}
                  </>
                )}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50" style={{ minWidth: '140px' }}>
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <Popover.Trigger asChild>
          <div
            className="w-full flex items-center justify-between rounded-lg border px-3 py-2 text-sm shadow-sm transition-all duration-[500ms] hover:shadow-md cursor-pointer"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)',
              minHeight: '36px',
            }}
            onClick={(e) => {
              // Don't open if clicking directly on input (handled by input's onClick)
              if (e.target === inputRef.current) {
                return;
              }
              setOpen(true);
              requestAnimationFrame(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
              });
            }}
            role="combobox"
            aria-label="Select language"
            aria-expanded={open}
            aria-haspopup="listbox"
            aria-controls={listboxId}
          >
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={inputValue}
              onChange={(e) => {
                const newValue = e.target.value;
                setQuery(newValue);
                if (!open) {
                  setOpen(true);
                }
                // Highlight will be updated by useEffect when filteredLanguages changes
              }}
              onKeyDown={handleKeyDown}
              onFocus={(e) => {
                // Only open and clear if not already open and user clicked directly on input
                if (!open) {
                  setOpen(true);
                  // Only clear if input is empty or showing selected language
                  if (!query || query === inputValue) {
                    setQuery('');
                  }
                }
                // Ensure input is selectable
                e.currentTarget.select();
              }}
              onClick={(e) => {
                // Prevent event from bubbling to parent div
                e.stopPropagation();
                if (!open) {
                  setOpen(true);
                  // Select all text when clicking
                  e.currentTarget.select();
                }
              }}
              className="flex-1 bg-transparent border-0 outline-none text-sm w-full focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
              style={{ 
                color: 'var(--color-text-primary)',
                cursor: open ? 'text' : 'pointer'
              }}
              aria-label="Search languages"
              aria-autocomplete="list"
              aria-controls={listboxId}
              aria-activedescendant={
                highlightedIndex >= 0 && highlightedIndex < filteredLanguages.length
                  ? `${listboxId}-option-${highlightedIndex}`
                  : undefined
              }
              aria-expanded={open}
              spellCheck={false}
              autoComplete="off"
              readOnly={!open}
            />
            <svg
              className="h-4 w-4 flex-shrink-0 ml-2 pointer-events-none"
              style={{ color: 'var(--color-text-secondary)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </Popover.Trigger>
        <Popover.Portal>
            <Popover.Content
              className="z-50 w-[var(--radix-popover-trigger-width)] max-h-60 overflow-auto rounded-lg shadow-xl border"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)',
              }}
              sideOffset={4}
              align="start"
            >
              <div role="listbox">
              {filteredLanguages.length === 0 && query !== '' ? (
                <div
                  className="px-4 py-2.5 text-sm"
                  style={{ color: 'var(--color-text-tertiary)' }}
                  role="option"
                >
                  No languages found.
                </div>
              ) : (
                filteredLanguages.map((language, index) => {
                  const isHighlighted = highlightedIndex === index;
                  const isSelected = selectedLanguage?.code === language.code;
                  return (
                    <button
                      key={language.code}
                      ref={(el) => {
                        if (el) optionsRef.current[index] = el;
                      }}
                      type="button"
                      onClick={() => handleChange(language)}
                      className="w-full text-left px-4 py-2.5 text-sm cursor-pointer transition-colors"
                      style={{
                        backgroundColor: isSelected
                          ? 'var(--color-blue)'
                          : isHighlighted
                          ? 'var(--color-bg-tertiary)'
                          : 'transparent',
                        color: isSelected ? 'white' : 'var(--color-text-primary)',
                      }}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onMouseLeave={() => setHighlightedIndex(-1)}
                    >
                      <div className="flex items-center gap-2.5">
                        <span aria-hidden="true" className="text-base">{language.flag}</span>
                        <span className="font-medium">{language.name}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
});
