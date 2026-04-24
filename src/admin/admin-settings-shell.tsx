'use client';

import { useEffect, type ReactNode } from 'react';
import { useCaspianLink, useCaspianNavigation } from '../provider/caspian-store-provider';
import { useT } from '../i18n/locale-context';
import { cn } from '../utils/cn';
import { SETTINGS_SUB_NAV } from './admin-shell';
import { AdminSiteSettingsPage } from './admin-site-settings-page';
import { AdminShippingPluginsPage } from './admin-shipping-plugins-page';
import { AdminPaymentPluginsPage } from './admin-payment-plugins-page';
import { AdminEmailPluginsPage } from './admin-email-plugins-page';
import { AdminEmailsPage } from './admin-emails-page';
import { AdminLanguagesPage } from './admin-languages-page';

export interface AdminSettingsShellProps {
  className?: string;
}

/**
 * Settings page with an internal sub-sidebar.
 *
 * Reads the current pathname from the framework-agnostic navigation adapter
 * and renders the matching sub-page. Landing on `/admin/settings` (no slug)
 * redirects to `/admin/settings/general` so the URL always names the active
 * panel. The individual page components are unchanged — this shell just wraps
 * them in a two-column layout modeled on AdminAppearancePage. Sidebar visual
 * styling was aligned with AdminAppearancePage's "Categories" menu in v4.1.1.
 */
export function AdminSettingsShell({ className }: AdminSettingsShellProps) {
  const nav = useCaspianNavigation();
  const Link = useCaspianLink();
  const t = useT();

  const slug = deriveSlug(nav.pathname);

  useEffect(() => {
    if (slug === null) {
      nav.replace('/admin/settings/general');
    }
  }, [slug, nav]);

  if (slug === null) return null;

  return (
    <div className={className}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          {t('admin.settings.title')}
        </h1>
        <p style={{ color: '#666', marginTop: 4 }}>{t('admin.settings.subtitle')}</p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px minmax(0, 1fr)',
          gap: 24,
          alignItems: 'start',
        }}
      >
        <aside style={{ position: 'sticky', top: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#999',
              padding: '0 12px 8px',
            }}
          >
            {t('admin.settings.categories')}
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            {SETTINGS_SUB_NAV.map((item) => {
              const active = nav.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn('caspian-admin-nav-item', active && 'is-active')}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: active ? 'rgba(0,0,0,0.06)' : 'transparent',
                      borderRadius: 8,
                      color: active ? '#111' : '#444',
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      textDecoration: 'none',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div>
          <SettingsPanel slug={slug} />
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({ slug }: { slug: SettingsSlug }): ReactNode {
  switch (slug) {
    case 'general':
      return <AdminSiteSettingsPage />;
    case 'shipping':
      return <AdminShippingPluginsPage />;
    case 'payments':
      return <AdminPaymentPluginsPage />;
    case 'email-providers':
      return <AdminEmailPluginsPage />;
    case 'emails':
      return <AdminEmailsPage />;
    case 'languages':
      return <AdminLanguagesPage />;
  }
}

type SettingsSlug = 'general' | 'shipping' | 'payments' | 'email-providers' | 'emails' | 'languages';

const KNOWN_SLUGS: readonly SettingsSlug[] = [
  'general',
  'shipping',
  'payments',
  'email-providers',
  'emails',
  'languages',
];

function deriveSlug(pathname: string): SettingsSlug | null {
  const match = pathname.match(/^\/admin\/settings\/?(.*)$/);
  if (!match) return 'general';
  const rest = match[1].split('/')[0];
  if (!rest) return null;
  return (KNOWN_SLUGS as readonly string[]).includes(rest) ? (rest as SettingsSlug) : 'general';
}
