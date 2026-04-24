'use client';

import { useEffect, useMemo, useState } from 'react';
import { useScriptSettings } from '../context/script-settings-context';
import { useT } from '../i18n/locale-context';
import { findCatalogTheme, THEME_CATALOG, type CatalogTheme } from '../theme/catalog';
import { DEMO_BRAND, DEMO_HERO, DEMO_NAV, DEMO_PRODUCTS } from '../theme/preview-demo-data';

export interface AdminAppearancePreviewPageProps {
  className?: string;
}

/**
 * Full-page theme preview, opened in a popup window from
 * `<AdminAppearancePage>`. Reads `?theme=<id>` from the URL, applies that
 * theme's tokens to a scoped wrapper, and renders a dummy-data storefront
 * mockup — so an admin can eyeball a theme without seeding real products.
 * Apply writes the tokens to `scriptSettings/site.theme` and closes the
 * popup; Close just dismisses the window.
 *
 * Mount it at `/admin-preview/appearance` (the default `previewPath` in
 * `<AdminAppearancePage>`). The route lives outside `/admin/**` on purpose:
 * a route inside `app/admin/` inherits the admin layout (`AdminGuard` +
 * `AdminShell`), which wraps the popup in a sidebar and topbar instead of
 * showing a clean storefront mockup.
 */
export function AdminAppearancePreviewPage({ className }: AdminAppearancePreviewPageProps) {
  const { save, saving } = useScriptSettings();
  const t = useT();
  const [themeId, setThemeId] = useState<string>('');
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setThemeId(params.get('theme') ?? THEME_CATALOG[0]!.id);
  }, []);

  const theme: CatalogTheme = useMemo(
    () => findCatalogTheme(themeId) ?? THEME_CATALOG[0]!,
    [themeId],
  );

  const wrapperStyle: React.CSSProperties = {
    ['--caspian-primary' as string]: theme.tokens.primary,
    ['--caspian-primary-foreground' as string]: theme.tokens.primaryForeground,
    ['--caspian-accent' as string]: theme.tokens.accent,
    ['--caspian-radius' as string]: theme.tokens.radius,
    ...(theme.fontFamily
      ? { ['--caspian-font-family' as string]: theme.fontFamily }
      : {}),
    minHeight: '100vh',
    background: '#fff',
    color: theme.tokens.primary,
    fontFamily: theme.fontFamily ?? 'system-ui, -apple-system, sans-serif',
  };

  const handleApply = async () => {
    try {
      await save({ theme: theme.tokens });
      setApplied(true);
      setTimeout(() => {
        if (typeof window !== 'undefined') window.close();
      }, 900);
    } catch (error) {
      console.error('[caspian-store] Failed to apply preview theme:', error);
    }
  };

  const handleClose = () => {
    if (typeof window !== 'undefined') window.close();
  };

  return (
    <div className={className} style={wrapperStyle}>
      <PreviewBanner
        themeName={theme.name}
        applied={applied}
        saving={saving}
        onApply={handleApply}
        onClose={handleClose}
        t={t}
      />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <DemoHeader />
        <DemoHero theme={theme} />
        <DemoProductGrid />
        <DemoFooter />
      </div>
    </div>
  );
}

interface PreviewBannerProps {
  themeName: string;
  applied: boolean;
  saving: boolean;
  onApply: () => void;
  onClose: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

function PreviewBanner({ themeName, applied, saving, onApply, onClose, t }: PreviewBannerProps) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#111',
        color: '#fff',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        <span
          style={{
            background: '#fbbf24',
            color: '#111',
            padding: '2px 8px',
            borderRadius: 4,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {t('admin.appearance.preview.badge')}
        </span>
        <span style={{ fontSize: 14 }}>
          {t('admin.appearance.preview.previewing', { name: themeName })}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          onClick={onClose}
          style={{
            padding: '8px 14px',
            background: 'transparent',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 6,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          {t('admin.appearance.preview.close')}
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={saving || applied}
          style={{
            padding: '8px 14px',
            background: applied ? '#10b981' : '#fff',
            color: applied ? '#fff' : '#111',
            border: 0,
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            cursor: saving || applied ? 'wait' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {applied
            ? t('admin.appearance.preview.applied')
            : saving
              ? t('admin.appearance.preview.applying')
              : t('admin.appearance.preview.apply')}
        </button>
      </div>
    </div>
  );
}

function DemoHeader() {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 0',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.02em' }}>{DEMO_BRAND}</div>
      <nav style={{ display: 'flex', gap: 28 }}>
        {DEMO_NAV.map((item) => (
          <span key={item} style={{ fontSize: 14, cursor: 'default' }}>
            {item}
          </span>
        ))}
      </nav>
      <button
        type="button"
        style={{
          background: 'var(--caspian-primary)',
          color: 'var(--caspian-primary-foreground)',
          padding: '8px 16px',
          borderRadius: 'var(--caspian-radius)',
          border: 0,
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Cart (2)
      </button>
    </header>
  );
}

function DemoHero({ theme }: { theme: CatalogTheme }) {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 48,
        alignItems: 'center',
        padding: '80px 0',
      }}
    >
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--caspian-accent)',
            marginBottom: 16,
          }}
        >
          {DEMO_HERO.eyebrow}
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 700, margin: 0, lineHeight: 1.05, letterSpacing: '-0.02em' }}>
          {DEMO_HERO.title}
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.55, marginTop: 20, opacity: 0.75 }}>
          {DEMO_HERO.subtitle}
        </p>
        <button
          type="button"
          style={{
            marginTop: 28,
            padding: '14px 28px',
            background: 'var(--caspian-primary)',
            color: 'var(--caspian-primary-foreground)',
            border: 0,
            borderRadius: 'var(--caspian-radius)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {DEMO_HERO.cta}
        </button>
      </div>
      <div
        style={{
          aspectRatio: '4 / 5',
          background: theme.thumbnail.accent,
          borderRadius: 'var(--caspian-radius)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            fontSize: 48,
            fontWeight: 700,
            color: theme.thumbnail.foreground,
            opacity: 0.25,
          }}
        >
          {theme.thumbnail.wordmark}
        </div>
      </div>
    </section>
  );
}

function DemoProductGrid() {
  return (
    <section style={{ padding: '0 0 80px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>New arrivals</h2>
        <span style={{ fontSize: 13, color: 'var(--caspian-accent)' }}>View all →</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {DEMO_PRODUCTS.map((p) => (
          <article key={p.id} style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                aspectRatio: '4 / 5',
                background: p.swatch,
                borderRadius: 'var(--caspian-radius)',
                position: 'relative',
                marginBottom: 12,
              }}
            >
              {p.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'var(--caspian-accent)',
                    color: '#fff',
                    padding: '3px 10px',
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  {p.badge}
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {p.brand}
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, marginTop: 2 }}>{p.name}</div>
            <div style={{ fontSize: 14, marginTop: 4, opacity: 0.8 }}>{p.price}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DemoFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(0,0,0,0.08)',
        padding: '40px 0 60px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 12,
        opacity: 0.6,
      }}
    >
      <span>
        © {new Date().getFullYear()} {DEMO_BRAND}
      </span>
      <span>Preview · dummy data · not your live store</span>
    </footer>
  );
}
