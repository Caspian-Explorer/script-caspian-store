'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { DEFAULT_MESSAGES, interpolate, type MessageDict } from './messages';

export type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

interface LocaleContextValue {
  locale: string;
  messages: MessageDict;
  t: TranslateFn;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export interface LocaleProviderProps {
  locale?: string;
  /** Override subset of keys or ship a full locale dictionary. Missing keys fall through to DEFAULT_MESSAGES. */
  messages?: MessageDict;
  children: ReactNode;
}

export function LocaleProvider({ locale = 'en', messages, children }: LocaleProviderProps) {
  const merged = useMemo<MessageDict>(() => ({ ...DEFAULT_MESSAGES, ...(messages ?? {}) }), [messages]);

  const t = useCallback<TranslateFn>(
    (key, values) => {
      const template = merged[key] ?? key;
      return interpolate(template, values);
    },
    [merged],
  );

  const value = useMemo(() => ({ locale, messages: merged, t }), [locale, merged, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/** Access the translator. Returns a no-op lookup if called outside a LocaleProvider (safe to use anywhere). */
export function useT(): TranslateFn {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return (key, values) => interpolate(DEFAULT_MESSAGES[key] ?? key, values);
  }
  return ctx.t;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  return ctx?.locale ?? 'en';
}
