'use client';

import { type ReactNode } from 'react';
import { useCaspianLink, useCaspianNavigation } from '../provider/caspian-store-provider';
import { cn } from '../utils/cn';

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
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/settings', label: 'Settings' },
];

export interface AdminShellProps {
  title?: string;
  navItems?: AdminNavItem[];
  /** Extra header content (search box, user menu, etc.). */
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AdminShell({
  title = 'Admin',
  navItems = DEFAULT_ADMIN_NAV,
  headerRight,
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
        <Link href="/admin">
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {title}
          </span>
        </Link>
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
