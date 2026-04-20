'use client';

import { useState } from 'react';
import { useCart } from '../context/cart-context';
import { useAuth } from '../context/auth-context';
import { useCaspianLink } from '../provider/caspian-store-provider';
import { useCheckout } from '../hooks/use-checkout';
import { Button } from '../ui/button';
import { Input, Label } from '../ui/input';
import { Separator } from '../ui/misc';

export interface CheckoutPageProps {
  /** Where Stripe returns users after payment. `{CHECKOUT_SESSION_ID}` is appended automatically unless included. */
  successUrl: string;
  /** Where Stripe returns users if they cancel. */
  cancelUrl: string;
  formatPrice?: (n: number) => string;
  className?: string;
}

export function CheckoutPage({
  successUrl,
  cancelUrl,
  formatPrice = (n) => `$${n.toFixed(2)}`,
  className,
}: CheckoutPageProps) {
  const { items, subtotal, count, removeFromCart } = useCart();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { startCheckout, loading, error } = useCheckout();
  const Link = useCaspianLink();

  const [shipping, setShipping] = useState({
    name: userProfile?.displayName ?? '',
    address: '',
    city: '',
    zip: '',
    country: '',
  });

  if (authLoading) {
    return <p style={{ padding: 40, color: '#888' }}>Loading…</p>;
  }

  if (!user) {
    return (
      <div className={className} style={{ padding: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Sign in to check out</h1>
        <p style={{ color: '#666', marginTop: 8 }}>
          You need an account so your order can be tracked.
        </p>
        <div style={{ marginTop: 16 }}>
          <Link href="/login">Sign in</Link>
        </div>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className={className} style={{ padding: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Your cart is empty</h1>
        <div style={{ marginTop: 16 }}>
          <Link href="/">Continue shopping</Link>
        </div>
      </div>
    );
  }

  const handlePay = async () => {
    try {
      await startCheckout({ successUrl, cancelUrl });
    } catch {
      // error state is surfaced via the hook
    }
  };

  return (
    <div className={className}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Checkout</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
          gap: 32,
          marginTop: 24,
        }}
      >
        <div>
          <section style={sectionStyle}>
            <h2 style={h2Style}>Shipping details</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <Label htmlFor="ck-name">Full name</Label>
                <Input
                  id="ck-name"
                  value={shipping.name}
                  onChange={(e) => setShipping((s) => ({ ...s, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="ck-address">Street address</Label>
                <Input
                  id="ck-address"
                  value={shipping.address}
                  onChange={(e) => setShipping((s) => ({ ...s, address: e.target.value }))}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <Label htmlFor="ck-city">City</Label>
                  <Input
                    id="ck-city"
                    value={shipping.city}
                    onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ck-zip">ZIP</Label>
                  <Input
                    id="ck-zip"
                    value={shipping.zip}
                    onChange={(e) => setShipping((s) => ({ ...s, zip: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="ck-country">Country</Label>
                <Input
                  id="ck-country"
                  value={shipping.country}
                  onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value }))}
                />
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#888', marginTop: 12 }}>
              Payment details are collected by Stripe on the next page.
            </p>
          </section>
        </div>

        <aside>
          <section style={sectionStyle}>
            <h2 style={h2Style}>Order summary</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedSize ?? ''}-${item.selectedColor ?? ''}`}
                  style={{ display: 'flex', gap: 12, alignItems: 'center' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{item.product.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>
                      {item.selectedSize && `Size ${item.selectedSize} · `}Qty {item.quantity}
                    </p>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                    aria-label="Remove"
                    style={{
                      background: 'transparent',
                      border: 0,
                      color: '#b91c1c',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <Separator />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginBottom: 16 }}>
              <span>Taxes &amp; shipping</span>
              <span>Calculated at Stripe</span>
            </div>

            <Button size="lg" style={{ width: '100%' }} onClick={handlePay} loading={loading}>
              {loading ? 'Redirecting…' : 'Continue to payment'}
            </Button>
            {error && (
              <p style={{ color: '#b91c1c', fontSize: 13, marginTop: 8 }}>{error}</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

const sectionStyle: React.CSSProperties = {
  padding: 20,
  border: '1px solid #eee',
  borderRadius: 'var(--caspian-radius, 8px)',
  marginBottom: 16,
};
const h2Style: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  margin: 0,
  marginBottom: 12,
};
