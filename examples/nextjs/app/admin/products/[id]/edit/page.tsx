'use client';

import { useParams } from 'next/navigation';
import { AdminProductEditor } from '@caspian-explorer/script-caspian-store';

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  return <AdminProductEditor productId={id} />;
}
