import en from './en.json';
import es from './es.json';

const messages: Record<string, Record<string, unknown>> = { en, es };
const DEFAULT_LOCALE = 'en';

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === 'string' ? current : undefined;
}

export function getTranslationsForLocale(locale: string): (key: string) => string {
  const dict = messages[locale] ?? messages[DEFAULT_LOCALE] ?? messages.en;
  const fallback = messages[DEFAULT_LOCALE] ?? messages.en;
  return (key: string) => {
    const value = getNested(dict as Record<string, unknown>, key);
    if (value !== undefined) return value;
    const fb = getNested(fallback as Record<string, unknown>, key);
    return fb ?? key;
  };
}

export function getLocaleFromRequest(cookieHeader: string | undefined): string {
  if (!cookieHeader) return DEFAULT_LOCALE;
  const match = cookieHeader.match(/(?:^|; )locale=([^;]*)/);
  const value = match ? decodeURIComponent(match[1].trim()) : DEFAULT_LOCALE;
  return messages[value] ? value : DEFAULT_LOCALE;
}
