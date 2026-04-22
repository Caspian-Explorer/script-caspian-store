'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useCaspianLink, useCaspianNavigation } from '../provider/caspian-store-provider';
import {
  DEFAULT_REPO_NAME,
  DEFAULT_REPO_OWNER,
  fetchRecentReleases,
  isUpdateAvailable,
} from '../services/github-updates-service';
import { Badge } from '../ui/misc';
import { cn } from '../utils/cn';
import { CASPIAN_STORE_VERSION } from '../version';

export interface AdminNavItem {
  href: string;
  label: string;
  /** Optional icon — any renderable node. Skip to keep it text-only. */
  icon?: ReactNode;
}

export const DEFAULT_ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/todos', label: 'Todo list' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/collections', label: 'Collections' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/pages', label: 'Pages' },
  { href: '/admin/faqs', label: 'FAQs' },
  { href: '/admin/journal', label: 'Journal' },
  { href: '/admin/promo-codes', label: 'Promo codes' },
  { href: '/admin/subscribers', label: 'Subscribers' },
  { href: '/admin/shipping-plugins', label: 'Shipping' },
  { href: '/admin/payment-plugins', label: 'Payments' },
  { href: '/admin/languages', label: 'Languages' },
  { href: '/admin/appearance', label: 'Appearance' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/about', label: 'About' },
];

export interface AdminShellProps {
  title?: string;
  navItems?: AdminNavItem[];
  /** Extra header content (search box, user menu, etc.). */
  headerRight?: ReactNode;
  /**
   * Show an "Update available" badge next to the title when the installed
   * library version is behind the latest public GitHub release. Default true.
   * Set false to skip the (unauthenticated) GitHub API call.
   */
  checkForUpdates?: boolean;
  /** GitHub owner to check for updates. Default: Caspian-Explorer. */
  updateCheckOwner?: string;
  /** GitHub repo to check for updates. Default: script-caspian-store. */
  updateCheckRepo?: string;
  children: ReactNode;
  className?: string;
}

export function AdminShell({
  title = 'Admin',
  navItems = DEFAULT_ADMIN_NAV,
  headerRight,
  checkForUpdates = true,
  updateCheckOwner = DEFAULT_REPO_OWNER,
  updateCheckRepo = DEFAULT_REPO_NAME,
  children,
  className,
}: AdminShellProps) {
  const Link = useCaspianLink();
  const nav = useCaspianNavigation();

  const isActive = (href: string) =>
    nav.pathname === href || (href !== '/admin' && nav.pathname.startsWith(href));

  return (
    <div className={cn('caspian-admin-shell', className)} style={{ minHeight: '100vh', background: '#fafafa' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          borderBottom: '1px solid #eee',
          background: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin">
            <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {title}
            </span>
          </Link>
          {checkForUpdates && (
            <AdminUpdateBadge owner={updateCheckOwner} repo={updateCheckRepo} />
          )}
        </div>
        <div>{headerRight}</div>
      </header>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 49px)' }}>
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            borderRight: '1px solid #eee',
            padding: 16,
            background: '#fff',
          }}
        >
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {navItems.map((item) => {
              const active = isActive(item.href);
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
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 'var(--caspian-radius, 6px)',
                      background: active ? 'var(--caspian-primary, #111)' : 'transparent',
                      color: active ? 'var(--caspian-primary-foreground, #fff)' : '#444',
                      fontSize: 14,
                      fontWeight: active ? 600 : 400,
                      textDecoration: 'none',
                    }}
                  >
                    {item.icon && <span style={{ display: 'inline-flex' }}>{item.icon}</span>}
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>
        <main style={{ flex: 1, minWidth: 0, padding: 24 }}>{children}</main>
      </div>
    </div>
  );
}

function AdminUpdateBadge({ owner, repo }: { owner: string; repo: string }) {
  const Link = useCaspianLink();
  const [latest, setLatest] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchRecentReleases(owner, repo, 1)
      .then((releases) => {
        if (!alive) return;
        const v = releases[0]?.version;
        if (v) setLatest(v);
      })
      .catch(() => {
        // Silent — badge is a nicety, not a hard requirement.
      });
    return () => {
      alive = false;
    };
  }, [owner, repo]);

  if (!latest || !isUpdateAvailable(CASPIAN_STORE_VERSION, latest)) return null;

  return (
    <Link href="/admin/about">
      <span style={{ textDecoration: 'none' }}>
        <Badge>Update available →</Badge>
      </span>
    </Link>
  );
}
