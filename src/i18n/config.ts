import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import ko from './locales/ko.json';

// Local resources for development and fallback
const localResources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  ko: { translation: ko },
};

// Check if we're in production (Cloudflare Pages)
const isProduction = import.meta.env.PROD;
const useBackend = isProduction;

if (useBackend) {
  // Production: Load translations from Cloudflare Pages Function (which serves from B2)
  i18n
    .use(Backend)
    .use(initReactI18next)
    .init({
      backend: {
        loadPath: '/translations/{{lng}}',
        // Fallback to local resources if backend fails
        allowMultiLoading: false,
      },
      resources: localResources, // Fallback resources
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      // Retry loading from backend
      react: {
        useSuspense: false,
      },
    });
} else {
  // Development: Use local files directly
  i18n
    .use(initReactI18next)
    .init({
      resources: localResources,
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n;

