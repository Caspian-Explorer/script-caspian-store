'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { DEFAULT_MESSAGES, interpolate, isRtl, type MessageDict } from './messages';

export type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

interface LocaleContextValue {
  locale: string;
  messages: MessageDict;
  t: TranslateFn;
  dir: 'ltr' | 'rtl';
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export interface LocaleProviderProps {
  /** Active locale code (e.g. `en`, `ar`, `fr-CA`). Default: `en`. */
  locale?: string;
  /** Flat message dict for the active locale. Missing keys fall back to DEFAULT_MESSAGES. */
  messages?: MessageDict;
  /**
   * Alternative to `messages` — pass dictionaries for several locales at once.
   * The active `locale` selects which one is applied (with `en-US` → `en` fallback).
   * Missing keys fall through to DEFAULT_MESSAGES.
   */
  messagesByLocale?: Record<string, MessageDict>;
  children: ReactNode;
}

export function LocaleProvider({
  locale = 'en',
  messages,
  messagesByLocale,
  children,
}: LocaleProviderProps) {
  const merged = useMemo<MessageDict>(() => {
    const fromMap = messagesByLocale?.[locale];
    // Fallback: `fr-CA` → `fr` when the exact tag is missing.
    const primary = locale.split('-')[0];
    const fromPrimary = !fromMap && messagesByLocale ? messagesByLocale[primary] : undefined;
    return {
      ...DEFAULT_MESSAGES,
      ...(fromMap ?? fromPrimary ?? {}),
      ...(messages ?? {}),
    };
  }, [locale, messages, messagesByLocale]);

  const t = useCallback<TranslateFn>(
    (key, values) => {
      const template = merged[key] ?? key;
      return interpolate(template, values);
    },
    [merged],
  );

  const dir: 'ltr' | 'rtl' = isRtl(locale) ? 'rtl' : 'ltr';

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--caspian-direction', dir);
  }, [dir]);

  const value = useMemo(() => ({ locale, messages: merged, t, dir }), [locale, merged, t, dir]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Access the translator. Returns a no-op lookup if called outside a LocaleProvider. */
export function useT(): TranslateFn {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return (key, values) => interpolate(DEFAULT_MESSAGES[key] ?? key, values);
  }
  return ctx.t;
}

export function useLocale(): string {
  const ctx = useContext(LocaleContext);
  return ctx?.locale ?? 'en';
}

/** Returns the active layout direction (`ltr` or `rtl`). */
export function useDirection(): 'ltr' | 'rtl' {
  const ctx = useContext(LocaleContext);
  return ctx?.dir ?? 'ltr';
}

// --- Intl formatters (thin wrappers over native Intl, locale-aware) ---

export function useFormatNumber(options?: Intl.NumberFormatOptions) {
  const locale = useLocale();
  return useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, options);
    } catch {
      return new Intl.NumberFormat('en', options);
    }
  }, [locale, options]);
}

export function useFormatCurrency(currency = 'USD', options?: Intl.NumberFormatOptions) {
  const locale = useLocale();
  return useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency, ...options });
    } catch {
      return new Intl.NumberFormat('en', { style: 'currency', currency, ...options });
    }
  }, [locale, currency, options]);
}

export function useFormatDate(options?: Intl.DateTimeFormatOptions) {
  const locale = useLocale();
  return useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, options);
    } catch {
      return new Intl.DateTimeFormat('en', options);
    }
  }, [locale, options]);
}
