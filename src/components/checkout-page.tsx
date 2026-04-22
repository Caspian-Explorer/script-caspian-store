'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCart } from '../context/cart-context';
import { useAuth } from '../context/auth-context';
import { useCaspianFirebase, useCaspianLink } from '../provider/caspian-store-provider';
import { useCheckout } from '../hooks/use-checkout';
import { useT } from '../i18n/locale-context';
import { calculateShippingRates } from '../services/shipping-calculator';
import type { ShippingRate } from '../shipping/types';
import { Button } from '../ui/button';
import { Input, Label } from '../ui/input';
import { Separator } from '../ui/misc';
import { ShippingRatePicker } from './checkout/shipping-rate-picker';

export interface CheckoutPageProps {
  /** Where the payment provider returns users after successful payment. `{CHECKOUT_SESSION_ID}` is appended automatically unless included. */
  successUrl: string;
  /** Where the payment provider returns users if they cancel. */
  cancelUrl: string;
  formatPrice?: (n: number) => string;
  /** Currency code passed to shipping plugins when computing rates. Default: `USD`. */
  currency?: string;
  className?: string;
}

export function CheckoutPage({
  successUrl,
  cancelUrl,
  formatPrice = (n) => `$${n.toFixed(2)}`,
  currency = 'USD',
  className,
}: CheckoutPageProps) {
  const { db } = useCaspianFirebase();
  const { items, subtotal, count, removeFromCart } = useCart();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { startCheckout, loading, error, activePlugin } = useCheckout();
  const Link = useCaspianLink();
  const t = useT();
  const providerName = activePlugin?.name ?? '';

  const [shipping, setShipping] = useState({
    name: userProfile?.displayName ?? '',
    address: '',
    city: '',
    zip: '',
    country: '',
  });
  const [rates, setRates] = useState<ShippingRate[] | null>(null);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

  // Recompute available rates whenever cart or subtotal changes. Address
  // fields aren't passed yet — zone-based plugins are a future addition — so
  // we recalc on cart changes only to avoid a recompute on every keystroke.
  useEffect(() => {
    let alive = true;
    if (count === 0) {
      setRates(null);
      setSelectedRate(null);
      return;
    }
    calculateShippingRates({
      db,
      items,
      subtotal,
      address: null,
      currency,
    })
      .then((list) => {
        if (!alive) return;
        setRates(list);
        setSelectedRate((prev) => {
          if (prev && list.some((r) => r.installId === prev.installId)) return prev;
          return list[0] ?? null;
        });
      })
      .catch((err) => {
        console.error('[caspian-store] Failed to calculate shipping rates:', err);
        if (alive) setRates([]);
      });
    return () => {
      alive = false;
    };
  }, [db, items, subtotal, count, currency]);

  const total = useMemo(() => subtotal + (selectedRate?.price ?? 0), [subtotal, selectedRate]);

  if (authLoading) {
    return <p style={{ padding: 40, color: '#888' }}>{t('common.loading')}</p>;
  }

  if (!user) {
    return (
      <div className={className} style={{ padding: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{t('checkout.signInTitle')}</h1>
        <p style={{ color: '#666', marginTop: 8 }}>{t('checkout.signInSubtitle')}</p>
        <div style={{ marginTop: 16 }}>
          <Link href="/login">{t('signInGate.signInLink')}</Link>
        </div>
      </div>
    );
  }

  if (count === 0) {
    return (
      <div className={className} style={{ padding: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{t('checkout.emptyCart')}</h1>
        <div style={{ marginTop: 16 }}>
          <Link href="/">{t('checkout.continueShopping')}</Link>
        </div>
      </div>
    );
  }

  if (!activePlugin) {
    return (
      <div className={className} style={{ padding: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          {t('checkout.noPaymentConfigured.title')}
        </h1>
        <p style={{ color: '#666', marginTop: 8 }}>{t('checkout.noPaymentConfigured.body')}</p>
        {userProfile?.role === 'admin' && (
          <div style={{ marginTop: 16 }}>
            <Link href="/admin/payment-plugins">{t('checkout.noPaymentConfigured.adminLink')}</Link>
          </div>
        )}
      </div>
    );
  }

  const handlePay = async () => {
    try {
      await startCheckout({
        successUrl,
        cancelUrl,
        shippingCost: selectedRate?.price ?? 0,
        shippingInfo: selectedRate
          ? {
              name: shipping.name,
              address: shipping.address,
              city: shipping.city,
              zip: shipping.zip,
              country: shipping.country,
              shippingMethod: selectedRate.label,
            }
          : undefined,
      });
    } catch {
      // error state is surfaced via the hook
    }
  };

  return (
    <div className={className}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{t('checkout.title')}</h1>

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
            <h2 style={h2Style}>{t('checkout.shippingDetails')}</h2>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <Label htmlFor="ck-name">{t('checkout.fullName')}</Label>
                <Input
                  id="ck-name"
                  value={shipping.name}
                  onChange={(e) => setShipping((s) => ({ ...s, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="ck-address">{t('checkout.streetAddress')}</Label>
                <Input
                  id="ck-address"
                  value={shipping.address}
                  onChange={(e) => setShipping((s) => ({ ...s, address: e.target.value }))}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div>
                  <Label htmlFor="ck-city">{t('checkout.city')}</Label>
                  <Input
                    id="ck-city"
                    value={shipping.city}
                    onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="ck-zip">{t('checkout.zip')}</Label>
                  <Input
                    id="ck-zip"
                    value={shipping.zip}
                    onChange={(e) => setShipping((s) => ({ ...s, zip: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="ck-country">{t('checkout.country')}</Label>
                <Input
                  id="ck-country"
                  value={shipping.country}
                  onChange={(e) => setShipping((s) => ({ ...s, country: e.target.value }))}
                />
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#888', marginTop: 12 }}>
              {t('checkout.paymentHint', { provider: providerName })}
            </p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>{t('checkout.rate.heading')}</h2>
            <ShippingRatePicker
              rates={rates}
              selectedInstallId={selectedRate?.installId ?? null}
              onSelect={setSelectedRate}
              formatPrice={formatPrice}
            />
          </section>
        </div>

        <aside>
          <section style={sectionStyle}>
            <h2 style={h2Style}>{t('checkout.orderSummary')}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedSize ?? ''}-${item.selectedColor ?? ''}`}
                  style={{ display: 'flex', gap: 12, alignItems: 'center' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{item.product.name}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888' }}>
                      {item.selectedSize && `${t('cart.sizePrefix')} ${item.selectedSize} · `}
                      {t('checkout.qtyShort')} {item.quantity}
                    </p>
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {formatPrice(item.product.price * item.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                    aria-label={t('cart.remove')}
                    style={{
                      background: 'transparent',
                      border: 0,
                      color: '#b91c1c',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {t('cart.remove')}
                  </button>
                </div>
              ))}
            </div>

            <Separator />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
              <span>{t('cart.subtotal')}</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
              <span>{t('checkout.shippingLine')}</span>
              <span>
                {selectedRate
                  ? selectedRate.price > 0
                    ? formatPrice(selectedRate.price)
                    : t('checkout.rate.free')
                  : t('checkout.rate.notSelected')}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
              <span>{t('checkout.totalLine')}</span>
              <span>{formatPrice(total)}</span>
            </div>

            <Button
              size="lg"
              style={{ width: '100%' }}
              onClick={handlePay}
              loading={loading}
              disabled={!selectedRate}
            >
              {loading ? t('checkout.redirecting') : t('checkout.continueToPayment')}
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
