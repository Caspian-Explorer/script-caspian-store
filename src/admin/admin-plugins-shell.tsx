'use client';

import { useEffect, type ReactNode } from 'react';
import { useCaspianLink, useCaspianNavigation } from '../provider/caspian-store-provider';
import { useT } from '../i18n/locale-context';
import { cn } from '../utils/cn';
import { PLUGINS_SUB_NAV } from './admin-shell';
import { AdminShippingPluginsPage } from './admin-shipping-plugins-page';
import { AdminPaymentPluginsPage } from './admin-payment-plugins-page';
import { AdminEmailPluginsPage } from './admin-email-plugins-page';

export interface AdminPluginsShellProps {
  className?: string;
}

/**
 * Plugins page with an internal sub-sidebar. Mirrors AdminSettingsShell —
 * see that file for the shape. Plugins were split out from Settings in v5.0.0
 * (mod1197) so pluggable providers (shipping / payment / email) get a
 * first-class area instead of hiding inside store configuration.
 */
export function AdminPluginsShell({ className }: AdminPluginsShellProps) {
  const nav = useCaspianNavigation();
  const Link = useCaspianLink();
  const t = useT();

  const slug = deriveSlug(nav.pathname);

  useEffect(() => {
    if (slug === null) {
      nav.replace('/admin/plugins/shipping');
    }
  }, [slug, nav]);

  if (slug === null) return null;

  return (
    <div className={className}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          {t('admin.plugins.title')}
        </h1>
        <p style={{ color: '#666', marginTop: 4 }}>{t('admin.plugins.subtitle')}</p>
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
            {t('admin.plugins.categories')}
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            {PLUGINS_SUB_NAV.map((item) => {
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
          <PluginsPanel slug={slug} />
        </div>
      </div>
    </div>
  );
}

function PluginsPanel({ slug }: { slug: PluginsSlug }): ReactNode {
  switch (slug) {
    case 'shipping':
      return <AdminShippingPluginsPage />;
    case 'payments':
      return <AdminPaymentPluginsPage />;
    case 'email-providers':
      return <AdminEmailPluginsPage />;
  }
}

type PluginsSlug = 'shipping' | 'payments' | 'email-providers';

const KNOWN_SLUGS: readonly PluginsSlug[] = ['shipping', 'payments', 'email-providers'];

function deriveSlug(pathname: string): PluginsSlug | null {
  const match = pathname.match(/^\/admin\/plugins\/?(.*)$/);
  if (!match) return 'shipping';
  const rest = match[1].split('/')[0];
  if (!rest) return null;
  return (KNOWN_SLUGS as readonly string[]).includes(rest) ? (rest as PluginsSlug) : 'shipping';
}
