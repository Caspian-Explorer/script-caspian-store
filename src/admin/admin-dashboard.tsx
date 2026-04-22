'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { useCaspianFirebase, useCaspianLink } from '../provider/caspian-store-provider';
import { Skeleton } from '../ui/misc';

interface Counts {
  products: number;
  orders: number;
  pendingReviews: number;
  pendingQuestions: number;
  revenue: number;
}

export interface AdminDashboardProps {
  formatPrice?: (n: number) => string;
  className?: string;
}

export function AdminDashboard({
  formatPrice = (n) => `$${n.toFixed(2)}`,
  className,
}: AdminDashboardProps) {
  const { db } = useCaspianFirebase();
  const Link = useCaspianLink();
  const [counts, setCounts] = useState<Counts | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [productsSnap, ordersSnap, pendingReviewsSnap, pendingQuestionsSnap] =
          await Promise.all([
            getDocs(collection(db, 'products')),
            getDocs(collection(db, 'orders')),
            getDocs(query(collection(db, 'reviews'), where('status', '==', 'pending'))),
            getDocs(query(collection(db, 'questions'), where('status', '==', 'pending'))),
          ]);
        if (!alive) return;
        const revenue = ordersSnap.docs.reduce((sum, d) => {
          const data = d.data() as { total?: number; status?: string };
          if (data.status === 'paid' || data.status === 'processing' || data.status === 'shipped' || data.status === 'delivered') {
            return sum + (data.total ?? 0);
          }
          return sum;
        }, 0);
        setCounts({
          products: productsSnap.size,
          orders: ordersSnap.size,
          pendingReviews: pendingReviewsSnap.size,
          pendingQuestions: pendingQuestionsSnap.size,
          revenue,
        });
      } catch (error) {
        console.error('[caspian-store] Failed to load dashboard:', error);
      }
    })();
    return () => {
      alive = false;
    };
  }, [db]);

  return (
    <div className={className}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Dashboard</h1>
      <p style={{ color: '#666', marginTop: 4 }}>Quick snapshot of your store.</p>

      <div
        style={{
          marginTop: 24,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
        }}
      >
        <Card label="Products" href="/admin/products" value={counts?.products} loading={!counts} />
        <Card label="Orders" href="/admin/orders" value={counts?.orders} loading={!counts} />
        <Card
          label="Revenue"
          href="/admin/orders"
          value={counts ? formatPrice(counts.revenue) : undefined}
          loading={!counts}
        />
        <Card
          label="Pending reviews"
          href="/admin/reviews"
          value={counts?.pendingReviews}
          loading={!counts}
        />
        <Card
          label="Pending questions"
          href="/admin/reviews"
          value={counts?.pendingQuestions}
          loading={!counts}
        />
      </div>

      <p style={{ marginTop: 32, color: '#888', fontSize: 13 }}>
        Wire the nav above to <Link href="/admin/products">Products</Link>,{' '}
        <Link href="/admin/orders">Orders</Link>, and <Link href="/admin/reviews">Reviews</Link>.
      </p>
    </div>
  );
}

function Card({
  label,
  value,
  href,
  loading,
}: {
  label: string;
  value: ReactNode | undefined;
  href: string;
  loading: boolean;
}) {
  const Link = useCaspianLink();
  return (
    <Link href={href}>
      <div
        style={{
          padding: 20,
          border: '1px solid #eee',
          borderRadius: 'var(--caspian-radius, 8px)',
          background: '#fff',
        }}
      >
        <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888' }}>
          {label}
        </p>
        <div style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 700 }}>
          {loading ? <Skeleton style={{ height: 24, width: 80 }} /> : value}
        </div>
      </div>
    </Link>
  );
}
