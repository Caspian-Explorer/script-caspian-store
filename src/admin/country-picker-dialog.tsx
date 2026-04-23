'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { useT } from '../i18n/locale-context';

/**
 * Static subset of ISO 3166-1 alpha-2 codes covering the ~90 most common
 * storefront markets. Not exhaustive — admins with needs beyond this list
 * can still edit `supportedCountries` in Firestore directly until we grow
 * the set. Ordered by rough region for visual browsing in the dialog.
 */
export interface IsoCountry {
  code: string;
  name: string;
}

export const ISO_COUNTRIES: readonly IsoCountry[] = [
  // North America
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  // Europe — UK + Ireland
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  // Europe — EU / EEA
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'PT', name: 'Portugal' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'IS', name: 'Iceland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'HU', name: 'Hungary' },
  { code: 'RO', name: 'Romania' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'HR', name: 'Croatia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'GR', name: 'Greece' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'MT', name: 'Malta' },
  { code: 'EE', name: 'Estonia' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'TR', name: 'Türkiye' },
  { code: 'UA', name: 'Ukraine' },
  // Oceania
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  // Asia
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'CN', name: 'China' },
  { code: 'HK', name: 'Hong Kong SAR' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'IN', name: 'India' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'LK', name: 'Sri Lanka' },
  // Middle East
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
  { code: 'JO', name: 'Jordan' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'IL', name: 'Israel' },
  // Africa
  { code: 'ZA', name: 'South Africa' },
  { code: 'EG', name: 'Egypt' },
  { code: 'MA', name: 'Morocco' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  // Latin America
  { code: 'BR', name: 'Brazil' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'PA', name: 'Panama' },
  { code: 'DO', name: 'Dominican Republic' },
  { code: 'PR', name: 'Puerto Rico' },
];

export interface CountryPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Codes already selected — shown with an active check and preselected when re-opened. */
  selected: string[];
  /** Called when the admin confirms with the resulting set of codes. */
  onConfirm: (codes: string[]) => void;
  /**
   * Countries to offer. Defaults to `ISO_COUNTRIES`. Useful when an admin
   * needs to pick from a narrower set (e.g. "shipping-eligible" within an
   * already-whitelisted country set).
   */
  source?: readonly IsoCountry[];
  /** Override dialog title. */
  title?: string;
  /** Override confirm button label. */
  confirmLabel?: string;
}

/**
 * Check-many-at-once country picker. Search filter on top; a single column
 * of checkboxes grouped (by list order) below; footer buttons to Clear all,
 * Select all (visible), Cancel, Confirm. Confirming fires `onConfirm` with
 * the resulting code list and closes the dialog.
 *
 * State lives in the dialog until Confirm; Cancel/Escape discards.
 */
export function CountryPickerDialog({
  open,
  onOpenChange,
  selected,
  onConfirm,
  source = ISO_COUNTRIES,
  title,
  confirmLabel,
}: CountryPickerDialogProps) {
  const t = useT();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Set<string>>(new Set(selected));

  // Reset draft to latest selected when dialog opens.
  useEffect(() => {
    if (open) {
      setDraft(new Set(selected));
      setQuery('');
    }
  }, [open, selected]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    );
  }, [source, query]);

  const toggle = (code: string) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const selectAllVisible = () => {
    setDraft((prev) => {
      const next = new Set(prev);
      for (const c of filtered) next.add(c.code);
      return next;
    });
  };

  const clearAll = () => setDraft(new Set());

  const handleConfirm = () => {
    onConfirm(Array.from(draft));
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title ?? t('admin.countryPicker.title')}
      description={t('admin.countryPicker.description')}
      maxWidth={560}
      footer={
        <>
          <Button variant="ghost" onClick={clearAll}>
            {t('admin.countryPicker.clearAll')}
          </Button>
          <Button variant="outline" onClick={selectAllVisible}>
            {t('admin.countryPicker.selectAllVisible', { count: filtered.length })}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm}>
            {confirmLabel ?? t('admin.countryPicker.confirm', { count: draft.size })}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('admin.countryPicker.searchPlaceholder')}
          style={{
            padding: '10px 12px',
            border: '1px solid rgba(0,0,0,0.15)',
            borderRadius: 'var(--caspian-radius, 8px)',
            fontSize: 14,
            outline: 'none',
            background: '#fafafa',
          }}
        />
        {filtered.length === 0 ? (
          <p style={{ color: '#888', fontSize: 14, padding: '24px 0', textAlign: 'center' }}>
            {t('admin.countryPicker.noResults')}
          </p>
        ) : (
          <div
            style={{
              maxHeight: 380,
              overflowY: 'auto',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 8,
            }}
          >
            {filtered.map((c) => {
              const checked = draft.has(c.code);
              return (
                <label
                  key={c.code}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    fontSize: 14,
                    background: checked ? 'rgba(0,0,0,0.03)' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(c.code)}
                  />
                  <span style={{ fontFamily: 'monospace', color: '#666', width: 24 }}>
                    {c.code}
                  </span>
                  <span style={{ flex: 1 }}>{c.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
    </Dialog>
  );
}
