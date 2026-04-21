'use client';

import type { ReactNode } from 'react';
import { useCaspianNavigation } from '../provider/caspian-store-provider';
import { SiteHeader, type SiteHeaderProps } from './site-header';
import { SiteFooter, type SiteFooterProps } from './site-footer';

export interface LayoutShellProps {
  children: ReactNode;
  /** Path prefixes that should bypass the header + footer chrome (e.g. admin / auth flows). Default: `['/admin']`. */
  bypassPrefixes?: string[];
  /** Pass-through to <SiteHeader>. Set to `null` to disable. */
  header?: SiteHeaderProps | null;
  /** Pass-through to <SiteFooter>. Set to `null` to disable. */
  footer?: SiteFooterProps | null;
  /** Override pathname detection (mostly for tests). Defaults to the navigation adapter. */
  pathname?: string;
}

/**
 * Wraps children in <SiteHeader> + <SiteFooter>, except on routes whose pathname
 * begins with one of `bypassPrefixes` (default `/admin`). Locale prefixes
 * (`/en`, `/ar`, etc.) are stripped before the prefix match so a path like
 * `/en/admin/products` is correctly recognized as an admin route.
 */
export function LayoutShell({
  children,
  bypassPrefixes = ['/admin'],
  header,
  footer,
  pathname: pathnameOverride,
}: LayoutShellProps) {
  const nav = useCaspianNavigation();
  const pathname = pathnameOverride ?? nav.pathname;
  const stripped = stripLocalePrefix(pathname);
  const bypass = bypassPrefixes.some((p) => stripped.startsWith(p));

  if (bypass) return <>{children}</>;

  return (
    <>
      {header !== null && <SiteHeader {...(header ?? {})} />}
      {children}
      {footer !== null && <SiteFooter {...(footer ?? {})} />}
    </>
  );
}

function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/i);
  if (!match) return pathname;
  return pathname.slice(match[1].length + 1) || '/';
}
