'use client';

import type { SiteSettings } from '../types';

export interface ComingSoonSplashProps {
  settings: Pick<SiteSettings, 'brandName' | 'brandDescription' | 'logoUrl' | 'comingSoon'>;
}

/**
 * Fullscreen "launching soon" splash rendered by `<LayoutShell>` when
 * `SiteSettings.comingSoon.enabled` is true and the current route is not
 * admin / preview. Kept intentionally minimal: brand mark, message, and a
 * quiet footer — merchants who want richer splashes can replace the storefront
 * root with their own layout.
 */
export function ComingSoonSplash({ settings }: ComingSoonSplashProps) {
  const message =
    settings.comingSoon?.message?.trim() ||
    `We're launching soon. Check back shortly.`;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--caspian-bg, #fafafa)',
        color: 'var(--caspian-fg, #111)',
        textAlign: 'center',
        gap: 24,
      }}
      role="main"
      aria-label="Coming soon"
    >
      {settings.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={settings.logoUrl}
          alt={settings.brandName || 'Logo'}
          style={{ maxHeight: 64, maxWidth: 280, objectFit: 'contain' }}
        />
      )}
      {!settings.logoUrl && settings.brandName && (
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
          {settings.brandName}
        </h1>
      )}
      <p
        style={{
          fontSize: 18,
          lineHeight: 1.5,
          margin: 0,
          maxWidth: 540,
          color: 'rgba(0,0,0,0.72)',
          whiteSpace: 'pre-wrap',
        }}
      >
        {message}
      </p>
      {settings.brandDescription && (
        <p
          style={{
            fontSize: 14,
            color: 'rgba(0,0,0,0.5)',
            margin: 0,
            maxWidth: 480,
          }}
        >
          {settings.brandDescription}
        </p>
      )}
    </div>
  );
}
