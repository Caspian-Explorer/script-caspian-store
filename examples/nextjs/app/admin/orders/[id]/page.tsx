'use client';

import { useParams } from 'next/navigation';
import { AdminOrderDetail } from '@caspian-explorer/script-caspian-store';

export default function AdminOrderRoute() {
  const { id } = useParams<{ id: string }>();
  return <AdminOrderDetail orderId={id} />;
}
