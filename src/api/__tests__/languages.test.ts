import { describe, it, expect } from 'vitest';
import { fetchLanguages, type Language } from '../languages';

describe('languages API', () => {
  it('should fetch languages and return an array', async () => {
    const languages = await fetchLanguages();
    expect(Array.isArray(languages)).toBe(true);
  });

  it('should return languages with correct structure', async () => {
    const languages = await fetchLanguages();
    
    expect(languages.length).toBeGreaterThan(0);
    
    languages.forEach((lang: Language) => {
      expect(lang).toHaveProperty('code');
      expect(lang).toHaveProperty('name');
      expect(lang).toHaveProperty('flag');
      expect(typeof lang.code).toBe('string');
      expect(typeof lang.name).toBe('string');
      expect(typeof lang.flag).toBe('string');
    });
  });

  it('should include expected languages', async () => {
    const languages = await fetchLanguages();
    const codes = languages.map((lang: Language) => lang.code);
    
    expect(codes).toContain('en');
    expect(codes).toContain('es');
    expect(codes).toContain('fr');
    expect(codes).toContain('de');
  });

  it('should have unique language codes', async () => {
    const languages = await fetchLanguages();
    const codes = languages.map((lang: Language) => lang.code);
    const uniqueCodes = new Set(codes);
    
    expect(uniqueCodes.size).toBe(codes.length);
  });
});

