'use client';

import { useEffect, useState } from 'react';
import type { Order } from '../types';
import { getOrderById } from '../services/order-service';
import { useCaspianFirebase, useCaspianLink } from '../provider/caspian-store-provider';
import { Skeleton, Separator, Badge } from '../ui/misc';

export interface OrderConfirmationPageProps {
  /**
   * The order ID to look up. In our Cloud Function the order ID equals the
   * Stripe checkout session id, so you can pass `session_id` from the
   * success URL query string directly.
   */
  orderId: string;
  continueHref?: string;
  formatPrice?: (n: number) => string;
  className?: string;
}

export function OrderConfirmationPage({
  orderId,
  continueHref = '/',
  formatPrice = (n) => `$${n.toFixed(2)}`,
  className,
}: OrderConfirmationPageProps) {
  const { db } = useCaspianFirebase();
  const Link = useCaspianLink();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState(0);

  // The webhook creates the order document asynchronously — we may need to
  // poll briefly after returning from Stripe.
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const load = async () => {
      try {
        const o = await getOrderById(db, orderId);
        if (!alive) return;
        if (o) {
          setOrder(o);
          setLoading(false);
        } else if (attempts < 6) {
          setAttempts((n) => n + 1);
          timer = setTimeout(load, 1500);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('[caspian-store] Failed to load order:', error);
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, orderId]);

  if (loading) {
    return (
      <div className={className} style={{ padding: 24 }}>
        <Skeleton style={{ height: 28, width: 240 }} />
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton style={{ height: 14, width: '60%' }} />
          <Skeleton style={{ height: 14, width: '40%' }} />
          <Skeleton style={{ height: 14, width: '50%' }} />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={className} style={{ padding: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>We're still processing your order</h1>
        <p style={{ color: '#666', marginTop: 8 }}>
          This usually takes a few seconds. Please refresh in a moment — you'll also receive a confirmation email.
        </p>
        <p style={{ color: '#888', fontSize: 13, marginTop: 16 }}>Order ID: {orderId}</p>
      </div>
    );
  }

  const placedAt = order.createdAt?.toDate ? order.createdAt.toDate() : null;

  return (
    <div className={className}>
      <header style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Thank you for your order!</h1>
        <p style={{ color: '#666', marginTop: 6 }}>
          A confirmation was sent to {order.userEmail || 'your email'}.
        </p>
        <p style={{ color: '#888', fontSize: 13, marginTop: 12 }}>
          Order #{order.id.slice(0, 10)} · <Badge variant="secondary">{order.status}</Badge>
          {placedAt && ` · ${placedAt.toLocaleDateString()}`}
        </p>
      </header>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Items</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 500 }}>{item.name}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>
                  {item.selectedSize && `Size ${item.selectedSize} · `}Qty {item.quantity}
                </p>
              </div>
              <span style={{ fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <Separator />
        <SummaryRow label="Subtotal" value={formatPrice(order.subtotal)} />
        {order.shippingCost > 0 && (
          <SummaryRow label="Shipping" value={formatPrice(order.shippingCost)} />
        )}
        {order.discount > 0 && (
          <SummaryRow label="Discount" value={`−${formatPrice(order.discount)}`} />
        )}
        <SummaryRow label="Total" value={formatPrice(order.total)} strong />
      </section>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Link href={continueHref}>Continue shopping</Link>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 0',
        fontSize: strong ? 16 : 14,
        fontWeight: strong ? 700 : 400,
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  padding: 20,
  border: '1px solid #eee',
  borderRadius: 'var(--caspian-radius, 8px)',
};
const h2Style: React.CSSProperties = { fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 12 };
