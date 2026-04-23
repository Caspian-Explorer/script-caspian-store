'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useCaspianLink, useCaspianNavigation } from '../provider/caspian-store-provider';
import {
  DEFAULT_REPO_NAME,
  DEFAULT_REPO_OWNER,
  fetchRecentReleases,
  isUpdateAvailable,
} from '../services/github-updates-service';
import { MenuIcon } from '../ui/icons';
import { Badge } from '../ui/misc';
import { cn } from '../utils/cn';
import { CASPIAN_STORE_VERSION } from '../version';
import { AdminNotificationsBell } from './admin-notifications-bell';
import { AdminOnboardingProgress } from './admin-onboarding-progress';

export interface AdminNavItem {
  href: string;
  label: string;
  /** Optional icon — any renderable node. Skip to keep it text-only. */
  icon?: ReactNode;
}

export const DEFAULT_ADMIN_NAV: AdminNavItem[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/todos', label: 'Todo list' },
  { href: '/admin/notifications', label: 'Notifications' },
  { href: '/admin/users', label: 'Users' },
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
  { href: '/admin/search-terms', label: 'Search terms' },
  { href: '/admin/shipping-plugins', label: 'Shipping' },
  { href: '/admin/payment-plugins', label: 'Payments' },
  { href: '/admin/emails', label: 'Emails' },
  { href: '/admin/languages', label: 'Languages' },
  { href: '/admin/appearance', label: 'Appearance' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/about', label: 'About' },
];

export interface AdminShellProps {
  title?: string;
  navItems?: AdminNavItem[];
  /** Extra header content (search box, user menu, etc.). Placed at the far right. */
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
  /**
   * Show the notifications bell in the header. Default true. Hide if the
   * consumer wants a custom bell in `headerRight`.
   */
  showNotificationsBell?: boolean;
  /** Where the bell's "View all" link points. Default `/admin/notifications`. */
  notificationsHref?: string;
  /**
   * Show the onboarding progress ring (seeded first-run todos) in the header.
   * Auto-hides at 100% completion. Default true. Added in v2.7.
   */
  showOnboardingProgress?: boolean;
  /**
   * Optional content slot rendered in the header between the onboarding ring
   * and the notifications bell — typically a help dropdown with docs/support
   * links. Added in v2.7.
   */
  headerHelp?: ReactNode;
  /** Initial sidebar state when no saved preference exists. Default true (open). */
  defaultSidebarOpen?: boolean;
  children: ReactNode;
  className?: string;
}

const SIDEBAR_STATE_KEY = 'caspian:admin:sidebarOpen';

export function AdminShell({
  title = 'Admin',
  navItems = DEFAULT_ADMIN_NAV,
  headerRight,
  checkForUpdates = true,
  updateCheckOwner = DEFAULT_REPO_OWNER,
  updateCheckRepo = DEFAULT_REPO_NAME,
  showNotificationsBell = true,
  notificationsHref = '/admin/notifications',
  showOnboardingProgress = true,
  headerHelp,
  defaultSidebarOpen = true,
  children,
  className,
}: AdminShellProps) {
  const Link = useCaspianLink();
  const nav = useCaspianNavigation();
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(SIDEBAR_STATE_KEY);
      if (saved === 'open') setSidebarOpen(true);
      else if (saved === 'closed') setSidebarOpen(false);
    } catch {
      /* no-op */
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_STATE_KEY, next ? 'open' : 'closed');
      } catch {
        /* no-op */
      }
      return next;
    });
  };

  const isActive = (href: string) =>
    nav.pathname === href || (href !== '/admin' && nav.pathname.startsWith(href));

  return (
    <div
      className={cn('caspian-admin-shell', className)}
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#fafafa',
      }}
    >
      {sidebarOpen && (
        <aside
          style={{
            width: 220,
            flexShrink: 0,
            borderRight: '1px solid #eee',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #eee',
            }}
          >
            <Link href="/admin">
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {title}
              </span>
            </Link>
          </div>
          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              padding: 12,
              flex: 1,
            }}
          >
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
      )}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 24px',
            borderBottom: '1px solid #eee',
            background: '#fff',
            gap: 12,
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              aria-pressed={sidebarOpen}
              style={{
                width: 36,
                height: 36,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(0,0,0,0.1)',
                background: '#fff',
                borderRadius: 'var(--caspian-radius, 8px)',
                cursor: 'pointer',
                color: '#444',
                flexShrink: 0,
              }}
            >
              <MenuIcon size={18} />
            </button>
            {!sidebarOpen && (
              <Link href="/admin">
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {title}
                </span>
              </Link>
            )}
            {checkForUpdates && (
              <AdminUpdateBadge owner={updateCheckOwner} repo={updateCheckRepo} />
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {showOnboardingProgress && <AdminOnboardingProgress />}
            {headerHelp}
            {showNotificationsBell && (
              <AdminNotificationsBell
                viewAllHref={notificationsHref}
                updateCheckOwner={updateCheckOwner}
                updateCheckRepo={updateCheckRepo}
                checkForUpdates={checkForUpdates}
              />
            )}
            {headerRight}
          </div>
        </header>

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
