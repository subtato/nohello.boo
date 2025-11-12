import { memo } from 'react';
import { LanguageSelect } from './LanguageSelect';

interface LanguageSwitcherProps {
  mobile?: boolean;
}

export const LanguageSwitcher = memo(function LanguageSwitcher({ mobile = false }: LanguageSwitcherProps) {
  return <LanguageSelect mobile={mobile} />;
});


