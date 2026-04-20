'use client';

import { type ReactNode } from 'react';
import { useAuth } from '../context/auth-context';
import { useCaspianLink } from '../provider/caspian-store-provider';
import { Skeleton } from '../ui/misc';

export interface AdminGuardProps {
  children: ReactNode;
  /** Where to send non-admins. */
  signInHref?: string;
  /** Override the default "access denied" / "sign in" UI. */
  fallback?: ReactNode;
}

/**
 * Gate for any admin surface — blocks render unless userProfile.role === 'admin'.
 * Consumers wrap `<AdminShell>` / admin pages in this.
 */
export function AdminGuard({ children, signInHref = '/login', fallback }: AdminGuardProps) {
  const { user, userProfile, loading } = useAuth();
  const Link = useCaspianLink();

  if (loading) {
    return (
      <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skeleton style={{ height: 24, width: 200 }} />
        <Skeleton style={{ height: 14, width: 320 }} />
      </div>
    );
  }

  if (!user) {
    if (fallback) return <>{fallback}</>;
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Sign in required</h1>
        <p style={{ color: '#666', marginTop: 8 }}>Admin pages require an authenticated account.</p>
        <div style={{ marginTop: 16 }}>
          <Link href={signInHref}>Sign in</Link>
        </div>
      </div>
    );
  }

  if (userProfile?.role !== 'admin') {
    if (fallback) return <>{fallback}</>;
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Access denied</h1>
        <p style={{ color: '#666', marginTop: 8 }}>
          Your account doesn't have the admin role. Ask an existing admin to promote your user.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
