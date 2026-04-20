'use client';

import { useAuth } from '../../context/auth-context';
import { useCaspianLink, useCaspianNavigation } from '../../provider/caspian-store-provider';
import { Button } from '../../ui/button';
import { OrderHistoryList } from '../order-history-list';
import { ProfileCard } from './profile-card';
import { AddressBook } from './address-book';
import { ChangePasswordCard } from './change-password-card';

export interface AccountPageProps {
  signInHref?: string;
  /** Hide sections you don't want to render. */
  hideOrders?: boolean;
  hideAddresses?: boolean;
  hidePassword?: boolean;
  className?: string;
}

export function AccountPage({
  signInHref = '/login',
  hideOrders,
  hideAddresses,
  hidePassword,
  className,
}: AccountPageProps) {
  const { user, userProfile, loading, signOut } = useAuth();
  const Link = useCaspianLink();
  const nav = useCaspianNavigation();

  if (loading) return <p style={{ padding: 40, color: '#888' }}>Loading…</p>;

  if (!user) {
    return (
      <div className={className} style={{ padding: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Sign in to your account</h1>
        <p style={{ color: '#666', marginTop: 8 }}>Manage orders, addresses, and preferences.</p>
        <div style={{ marginTop: 16 }}>
          <Link href={signInHref}>Sign in</Link>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    nav.push('/');
  };

  return (
    <div className={className}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>My account</h1>
          <p style={{ color: '#666', marginTop: 4 }}>
            Signed in as {userProfile?.displayName || user.email}
          </p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          Sign out
        </Button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <ProfileCard />
        {!hidePassword && <ChangePasswordCard />}
        {!hideAddresses && <AddressBook />}
        {!hideOrders && (
          <section style={sectionStyle}>
            <h2 style={h2Style}>Recent orders</h2>
            <OrderHistoryList />
          </section>
        )}
      </div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  padding: 20,
  border: '1px solid #eee',
  borderRadius: 'var(--caspian-radius, 8px)',
};
const h2Style: React.CSSProperties = { fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 12 };
