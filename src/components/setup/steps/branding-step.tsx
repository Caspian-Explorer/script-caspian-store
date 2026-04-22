'use client';

import type { CSSProperties } from 'react';
import { useT } from '../../../i18n';
import { THEME_PRESETS, type ThemePresetName } from '../../../theme';
import { SetupField } from '../setup-ui';
import type { BrandingDraft } from '../setup-types';

export interface BrandingStepProps {
  draft: BrandingDraft;
  onChange: (patch: Partial<BrandingDraft>) => void;
}

const PRESET_OPTIONS: ThemePresetName[] = Object.keys(THEME_PRESETS) as ThemePresetName[];

export function BrandingStep({ draft, onChange }: BrandingStepProps) {
  const t = useT();
  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <span style={sectionLabel}>{t('setup.branding.themePreset')}</span>
      </div>
      <div style={grid}>
        {PRESET_OPTIONS.map((name) => {
          const preset = THEME_PRESETS[name];
          const selected = draft.themePreset === name;
          return (
            <button
              key={name}
              type="button"
              onClick={() =>
                onChange({
                  themePreset: name,
                  theme: {
                    primary: preset.primary,
                    primaryForeground: preset.primaryForeground,
                    accent: preset.accent,
                    radius: preset.radius,
                  },
                })
              }
              style={{
                ...swatch,
                ...(selected ? swatchSelected : null),
              }}
              aria-pressed={selected}
            >
              <span
                style={{
                  ...swatchColor,
                  background: preset.primary,
                }}
              />
              <span style={swatchLabel}>{name}</span>
            </button>
          );
        })}
      </div>

      <div style={{ height: 24 }} />
      <SetupField
        label={t('setup.branding.heroTitle')}
        placeholder={t('setup.branding.heroTitlePlaceholder')}
        value={draft.heroTitle}
        onChange={(e) => onChange({ heroTitle: e.target.value })}
      />
      <SetupField
        label={t('setup.branding.heroSubtitle')}
        placeholder={t('setup.branding.heroSubtitlePlaceholder')}
        value={draft.heroSubtitle}
        onChange={(e) => onChange({ heroSubtitle: e.target.value })}
      />
      <SetupField
        label={t('setup.branding.heroCta')}
        placeholder="Shop now"
        value={draft.heroCta}
        onChange={(e) => onChange({ heroCta: e.target.value })}
      />
    </div>
  );
}

const sectionLabel: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: '#022959',
};

const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
  gap: 10,
};

const swatch: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: 10,
  borderRadius: 8,
  border: '1px solid #D6D9E6',
  background: '#FFFFFF',
  cursor: 'pointer',
  fontSize: 13,
  textAlign: 'left',
  fontFamily: 'inherit',
  transition: 'border-color 140ms ease, background 140ms ease',
};

const swatchSelected: CSSProperties = {
  borderColor: '#022959',
  background: '#F2F6FF',
};

const swatchColor: CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: '50%',
  border: '1px solid rgba(0,0,0,0.06)',
  flexShrink: 0,
};

const swatchLabel: CSSProperties = {
  textTransform: 'capitalize',
  color: '#022959',
  fontWeight: 500,
};
