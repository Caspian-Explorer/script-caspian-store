'use client';

import { useAuth } from '../../context/auth-context';
import { useCaspianLink, useCaspianNavigation } from '../../provider/caspian-store-provider';
import { useT } from '../../i18n/locale-context';
import { Button } from '../../ui/button';
import { Avatar } from '../../ui/misc';
import { OrderHistoryList } from '../order-history-list';
import { ProfileCard } from './profile-card';
import { AddressBook } from './address-book';
import { ChangePasswordCard } from './change-password-card';
import { ProfilePhotoCard } from './profile-photo-card';
import { DeleteAccountCard } from './delete-account-card';

export interface AccountPageProps {
  signInHref?: string;
  /** Hide sections you don't want to render. */
  hideOrders?: boolean;
  hideAddresses?: boolean;
  hidePassword?: boolean;
  hidePhoto?: boolean;
  hideDeleteAccount?: boolean;
  className?: string;
}

export function AccountPage({
  signInHref = '/login',
  hideOrders,
  hideAddresses,
  hidePassword,
  hidePhoto,
  hideDeleteAccount,
  className,
}: AccountPageProps) {
  const { user, userProfile, loading, signOut } = useAuth();
  const Link = useCaspianLink();
  const nav = useCaspianNavigation();
  const t = useT();

  if (loading) return <p style={{ padding: 40, color: '#888' }}>{t('common.loading')}</p>;

  if (!user) {
    return (
      <div className={className} style={{ padding: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          {t('account.signInRequired.title')}
        </h1>
        <p style={{ color: '#666', marginTop: 8 }}>{t('account.signInRequired.subtitle')}</p>
        <div style={{ marginTop: 16 }}>
          <Link href={signInHref}>{t('signInGate.signInLink')}</Link>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    nav.push('/');
  };

  const displayedName = userProfile?.displayName || user.email;

  return (
    <div className={className} style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: 24,
          marginBottom: 24,
          borderRadius: 'var(--caspian-radius, 12px)',
          background: 'linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%)',
          border: '1px solid #eee',
        }}
      >
        <Avatar src={userProfile?.photoURL} fallback={displayedName ?? '?'} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{t('account.title')}</h1>
          <p
            style={{
              color: '#666',
              marginTop: 4,
              marginBottom: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {t('account.signedInAs', { name: displayedName ?? '' })}
          </p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          {t('account.signOut')}
        </Button>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!hidePhoto && <ProfilePhotoCard />}
        <ProfileCard />
        {!hideAddresses && <AddressBook />}
        {!hidePassword && <ChangePasswordCard />}
        {!hideOrders && (
          <section style={sectionStyle}>
            <h2 style={h2Style}>{t('account.sections.recentOrders')}</h2>
            <OrderHistoryList />
          </section>
        )}
        {!hideDeleteAccount && <DeleteAccountCard />}
      </div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  padding: 20,
  border: '1px solid #eee',
  borderRadius: 'var(--caspian-radius, 8px)',
  background: '#fff',
};
const h2Style: React.CSSProperties = { fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 12 };
