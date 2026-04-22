'use client';

import { useState, useEffect } from 'react';
import { useScriptSettings } from '../context/script-settings-context';
import { useAuth } from '../context/auth-context';
import { useT } from '../i18n/locale-context';
import { ThemePresetPicker } from '../theme/theme-preset-picker';
import type { FeatureFlags, FontTokens, HeroTokens, ThemeTokens } from '../types';

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
 * @deprecated Prefer the admin-panel pages: `AdminSiteSettingsPage` for
 * brand/contact/localization and `AdminAppearancePage` for theme. This
 * omnibus page remains exported for back-compat but will be removed in a
 * future major.
 */
export function ScriptSettingsPage({
  className,
  requireAdminRole = true,
}: ScriptSettingsPageProps) {
  const { settings, loading, saving, save } = useScriptSettings();
  const { userProfile, loading: authLoading } = useAuth();
  const t = useT();

  const defaultFonts: FontTokens = settings.fonts ?? {
    body: 'system-ui, sans-serif',
    headline: 'system-ui, sans-serif',
    googleFamilies: [],
  };
  const defaultHero: HeroTokens = settings.hero ?? {
    title: '',
    subtitle: '',
    cta: '',
    ctaHref: '/products',
    imageUrl: '',
  };

  const [draft, setDraft] = useState(() => ({
    brandName: settings.brandName,
    brandDescription: settings.brandDescription,
    defaultCurrency: settings.defaultCurrency,
    defaultLocale: settings.defaultLocale,
    theme: { ...settings.theme },
    fonts: { ...defaultFonts, googleFamilies: defaultFonts.googleFamilies ?? [] },
    hero: { ...defaultHero },
    features: { ...settings.features },
  }));

  // Sync draft when settings change from upstream.
  useEffect(() => {
    setDraft({
      brandName: settings.brandName,
      brandDescription: settings.brandDescription,
      defaultCurrency: settings.defaultCurrency,
      defaultLocale: settings.defaultLocale,
      theme: { ...settings.theme },
      fonts: {
        body: settings.fonts?.body ?? 'system-ui, sans-serif',
        headline: settings.fonts?.headline ?? 'system-ui, sans-serif',
        googleFamilies: settings.fonts?.googleFamilies ?? [],
      },
      hero: {
        title: settings.hero?.title ?? '',
        subtitle: settings.hero?.subtitle ?? '',
        cta: settings.hero?.cta ?? '',
        ctaHref: settings.hero?.ctaHref ?? '/products',
        imageUrl: settings.hero?.imageUrl ?? '',
      },
      features: { ...settings.features },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      theme: draft.theme,
      fonts: {
        body: draft.fonts.body.trim() || 'system-ui, sans-serif',
        headline: draft.fonts.headline.trim() || 'system-ui, sans-serif',
        googleFamilies: (draft.fonts.googleFamilies ?? []).filter((f) => f.trim().length > 0),
      },
      hero: {
        title: draft.hero.title.trim(),
        subtitle: draft.hero.subtitle.trim(),
        cta: draft.hero.cta.trim(),
        ctaHref: (draft.hero.ctaHref ?? '').trim() || '/products',
        imageUrl: draft.hero.imageUrl?.trim() || undefined,
      },
      features: draft.features,
    });
  };

  const updateTheme = <K extends keyof ThemeTokens>(key: K, value: ThemeTokens[K]) => {
    setDraft((d) => ({ ...d, theme: { ...d.theme, [key]: value } }));
  };

  const updateFonts = <K extends keyof FontTokens>(key: K, value: FontTokens[K]) => {
    setDraft((d) => ({ ...d, fonts: { ...d.fonts, [key]: value } }));
  };

  const updateHero = <K extends keyof HeroTokens>(key: K, value: HeroTokens[K]) => {
    setDraft((d) => ({ ...d, hero: { ...d.hero, [key]: value } }));
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
        <h2 style={h2Style}>{t('settings.sections.fonts')}</h2>
        <Field label={t('settings.fonts.body')}>
          <input
            style={inputStyle}
            value={draft.fonts.body}
            onChange={(e) => updateFonts('body', e.target.value)}
            placeholder="Lato, sans-serif"
          />
        </Field>
        <Field label={t('settings.fonts.headline')}>
          <input
            style={inputStyle}
            value={draft.fonts.headline}
            onChange={(e) => updateFonts('headline', e.target.value)}
            placeholder="Montserrat, sans-serif"
          />
        </Field>
        <Field label={t('settings.fonts.googleFamilies')}>
          <input
            style={inputStyle}
            value={(draft.fonts.googleFamilies ?? []).join(', ')}
            onChange={(e) =>
              updateFonts(
                'googleFamilies',
                e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            placeholder="Montserrat:wght@400;700, Lato:wght@400;700"
          />
        </Field>
        <p style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
          {t('settings.fonts.hint')}
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>{t('settings.sections.hero')}</h2>
        <Field label={t('settings.hero.title')}>
          <input
            style={inputStyle}
            value={draft.hero.title}
            onChange={(e) => updateHero('title', e.target.value)}
          />
        </Field>
        <Field label={t('settings.hero.subtitle')}>
          <input
            style={inputStyle}
            value={draft.hero.subtitle}
            onChange={(e) => updateHero('subtitle', e.target.value)}
          />
        </Field>
        <Field label={t('settings.hero.cta')}>
          <input
            style={inputStyle}
            value={draft.hero.cta}
            onChange={(e) => updateHero('cta', e.target.value)}
          />
        </Field>
        <Field label={t('settings.hero.ctaHref')}>
          <input
            style={inputStyle}
            value={draft.hero.ctaHref ?? '/products'}
            onChange={(e) => updateHero('ctaHref', e.target.value)}
            placeholder="/products"
          />
        </Field>
        <Field label={t('settings.hero.imageUrl')}>
          <input
            style={inputStyle}
            value={draft.hero.imageUrl ?? ''}
            onChange={(e) => updateHero('imageUrl', e.target.value)}
            placeholder="https://…"
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
