'use client';

import { useParams } from 'next/navigation';
import { ProductDetailPage } from '@caspian-explorer/script-caspian-store';

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <ProductDetailPage productId={params.id} />
    </main>
  );
}
