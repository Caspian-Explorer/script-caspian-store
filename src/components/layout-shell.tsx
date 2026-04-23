'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { SiteSettings } from '../types';
import { useCaspianFirebase, useCaspianNavigation } from '../provider/caspian-store-provider';
import { getSiteSettings } from '../services/site-settings-service';
import { SiteHeader, type SiteHeaderProps } from './site-header';
import { SiteFooter, type SiteFooterProps } from './site-footer';
import { ComingSoonSplash } from './coming-soon-splash';

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
  /**
   * Query-string key used to bypass Coming Soon mode for a preview session
   * (e.g. `?caspian-preview=1`). When `SiteSettings.comingSoon.allowAdminPreview`
   * is false, the key is ignored. Default: `caspian-preview`. Added in v2.7.
   */
  previewQueryKey?: string;
}

const PREVIEW_STORAGE_KEY = 'caspian:coming-soon-preview';

/**
 * Wraps children in <SiteHeader> + <SiteFooter>, except on routes whose pathname
 * begins with one of `bypassPrefixes` (default `/admin`). Locale prefixes
 * (`/en`, `/ar`, etc.) are stripped before the prefix match so a path like
 * `/en/admin/products` is correctly recognized as an admin route.
 *
 * When `SiteSettings.comingSoon.enabled` is true and the visitor is not on a
 * bypass route or preview session, the children are replaced by a branded
 * splash (`<ComingSoonSplash>`). Added in v2.7.
 */
export function LayoutShell({
  children,
  bypassPrefixes = ['/admin'],
  header,
  footer,
  pathname: pathnameOverride,
  previewQueryKey = 'caspian-preview',
}: LayoutShellProps) {
  const { db } = useCaspianFirebase();
  const nav = useCaspianNavigation();
  const pathname = pathnameOverride ?? nav.pathname;
  const stripped = stripLocalePrefix(pathname);
  const bypass = bypassPrefixes.some((p) => stripped.startsWith(p));

  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    if (bypass) return undefined;
    let alive = true;
    getSiteSettings(db)
      .then((s) => {
        if (alive) setSettings(s);
      })
      .catch((err) => {
        console.warn('[caspian-store] LayoutShell site-settings fetch failed:', err);
        if (alive) setSettings(null);
      });
    return () => {
      alive = false;
    };
  }, [db, bypass]);

  if (bypass) return <>{children}</>;

  if (settings?.comingSoon?.enabled && !isPreviewSession(previewQueryKey, settings)) {
    return <ComingSoonSplash settings={settings} />;
  }

  return (
    <>
      {header !== null && <SiteHeader {...(header ?? {})} />}
      {children}
      {footer !== null && <SiteFooter {...(footer ?? {})} />}
    </>
  );
}

/**
 * A preview session is granted when the page was loaded with
 * `?caspian-preview=1` (or the configured key) — we persist the flag to
 * sessionStorage so subsequent navigations inside the SPA keep the bypass.
 * When `allowAdminPreview` is false, the key is ignored.
 */
function isPreviewSession(queryKey: string, settings: SiteSettings): boolean {
  if (settings.comingSoon?.allowAdminPreview === false) return false;
  if (typeof window === 'undefined') return false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get(queryKey)) {
      window.sessionStorage.setItem(PREVIEW_STORAGE_KEY, '1');
      return true;
    }
    return window.sessionStorage.getItem(PREVIEW_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function stripLocalePrefix(pathname: string): string {
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/i);
  if (!match) return pathname;
  return pathname.slice(match[1].length + 1) || '/';
}
