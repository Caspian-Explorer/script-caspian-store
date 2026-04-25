'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { getDocs, query, where } from 'firebase/firestore';
import { useCaspianFirebase, useCaspianLink } from '../provider/caspian-store-provider';
import { caspianCollections } from '../firebase/collections';
import { useT } from '../i18n/locale-context';
import { Badge, Skeleton } from '../ui/misc';
import type { ContactSubmission } from '../types';
import {
  countNewContacts,
  listRecentContacts,
} from '../services/contact-service';
import { reportServiceError } from '../services/error-log-service';
import { DashboardTodoSection } from './dashboard-sections/dashboard-todo-section';
import { DashboardNotificationsSection } from './dashboard-sections/dashboard-notifications-section';
import { DashboardSearchTermsSection } from './dashboard-sections/dashboard-search-terms-section';

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
  const t = useT();
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recentContacts, setRecentContacts] = useState<ContactSubmission[] | null>(null);
  const [newContactCount, setNewContactCount] = useState<number>(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const refs = caspianCollections(db);
        const [
          productsSnap,
          ordersSnap,
          pendingReviewsSnap,
          pendingQuestionsSnap,
          contacts,
          newContacts,
        ] = await Promise.all([
          getDocs(refs.products),
          getDocs(refs.orders),
          getDocs(query(refs.reviews, where('status', '==', 'pending'))),
          getDocs(query(refs.questions, where('status', '==', 'pending'))),
          listRecentContacts(db, 5).catch(() => [] as ContactSubmission[]),
          countNewContacts(db).catch(() => 0),
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
        setRecentContacts(contacts);
        setNewContactCount(newContacts);
      } catch (error) {
        reportServiceError(db, 'admin-dashboard.load', error);
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

      <section style={{ marginTop: 32 }}>
        <div style={recentHeaderStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            {t('admin.dashboard.recentContacts')}
          </h2>
          {newContactCount > 0 && (
            <Badge variant="secondary">
              {t('admin.dashboard.recentContactsNewPill', { count: newContactCount })}
            </Badge>
          )}
          <Link href="/admin/users" style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--caspian-primary, #111)' }}>
            {t('admin.dashboard.viewAll')}
          </Link>
        </div>

        {recentContacts === null ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} style={{ height: 54 }} />
            ))}
          </div>
        ) : recentContacts.length === 0 ? (
          <p style={emptyStyle}>{t('admin.dashboard.recentContactsEmpty')}</p>
        ) : (
          <ul style={listStyle}>
            {recentContacts.map((c) => (
              <li key={c.id} style={rowStyle}>
                <Link href="/admin/users" style={rowLinkStyle}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>
                      {c.name}
                      <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 13 }}>
                        {c.email}
                      </span>
                    </div>
                    <p style={snippetStyle}>{c.message}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {c.status === 'new' && <Badge variant="secondary">{t('admin.contacts.status.new')}</Badge>}
                    <span style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
                      {c.createdAt?.toDate ? formatRelative(c.createdAt.toDate()) : ''}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DashboardTodoSection />
      <DashboardNotificationsSection />
      <DashboardSearchTermsSection />
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

function formatRelative(d: Date): string {
  const diff = Date.now() - d.getTime();
  const min = 60 * 1000;
  const hour = 60 * min;
  const day = 24 * hour;
  if (diff < min) return 'just now';
  if (diff < hour) return `${Math.floor(diff / min)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 30 * day) return `${Math.floor(diff / day)}d ago`;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const recentHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 12,
};

const emptyStyle: CSSProperties = {
  color: '#888',
  padding: '20px 0',
  margin: 0,
};

const listStyle: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const rowStyle: CSSProperties = {
  border: '1px solid #eee',
  borderRadius: 'var(--caspian-radius, 8px)',
  background: '#fff',
};

const rowLinkStyle: CSSProperties = {
  display: 'flex',
  gap: 16,
  padding: 12,
  textDecoration: 'none',
  color: 'inherit',
};

const snippetStyle: CSSProperties = {
  margin: '4px 0 0',
  display: '-webkit-box',
  WebkitLineClamp: 1,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  fontSize: 13,
  color: '#666',
};
