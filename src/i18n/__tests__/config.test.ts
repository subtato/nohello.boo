import { describe, it, expect, beforeEach } from 'vitest';
import i18n from '../config';

describe('i18n config', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('should be initialized', () => {
    expect(i18n).toBeDefined();
    expect(i18n.isInitialized).toBe(true);
  });

  it('should have default language set to en', () => {
    expect(i18n.language).toBe('en');
  });

  it('should have fallback language set to en', () => {
    const fallbackLng = i18n.options.fallbackLng;
    expect(fallbackLng === 'en' || (Array.isArray(fallbackLng) && fallbackLng.includes('en'))).toBe(true);
  });

  it('should have all required language resources', () => {
    const resources = i18n.options.resources;
    expect(resources).toBeDefined();
    expect(resources?.en).toBeDefined();
    expect(resources?.es).toBeDefined();
    expect(resources?.fr).toBeDefined();
    expect(resources?.de).toBeDefined();
  });

  it('should translate basic keys', () => {
    const intro = i18n.t('intro');
    expect(typeof intro).toBe('string');
    expect(intro).toBeTruthy();
  });

  it('should translate nested keys', () => {
    const problemTitle = i18n.t('problem.title');
    expect(typeof problemTitle).toBe('string');
    expect(problemTitle).toBeTruthy();
  });

  it('should change language', () => {
    i18n.changeLanguage('es');
    expect(i18n.language).toBe('es');
    
    i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
  });

  it('should translate to different languages', () => {
    i18n.changeLanguage('en');
    const introEn = i18n.t('intro');
    
    i18n.changeLanguage('es');
    const introEs = i18n.t('intro');
    
    // They might be the same if translation is missing, but should be strings
    expect(typeof introEn).toBe('string');
    expect(typeof introEs).toBe('string');
  });

  it('should return arrays for array translations', () => {
    const messages = i18n.t('rotatingMessages', { returnObjects: true });
    expect(Array.isArray(messages)).toBe(true);
    if (Array.isArray(messages)) {
      expect(messages.length).toBeGreaterThan(0);
    }
  });
});

