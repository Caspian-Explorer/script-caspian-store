'use client';

import type { CSSProperties } from 'react';
import { useT } from '../../../i18n';
import type { PrereqsDraft } from '../setup-types';

export interface PrereqsStepProps {
  draft: PrereqsDraft;
  onChange: (patch: Partial<PrereqsDraft>) => void;
}

interface ChecklistItem {
  key: keyof PrereqsDraft;
  required: boolean;
}

const ITEMS: ChecklistItem[] = [
  { key: 'firebaseProject', required: true },
  { key: 'firebaseWebConfig', required: true },
  { key: 'serviceAccount', required: true },
  { key: 'toolchain', required: true },
  { key: 'contactEmail', required: true },
  { key: 'brandAssets', required: false },
  { key: 'stripeKeys', required: false },
];

export function PrereqsStep({ draft, onChange }: PrereqsStepProps) {
  const t = useT();
  return (
    <div style={wrap}>
      <p style={intro}>{t('setup.prereqs.intro')}</p>
      <ul style={list}>
        {ITEMS.map(({ key, required }) => {
          const checked = draft[key];
          return (
            <li key={key} style={item}>
              <label style={row}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => onChange({ [key]: e.target.checked } as Partial<PrereqsDraft>)}
                  style={checkbox}
                />
                <span style={textWrap}>
                  <span style={titleRow}>
                    <span style={titleStyle}>{t(`setup.prereqs.items.${key}.title`)}</span>
                    {!required && <span style={badgeOptional}>{t('setup.prereqs.optional')}</span>}
                  </span>
                  <span style={desc}>{t(`setup.prereqs.items.${key}.desc`)}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The wizard uses this to gate the "Begin installation" button. All
 * required items must be checked; optional ones don't block.
 */
export function isPrereqsComplete(draft: PrereqsDraft): boolean {
  return ITEMS.filter((i) => i.required).every((i) => draft[i.key]);
}

const wrap: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 16 };

const intro: CSSProperties = {
  fontSize: 14,
  color: '#3F4A5E',
  margin: 0,
  lineHeight: 1.55,
};

const list: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const item: CSSProperties = {
  border: '1px solid #E1E5F0',
  borderRadius: 10,
  padding: '12px 14px',
  background: '#FAFBFE',
};

const row: CSSProperties = {
  display: 'flex',
  gap: 12,
  alignItems: 'flex-start',
  cursor: 'pointer',
};

const checkbox: CSSProperties = {
  width: 18,
  height: 18,
  marginTop: 2,
  accentColor: '#022959',
  cursor: 'pointer',
};

const textWrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flex: 1,
};

const titleRow: CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
};

const titleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#022959',
};

const badgeOptional: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  color: '#6A7A8A',
  background: '#EFF2F8',
  padding: '2px 8px',
  borderRadius: 999,
};

const desc: CSSProperties = {
  fontSize: 13,
  color: '#6A7A8A',
  lineHeight: 1.5,
};
