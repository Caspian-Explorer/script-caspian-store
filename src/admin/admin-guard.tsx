'use client';

import { useState, type ReactNode } from 'react';
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
    return <AccessDenied uid={user.uid} />;
  }

  return <>{children}</>;
}

function AccessDenied({ uid }: { uid: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(uid).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div style={{ padding: 40, textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Access denied</h1>
      <p style={{ color: '#666', marginTop: 8 }}>
        Your account doesn't have the admin role. To grant yourself admin,
        either set <code>users/{'{uid}'}.role = 'admin'</code> in Firestore
        directly, or re-run the seed script with <code>--admin &lt;uid&gt;</code>.
      </p>
      <div
        style={{
          marginTop: 16,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          border: '1px solid #ddd',
          borderRadius: 6,
          background: '#f7f7f7',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 13,
        }}
      >
        <span>{uid}</span>
        <button
          type="button"
          onClick={copy}
          style={{
            padding: '4px 10px',
            border: '1px solid #ccc',
            borderRadius: 4,
            background: copied ? '#e6f4ea' : '#fff',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          {copied ? 'Copied' : 'Copy UID'}
        </button>
      </div>
    </div>
  );
}
