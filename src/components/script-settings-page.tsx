'use client';

import { useState, useEffect } from 'react';
import { useScriptSettings } from '../context/script-settings-context';
import { useAuth } from '../context/auth-context';
import { useT } from '../i18n/locale-context';
import { ThemePresetPicker } from '../theme/theme-preset-picker';
import type { FeatureFlags, ThemeTokens } from '../types';

export interface ScriptSettingsPageProps {
  /** Optional wrapper classname — unstyled by default. */
  className?: string;
  /** Render when the caller wants their own admin-gate logic. Otherwise a
   *  built-in role check is performed. */
  requireAdminRole?: boolean;
}

/**
 * Self-service script-settings page. This is the *site-level* configuration
 * that lives outside the store-admin panel — theme tokens, feature flags,
 * brand info, Stripe public key, default currency/locale.
 *
 * Stage 0 ships a simple form. Future stages will add pickers, previews,
 * and presets.
 */
export function ScriptSettingsPage({
  className,
  requireAdminRole = true,
}: ScriptSettingsPageProps) {
  const { settings, loading, saving, save } = useScriptSettings();
  const { userProfile, loading: authLoading } = useAuth();
  const t = useT();

  const [draft, setDraft] = useState(() => ({
    brandName: settings.brandName,
    brandDescription: settings.brandDescription,
    defaultCurrency: settings.defaultCurrency,
    defaultLocale: settings.defaultLocale,
    stripePublicKey: settings.stripePublicKey ?? '',
    theme: { ...settings.theme },
    features: { ...settings.features },
  }));

  // Sync draft when settings change from upstream.
  useEffect(() => {
    setDraft({
      brandName: settings.brandName,
      brandDescription: settings.brandDescription,
      defaultCurrency: settings.defaultCurrency,
      defaultLocale: settings.defaultLocale,
      stripePublicKey: settings.stripePublicKey ?? '',
      theme: { ...settings.theme },
      features: { ...settings.features },
    });
  }, [settings]);

  if (authLoading || loading) {
    return <div className={className}>{t('common.loading')}</div>;
  }

  if (requireAdminRole && userProfile?.role !== 'admin') {
    return (
      <div className={className}>
        <p>{t('settings.needAdminRole')}</p>
      </div>
    );
  }

  const handleSave = async () => {
    await save({
      brandName: draft.brandName.trim(),
      brandDescription: draft.brandDescription.trim(),
      defaultCurrency: draft.defaultCurrency.trim() || 'USD',
      defaultLocale: draft.defaultLocale.trim() || 'en',
      stripePublicKey: draft.stripePublicKey.trim() || null,
      theme: draft.theme,
      features: draft.features,
    });
  };

  const updateTheme = <K extends keyof ThemeTokens>(key: K, value: ThemeTokens[K]) => {
    setDraft((d) => ({ ...d, theme: { ...d.theme, [key]: value } }));
  };

  const toggleFeature = (key: keyof FeatureFlags) => {
    setDraft((d) => ({ ...d, features: { ...d.features, [key]: !d.features[key] } }));
  };

  return (
    <div className={className}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{t('settings.title')}</h1>
        <p style={{ color: '#666', marginTop: 4 }}>{t('settings.subtitle')}</p>
      </header>

      <section style={sectionStyle}>
        <h2 style={h2Style}>{t('settings.sections.brand')}</h2>
        <Field label={t('settings.brandName')}>
          <input
            style={inputStyle}
            value={draft.brandName}
            onChange={(e) => setDraft((d) => ({ ...d, brandName: e.target.value }))}
          />
        </Field>
        <Field label={t('settings.brandDescription')}>
          <input
            style={inputStyle}
            value={draft.brandDescription}
            onChange={(e) => setDraft((d) => ({ ...d, brandDescription: e.target.value }))}
          />
        </Field>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>{t('settings.sections.localization')}</h2>
        <Field label={t('settings.defaultCurrency')}>
          <input
            style={inputStyle}
            value={draft.defaultCurrency}
            onChange={(e) => setDraft((d) => ({ ...d, defaultCurrency: e.target.value.toUpperCase() }))}
            maxLength={3}
          />
        </Field>
        <Field label={t('settings.defaultLocale')}>
          <input
            style={inputStyle}
            value={draft.defaultLocale}
            onChange={(e) => setDraft((d) => ({ ...d, defaultLocale: e.target.value }))}
          />
        </Field>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>{t('settings.sections.payments')}</h2>
        <Field label={t('settings.stripePublicKey')}>
          <input
            style={inputStyle}
            value={draft.stripePublicKey}
            onChange={(e) => setDraft((d) => ({ ...d, stripePublicKey: e.target.value }))}
            placeholder="pk_live_..."
          />
        </Field>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>{t('settings.sections.theme')}</h2>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#555', margin: '0 0 8px' }}>
            {t('settings.theme.presets')}
          </p>
          <ThemePresetPicker />
        </div>
        <Field label={t('settings.theme.primary')}>
          <input
            type="color"
            value={draft.theme.primary}
            onChange={(e) => updateTheme('primary', e.target.value)}
          />
        </Field>
        <Field label={t('settings.theme.primaryForeground')}>
          <input
            type="color"
            value={draft.theme.primaryForeground}
            onChange={(e) => updateTheme('primaryForeground', e.target.value)}
          />
        </Field>
        <Field label={t('settings.theme.accent')}>
          <input
            type="color"
            value={draft.theme.accent}
            onChange={(e) => updateTheme('accent', e.target.value)}
          />
        </Field>
        <Field label={t('settings.theme.radius')}>
          <input
            style={inputStyle}
            value={draft.theme.radius}
            onChange={(e) => updateTheme('radius', e.target.value)}
          />
        </Field>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>{t('settings.sections.features')}</h2>
        {(Object.keys(draft.features) as Array<keyof FeatureFlags>).map((key) => (
          <label key={key} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '4px 0' }}>
            <input
              type="checkbox"
              checked={draft.features[key]}
              onChange={() => toggleFeature(key)}
            />
            <span style={{ fontSize: 14 }}>{key}</span>
          </label>
        ))}
      </section>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: '10px 20px',
          background: 'var(--caspian-primary, #111)',
          color: 'var(--caspian-primary-foreground, #fff)',
          border: 0,
          borderRadius: 'var(--caspian-radius, 8px)',
          cursor: saving ? 'wait' : 'pointer',
          fontWeight: 600,
        }}
      >
        {saving ? t('settings.saving') : t('settings.saveButton')}
      </button>
    </div>
  );
}

const sectionStyle = { marginBottom: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 };
const h2Style = { fontSize: 16, fontWeight: 600, marginTop: 0, marginBottom: 12 };
const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '8px 10px',
  border: '1px solid #ddd',
  borderRadius: 4,
  fontSize: 14,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#555' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
