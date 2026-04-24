'use client';

import { useCallback } from 'react';
import { useAuth } from '../context/auth-context';
import { useCaspianNavigation } from '../provider/caspian-store-provider';
import { useT } from '../i18n/locale-context';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { LogOutIcon, PackageIcon, SettingsIcon, UserIcon } from '../ui/icons';
import { Avatar } from '../ui/misc';
import { useToast } from '../ui/toast';

export interface StorefrontProfileMenuProps {
  /** Account-page URL. Default: `/account`. */
  accountHref?: string;
  /** Orders section of the account page. Default: `/account?section=orders`. */
  ordersHref?: string;
  /** Admin dashboard URL, shown only to admins. Default: `/admin`. */
  adminHref?: string;
  /** Where to send the user after sign-out. Default: `/`. */
  afterSignOutHref?: string;
  /** Avatar size in px. Default: 36. */
  avatarSize?: number;
  className?: string;
}

/**
 * Header-right dropdown for signed-in storefront visitors: avatar trigger with
 * name/email header, My account / Orders / (Admin, admins only) / Sign out.
 * Mirrors `<AdminProfileMenu>` but tailored to the shopper surface.
 *
 * The header's heart-wishlist icon stays separate and is not surfaced here.
 */
export function StorefrontProfileMenu({
  accountHref = '/account',
  ordersHref = '/account?section=orders',
  adminHref = '/admin',
  afterSignOutHref = '/',
  avatarSize = 36,
  className,
}: StorefrontProfileMenuProps) {
  const { user, userProfile, loading, signOut } = useAuth();
  const nav = useCaspianNavigation();
  const { toast } = useToast();
  const t = useT();

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      nav.push(afterSignOutHref);
    } catch (error) {
      console.error('[caspian-store] Sign-out failed:', error);
      toast({ title: t('account.signOut'), variant: 'destructive' });
    }
  }, [signOut, nav, afterSignOutHref, toast, t]);

  if (loading || !user) return null;

  const displayName =
    userProfile?.displayName || user.displayName || user.email || '';
  const photoURL = userProfile?.photoURL ?? user.photoURL ?? null;
  const fallback = (displayName || 'A').charAt(0);
  const email = user.email ?? '';
  const isAdmin = userProfile?.role === 'admin';

  return (
    <DropdownMenu
      className={className}
      trigger={
        <button
          type="button"
          aria-label={t('account.menu.ariaLabel')}
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            borderRadius: '50%',
            lineHeight: 0,
          }}
        >
          <Avatar src={photoURL} alt={displayName} fallback={fallback} size={avatarSize} />
        </button>
      }
      minWidth={220}
    >
      {displayName && (
        <>
          <div
            style={{
              padding: '8px 10px 4px',
              fontSize: 13,
              color: '#111',
              fontWeight: 600,
              lineHeight: 1.3,
            }}
          >
            {displayName}
          </div>
          {email && (
            <div style={{ padding: '0 10px 8px', fontSize: 12, color: '#666', lineHeight: 1.3 }}>
              {email}
            </div>
          )}
          <DropdownMenuSeparator />
        </>
      )}
      <DropdownMenuItem icon={<UserIcon size={14} />} onSelect={() => nav.push(accountHref)}>
        {t('account.menu.myAccount')}
      </DropdownMenuItem>
      <DropdownMenuItem icon={<PackageIcon size={14} />} onSelect={() => nav.push(ordersHref)}>
        {t('account.menu.orders')}
      </DropdownMenuItem>
      {isAdmin && (
        <DropdownMenuItem icon={<SettingsIcon size={14} />} onSelect={() => nav.push(adminHref)}>
          {t('account.menu.admin')}
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem icon={<LogOutIcon size={14} />} destructive onSelect={handleSignOut}>
        {t('account.signOut')}
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
