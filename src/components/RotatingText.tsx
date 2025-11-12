import { memo, useEffect, useRef, useState, useMemo } from 'react';
import i18n from '../i18n/config';

export const RotatingText = memo(function RotatingText() {
  // Only subscribe to language changes, not all i18n updates
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
  
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentIndexRef = useRef(0);
  const isInitialMount = useRef(true);
  const messagesRef = useRef<string[]>([]);
  const textSpanRef = useRef<HTMLSpanElement>(null);
  const currentGraphemesRef = useRef<string[]>([]);

  // Memoize messages - only update when language actually changes
  const messages = useMemo(() => {
    const msgs = i18n.t('rotatingMessages', { returnObjects: true }) as string[];
    messagesRef.current = msgs;
    return msgs;
  }, [currentLanguage]);

  useEffect(() => {
    if (messages.length === 0) return;
    if (!textSpanRef.current) return;

    const typeSpeed = 80; // ms per character
    const deleteSpeed = 60; // ms per character
    const pauseDelay = 2000; // ms to pause before deleting
    const startDelay = 3000; // ms before starting first message

    const updateText = (text: string) => {
      if (textSpanRef.current) {
        textSpanRef.current.textContent = text;
      }
    };

    // Helper function to split string into grapheme clusters (handles emojis properly)
    const getGraphemes = (text: string): string[] => {
      // Use Intl.Segmenter if available (modern browsers)
      if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
        const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
        return Array.from(segmenter.segment(text), s => s.segment);
      }
      // Fallback: use spread operator which handles most emojis correctly
      // This works for most cases including simple emojis
      return [...text];
    };

    const typeChar = (graphemeIndex: number) => {
      const msg = messagesRef.current[currentIndexRef.current];
      if (!msg) return;
      
      // Cache graphemes to ensure consistency during typing/deleting
      if (currentGraphemesRef.current.length === 0 || graphemeIndex === 0) {
        currentGraphemesRef.current = getGraphemes(msg);
      }
      const graphemes = currentGraphemesRef.current;
      
      if (graphemeIndex < graphemes.length) {
        updateText(graphemes.slice(0, graphemeIndex + 1).join(''));
        timeoutRef.current = setTimeout(() => typeChar(graphemeIndex + 1), typeSpeed);
      } else {
        // Finished typing, wait then start deleting
        timeoutRef.current = setTimeout(() => {
          deleteChar(graphemes.length);
        }, pauseDelay);
      }
    };

    const deleteChar = (graphemeIndex: number) => {
      // Use cached graphemes to ensure we're working with the same segmentation
      const graphemes = currentGraphemesRef.current;
      
      if (graphemeIndex > 0) {
        // Slice to get all graphemes except the last one
        const newText = graphemes.slice(0, graphemeIndex - 1).join('');
        updateText(newText);
        timeoutRef.current = setTimeout(() => deleteChar(graphemeIndex - 1), deleteSpeed);
      } else {
        // Finished deleting, move to next message
        updateText('');
        currentGraphemesRef.current = []; // Clear cache
        currentIndexRef.current = (currentIndexRef.current + 1) % messagesRef.current.length;
        // Start typing next message immediately
        timeoutRef.current = setTimeout(() => {
          typeChar(0);
        }, 100);
      }
    };

    // Start typing
    if (isInitialMount.current) {
      // First mount - wait for start delay
      isInitialMount.current = false;
      updateText('');
      currentIndexRef.current = 0;
      timeoutRef.current = setTimeout(() => {
        typeChar(0);
      }, startDelay);
    } else {
      // If messages changed, restart from current index
      updateText('');
      timeoutRef.current = setTimeout(() => {
        typeChar(0);
      }, 100);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [messages.length, currentLanguage]); // Re-run only when messages length or language changes

  if (messages.length === 0) return null;

  return (
    <span 
      className="inline-flex items-baseline justify-center rotating-text-container overflow-visible"
    >
      <span ref={textSpanRef} className="inline-block whitespace-nowrap line-through decoration-red-600 dark:decoration-red-400 decoration-[4px] font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-gray-100 dark:via-gray-200 dark:to-gray-100 bg-clip-text text-transparent">
      </span>
      <span className="inline-block w-0.5 h-[1em] bg-gray-900 dark:bg-gray-100 ml-1.5 animate-blink align-middle">
      </span>
    </span>
  );
}, () => {
  // Custom comparison: never re-render based on props (RotatingText has no props)
  // Language changes are handled internally via state
  // Return true means props are equal, so skip re-render
  return true;
});

