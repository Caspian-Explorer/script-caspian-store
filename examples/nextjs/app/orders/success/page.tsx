'use client';

import { useSearchParams } from 'next/navigation';
import { OrderConfirmationPage } from '@caspian-explorer/script-caspian-store';

export default function OrderSuccess() {
  const params = useSearchParams();
  const sessionId = params.get('session_id');

  if (!sessionId) {
    return (
      <main style={{ maxWidth: 720, margin: '40px auto', padding: 24, textAlign: 'center' }}>
        <h1>Missing session ID</h1>
        <p style={{ color: '#666' }}>We couldn't find your order reference. Please check your email.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 24 }}>
      <OrderConfirmationPage orderId={sessionId} />
    </main>
  );
}
