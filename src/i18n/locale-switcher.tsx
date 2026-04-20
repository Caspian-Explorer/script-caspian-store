'use client';

import type { ReactNode } from 'react';
import { useLocale } from './locale-context';
import { Select } from '../ui/select';
import { cn } from '../utils/cn';

export interface LocaleOption {
  code: string;
  label: string;
}

export interface LocaleSwitcherProps {
  /** Available locales to show in the dropdown. */
  locales: LocaleOption[];
  /** Called with the new locale code. Consumers pipe this back into their root
   *  `<CaspianStoreProvider locale={...} messages={...}>` (e.g. via a context
   *  or URL query param) to take effect. */
  onChange: (code: string) => void;
  label?: ReactNode;
  className?: string;
}

/**
 * Minimal locale-switcher UI. The package does not persist the chosen locale
 * because that decision is consumer-specific (URL path, cookie, query, user
 * profile, etc.) — you own where the value goes.
 */
export function LocaleSwitcher({ locales, onChange, label, className }: LocaleSwitcherProps) {
  const current = useLocale();
  return (
    <div className={cn('caspian-locale-switcher', className)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {label}
      <Select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        options={locales.map((l) => ({ value: l.code, label: l.label }))}
      />
    </div>
  );
}
