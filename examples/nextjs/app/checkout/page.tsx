'use client';

import { CheckoutPage } from '@caspian-explorer/script-caspian-store';

export default function CheckoutRoute() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <CheckoutPage
        successUrl={`${origin}/orders/success`}
        cancelUrl={`${origin}/checkout`}
      />
    </main>
  );
}
