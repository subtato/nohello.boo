import { memo } from 'react';
import { DarkModeToggle } from './DarkModeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { LanguageSelect } from './LanguageSelect';

export const ControlsBar = memo(function ControlsBar() {
  return (
    <>
      {/* Mobile: Bottom floating bar */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 flex items-center justify-center">
        <div className="flex items-center gap-3 backdrop-blur-md rounded-2xl shadow-2xl px-4 py-3" style={{ backgroundColor: 'var(--color-bg-overlay)', borderColor: 'var(--color-border)', borderWidth: '1px', borderStyle: 'solid' }}>
          <DarkModeToggle mobile />
          <div className="h-6 w-px" style={{ backgroundColor: 'var(--color-border)' }} />
          <LanguageSelect mobile />
        </div>
      </div>

      {/* Desktop: Top corners */}
      <div className="hidden md:block">
        <DarkModeToggle />
        <LanguageSwitcher />
      </div>
    </>
  );
});

