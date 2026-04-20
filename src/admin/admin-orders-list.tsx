'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Order, OrderStatus } from '../types';
import { listAllOrders } from '../services/order-service';
import { useCaspianFirebase, useCaspianLink } from '../provider/caspian-store-provider';
import { Badge, Skeleton } from '../ui/misc';
import { Select } from '../ui/select';
import { Table, TBody, TD, TH, THead, TR } from '../ui/table';
import { useToast } from '../ui/toast';

export interface AdminOrdersListProps {
  getOrderHref?: (orderId: string) => string;
  formatPrice?: (n: number) => string;
  className?: string;
}

const STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export function AdminOrdersList({
  getOrderHref = (id) => `/admin/orders/${id}`,
  formatPrice = (n) => `$${n.toFixed(2)}`,
  className,
}: AdminOrdersListProps) {
  const { db } = useCaspianFirebase();
  const Link = useCaspianLink();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await listAllOrders(db);
        if (alive) setOrders(data);
      } catch (error) {
        console.error('[caspian-store] Failed to load orders:', error);
        toast({ title: 'Failed to load orders', variant: 'destructive' });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [db, toast]);

  const filtered = useMemo(
    () => (statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter)),
    [orders, statusFilter],
  );

  return (
    <div className={className}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Orders</h1>
        <p style={{ color: '#666', marginTop: 4 }}>{orders.length} total</p>
      </header>

      <div style={{ marginBottom: 12 }}>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | OrderStatus)}
          options={[
            { value: 'all', label: 'All statuses' },
            ...STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
          ]}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton style={{ height: 40 }} />
          <Skeleton style={{ height: 40 }} />
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#888', padding: 32, textAlign: 'center' }}>No orders match the current filter.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Order</TH>
              <TH>Customer</TH>
              <TH>Date</TH>
              <TH>Items</TH>
              <TH>Total</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((o) => {
              const placed = o.createdAt?.toDate ? o.createdAt.toDate() : null;
              const count = o.items.reduce((n, i) => n + i.quantity, 0);
              return (
                <TR key={o.id}>
                  <TD>
                    <Link href={getOrderHref(o.id)}>
                      <span style={{ fontWeight: 500 }}>#{o.id.slice(0, 10)}</span>
                    </Link>
                  </TD>
                  <TD style={{ color: '#666' }}>{o.userEmail || '—'}</TD>
                  <TD style={{ color: '#888', fontSize: 13 }}>{placed?.toLocaleDateString() ?? '—'}</TD>
                  <TD>{count}</TD>
                  <TD>{formatPrice(o.total)}</TD>
                  <TD>
                    <Badge variant="secondary">{o.status}</Badge>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
