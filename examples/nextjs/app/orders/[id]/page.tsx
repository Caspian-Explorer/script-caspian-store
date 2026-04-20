'use client';

import { useParams } from 'next/navigation';
import { OrderConfirmationPage } from '@caspian-explorer/script-caspian-store';

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 24 }}>
      <OrderConfirmationPage orderId={id} />
    </main>
  );
}
