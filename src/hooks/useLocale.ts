import { useState, useEffect } from 'react';
import { Language } from '../types';

import en from '../locales/en.json';
import ru from '../locales/ru.json';
import uz from '../locales/uz.json';

const getDeviceLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  const lang = navigator.language.toLowerCase();
  if (lang.includes('uz')) return 'uz';
  if (lang.includes('ru')) return 'ru';
  return 'en';
};

const flattenLocale = (locale: any, prefix: string = ''): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const key in locale) {
    const value = locale[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      result[newKey] = value;
    } else if (Array.isArray(value)) {
      value.forEach((item: string, index: number) => {
        result[`${newKey}.${index}`] = item;
      });
    } else if (typeof value === 'object' && value !== null) {
      const nested = flattenLocale(value, newKey);
      Object.assign(result, nested);
    }
  }
  return result;
};

const flattenedLocales: Record<Language, Record<string, string>> = {
  en: flattenLocale(en),
  ru: flattenLocale(ru),
  uz: flattenLocale(uz),
};

export const useLocale = (initialLanguage?: Language) => {
  const [language, setLanguage] = useState<Language>(initialLanguage || getDeviceLanguage());

  useEffect(() => {
    const savedLang = localStorage.getItem('boxing-trainer-lang') as Language | null;
    if (savedLang && (savedLang === 'en' || savedLang === 'ru' || savedLang === 'uz')) {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('boxing-trainer-lang', language);
  }, [language]);

  const t = (key: string, replacements?: Record<string, string | number>): string => {
    const locale = flattenedLocales[language];
    let translation = locale[key] || key;
    if (replacements) {
      for (const [placeholder, value] of Object.entries(replacements)) {
        translation = translation.replace(new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g'), String(value));
      }
    }
    return translation;
  };

  const getRandomTip = (): string => {
    const locale = flattenedLocales[language];
    const tips: string[] = [];
    for (const key in locale) {
      if (key.startsWith('tips.')) {
        tips.push(locale[key]);
      }
    }
    return tips[Math.floor(Math.random() * tips.length)] || '';
  };

  return { t, language, setLanguage, getRandomTip, locales: flattenedLocales };
};

export const getLocale = (lang: Language) => flattenedLocales[lang];

export default useLocale;
