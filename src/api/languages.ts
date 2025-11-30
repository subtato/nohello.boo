export interface Language {
  code: string;
  name: string;
  flag: string;
}

/**
 * Fetches available languages from the server
 * This can be replaced with a real API endpoint later
 */
export async function fetchLanguages(): Promise<Language[]> {
  // TODO: Replace with actual API endpoint
  // For now, return mock data that matches the current implementation
  // Example: const response = await fetch('/api/languages');
  // return response.json();
  
  return [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
  ];
}

