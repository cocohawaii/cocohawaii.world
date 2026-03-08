'use client';

import { useState, useEffect, useRef } from 'react';

const LOCALE_COOKIE = 'locale';
const DEFAULT_LOCALE = 'en';

function getLocaleFromCookie(): string {
  if (typeof document === 'undefined') return DEFAULT_LOCALE;
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : DEFAULT_LOCALE;
}

function setLocaleCookie(locale: string) {
  document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(locale)};path=/;max-age=31536000`;
}

export function useLocale() {
  const [locale, setLocale] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    setLocale(getLocaleFromCookie());
  }, []);

  const setLocaleAndReload = (newLocale: string) => {
    if (newLocale === getLocaleFromCookie()) return;
    setLocaleCookie(newLocale);
    window.location.reload();
  };

  return { locale, setLocale: setLocaleAndReload };
}

const options = [
  { value: 'en', code: 'EN', flag: '🇬🇧', title: 'English' },
  { value: 'es', code: 'ES', flag: '🇪🇸', title: 'Español' },
] as const;

export default function LanguageSelector() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = options.find((o) => o.value === locale) ?? options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900"
        title={`${current.title} (click to change)`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="text-xl leading-none" aria-hidden>
          {current.flag}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 py-1 w-40 rounded-lg border border-gray-200 bg-white shadow-lg z-50"
          role="menu"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="menuitem"
              onClick={() => {
                setLocale(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                locale === opt.value
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title={opt.title}
            >
              <span className="text-base leading-none">{opt.flag}</span>
              <span>{opt.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
