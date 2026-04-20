'use client';

import { useState } from 'react';
import { StarRatingInput, useScriptSettings, useAuth } from '@caspian-explorer/script-caspian-store';

export default function Home() {
  const [rating, setRating] = useState(0);
  const { settings, loading } = useScriptSettings();
  const { user, loading: authLoading } = useAuth();

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 24 }}>
      <h1>Caspian Store — Next.js example</h1>
      <p style={{ color: '#666' }}>
        This page proves the package is installed and the provider is wired up.
      </p>

      <section style={{ marginTop: 32 }}>
        <h2>Script settings</h2>
        {loading ? (
          <p>Loading settings…</p>
        ) : (
          <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 6, fontSize: 12 }}>
            {JSON.stringify({ brand: settings.brandName, theme: settings.theme, features: settings.features }, null, 2)}
          </pre>
        )}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Auth</h2>
        {authLoading ? <p>Checking auth…</p> : <p>Signed in: {user ? user.email : 'no'}</p>}
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>StarRatingInput (ported component)</h2>
        <StarRatingInput value={rating} onChange={setRating} />
        <p style={{ fontSize: 12, color: '#666' }}>Current: {rating}/5</p>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Next steps</h2>
        <ul>
          <li>
            Visit <a href="/settings">/settings</a> to configure script settings (requires admin role).
          </li>
          <li>Deploy Firestore rules from <code>firebase/firestore.rules</code>.</li>
        </ul>
      </section>
    </main>
  );
}
