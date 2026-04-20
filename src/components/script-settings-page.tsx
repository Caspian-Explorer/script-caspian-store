'use client';

import { useState, useEffect } from 'react';
import { useScriptSettings } from '../context/script-settings-context';
import { useAuth } from '../context/auth-context';
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
    return <div className={className}>Loading…</div>;
  }

  if (requireAdminRole && userProfile?.role !== 'admin') {
    return (
      <div className={className}>
        <p>You need admin role to access script settings.</p>
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
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Script Settings</h1>
        <p style={{ color: '#666', marginTop: 4 }}>
          Site-level configuration for your Caspian Store installation.
        </p>
      </header>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Brand</h2>
        <Field label="Brand name">
          <input
            style={inputStyle}
            value={draft.brandName}
            onChange={(e) => setDraft((d) => ({ ...d, brandName: e.target.value }))}
          />
        </Field>
        <Field label="Brand description">
          <input
            style={inputStyle}
            value={draft.brandDescription}
            onChange={(e) => setDraft((d) => ({ ...d, brandDescription: e.target.value }))}
          />
        </Field>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Localization</h2>
        <Field label="Default currency (ISO 4217)">
          <input
            style={inputStyle}
            value={draft.defaultCurrency}
            onChange={(e) => setDraft((d) => ({ ...d, defaultCurrency: e.target.value.toUpperCase() }))}
            maxLength={3}
          />
        </Field>
        <Field label="Default locale">
          <input
            style={inputStyle}
            value={draft.defaultLocale}
            onChange={(e) => setDraft((d) => ({ ...d, defaultLocale: e.target.value }))}
          />
        </Field>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Payments</h2>
        <Field label="Stripe publishable key (pk_...)">
          <input
            style={inputStyle}
            value={draft.stripePublicKey}
            onChange={(e) => setDraft((d) => ({ ...d, stripePublicKey: e.target.value }))}
            placeholder="pk_live_..."
          />
        </Field>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Theme</h2>
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#555', margin: '0 0 8px' }}>Presets</p>
          <ThemePresetPicker />
        </div>
        <Field label="Primary color">
          <input
            type="color"
            value={draft.theme.primary}
            onChange={(e) => updateTheme('primary', e.target.value)}
          />
        </Field>
        <Field label="Primary foreground">
          <input
            type="color"
            value={draft.theme.primaryForeground}
            onChange={(e) => updateTheme('primaryForeground', e.target.value)}
          />
        </Field>
        <Field label="Accent">
          <input
            type="color"
            value={draft.theme.accent}
            onChange={(e) => updateTheme('accent', e.target.value)}
          />
        </Field>
        <Field label="Corner radius">
          <input
            style={inputStyle}
            value={draft.theme.radius}
            onChange={(e) => updateTheme('radius', e.target.value)}
          />
        </Field>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Features</h2>
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
        {saving ? 'Saving…' : 'Save settings'}
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
