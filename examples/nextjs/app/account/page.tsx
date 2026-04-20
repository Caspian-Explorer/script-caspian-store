'use client';

import { useAuth, OrderHistoryList } from '@caspian-explorer/script-caspian-store';

export default function Account() {
  const { user, userProfile } = useAuth();
  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 24 }}>
      <h1>My account</h1>
      {user ? (
        <>
          <p style={{ color: '#666' }}>Signed in as {userProfile?.displayName || user.email}</p>
          <section style={{ marginTop: 32 }}>
            <h2>Order history</h2>
            <OrderHistoryList />
          </section>
        </>
      ) : (
        <p>Please sign in to view your account.</p>
      )}
    </main>
  );
}
