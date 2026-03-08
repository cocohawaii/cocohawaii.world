'use client';

import { useState, useEffect } from 'react';
import en from './en.json';
import es from './es.json';

const messages: Record<string, Record<string, unknown>> = { en, es };
const DEFAULT_LOCALE = 'en';

function getLocaleFromCookie(): string {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
  const value = match ? decodeURIComponent(match[1]) : DEFAULT_LOCALE;
  return messages[value] ? value : DEFAULT_LOCALE;
}

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);
  return typeof value === 'string' ? value : undefined;
}

export function useTranslations() {
  const [locale, setLocale] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    setLocale(getLocaleFromCookie());
  }, []);

  const t = (key: string): string => {
    const dict = messages[locale] ?? messages[DEFAULT_LOCALE];
    return getNested(dict as Record<string, unknown>, key) ?? getNested(en as Record<string, unknown>, key) ?? key;
  };

  return { t, locale };
}
