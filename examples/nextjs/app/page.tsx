'use client';

import { useState } from 'react';
import { ProductListPage, CartSheet, useCart, Button } from '@caspian-explorer/script-caspian-store';

export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const { count } = useCart();

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
          paddingBottom: 16,
          borderBottom: '1px solid #eee',
        }}
      >
        <a href="/" style={{ textDecoration: 'none', color: 'inherit', fontSize: 20, fontWeight: 700 }}>
          Caspian Store
        </a>
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="/settings" style={{ textDecoration: 'none', color: 'inherit', fontSize: 14 }}>
            Settings
          </a>
          <Button variant="outline" onClick={() => setCartOpen(true)}>
            Cart ({count})
          </Button>
        </nav>
      </header>

      <ProductListPage
        title="Shop"
        subtitle="Live-loaded from your Firestore `products` collection."
        getProductHref={(id) => `/product/${id}`}
      />

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </main>
  );
}
