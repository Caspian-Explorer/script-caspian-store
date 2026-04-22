'use client';

import type { CSSProperties } from 'react';
import { useT } from '../../../i18n';
import type { FeatureFlags } from '../../../types';

export interface FeaturesStepProps {
  draft: FeatureFlags;
  onChange: (patch: Partial<FeatureFlags>) => void;
}

type FeatureKey = keyof FeatureFlags;

const FEATURE_ORDER: FeatureKey[] = [
  'reviews',
  'questions',
  'wishlist',
  'promoCodes',
  'guestCheckout',
  'multiLanguage',
];

export function FeaturesStep({ draft, onChange }: FeaturesStepProps) {
  const t = useT();
  return (
    <div style={list}>
      {FEATURE_ORDER.map((key) => {
        const enabled = draft[key];
        return (
          <label
            key={key}
            style={{ ...row, ...(enabled ? rowSelected : null) }}
          >
            <div style={rowText}>
              <span style={rowTitle}>{t(`setup.features.${key}.title`)}</span>
              <span style={rowDesc}>{t(`setup.features.${key}.desc`)}</span>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => onChange({ [key]: e.target.checked } as Partial<FeatureFlags>)}
              style={checkbox}
            />
          </label>
        );
      })}
    </div>
  );
}

const list: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 18px',
  border: '1px solid #D6D9E6',
  borderRadius: 8,
  cursor: 'pointer',
  background: '#FFFFFF',
  transition: 'border-color 140ms ease, background 140ms ease',
};

const rowSelected: CSSProperties = {
  borderColor: '#022959',
  background: '#F2F6FF',
};

const rowText: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

const rowTitle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#022959',
};

const rowDesc: CSSProperties = {
  fontSize: 13,
  color: '#6A7A8A',
};

const checkbox: CSSProperties = {
  width: 18,
  height: 18,
  accentColor: '#022959',
  cursor: 'pointer',
};
