'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCart } from '../context/cart-context';
import { useAuth } from '../context/auth-context';
import { useCaspianFirebase, useCaspianImage, useCaspianLink } from '../provider/caspian-store-provider';
import { useCheckout } from '../hooks/use-checkout';
import { useT } from '../i18n/locale-context';
import { getSiteSettings } from '../services/site-settings-service';
import { calculateShippingRates } from '../services/shipping-calculator';
import { addAddress } from '../services/user-service';
import { subscribeEmail } from '../services/subscriber-service';
import type { SiteSettings, SupportedCountry, UserAddress } from '../types';
import type { ShippingRate } from '../shipping/types';
import { Button } from '../ui/button';
import { Input, Label } from '../ui/input';
import { Select } from '../ui/select';
import { useToast } from '../ui/toast';

export interface CheckoutPageProps {
  /** Where the payment provider returns users after successful payment. */
  successUrl: string;
  /** Where the payment provider returns users if they cancel. */
  cancelUrl: string;
  formatPrice?: (n: number) => string;
  /** Currency code passed to shipping plugins when computing rates. */
  currency?: string;
  /** Where "Return to cart" navigates. Default: `/cart`. */
  cartHref?: string;
  className?: string;
}

interface ShippingForm {
  email: string;
  newsletterOptIn: boolean;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  countryCode: string;
  postalCode: string;
  phone: string;
  saveAddressToProfile: boolean;
}

const emptyForm: ShippingForm = {
  email: '',
  newsletterOptIn: false,
  firstName: '',
  lastName: '',
  address: '',
  apartment: '',
  city: '',
  countryCode: '',
  postalCode: '',
  phone: '',
  saveAddressToProfile: true,
};

/**
 * Shipping-information step of checkout. Layout: two cards on the left
 * (Contact + Shipping Address + Shipping Method), sticky Order Summary on
 * the right with line items, subtotal, shipping, optional tax, and the
 * Continue-to-Payment CTA. Payment itself happens at the active payment
 * plugin (Stripe redirect for the built-in plugin).
 *
 * Signed-in users see a picker of their saved addresses above the form;
 * picking one auto-fills. A "new address" checkbox on submit saves the
 * entered address to the user profile so it's available next time.
 *
 * Tax: respects `SiteSettings.taxMode`. Under `flat` the `flatTaxRate`
 * applies; under `per-country` the rate on the selected country's row in
 * `supportedCountries` applies; under `none` (or undefined) the tax row is
 * hidden. Tax is always labelled an *estimate* — final tax is computed at
 * the payment provider.
 *
 * Country: if `SiteSettings.supportedCountries` is non-empty, the country
 * dropdown is restricted to that list. Shipping methods are filtered to
 * those whose `eligibleCountries` include the selected country (or are
 * empty = available everywhere).
 */
export function CheckoutPage({
  successUrl,
  cancelUrl,
  formatPrice = (n) => `$${n.toFixed(2)}`,
  currency = 'USD',
  cartHref = '/cart',
  className,
}: CheckoutPageProps) {
  const { db } = useCaspianFirebase();
  const Image = useCaspianImage();
  const Link = useCaspianLink();
  const { items, subtotal, count } = useCart();
  const { user, userProfile, loading: authLoading, signInAsGuest } = useAuth();
  const { toast } = useToast();
  const [guestSignInLoading, setGuestSignInLoading] = useState(false);
  const { startCheckout, loading, error, activePlugin } = useCheckout();
  const t = useT();

  const [site, setSite] = useState<SiteSettings | null>(null);
  const [form, setForm] = useState<ShippingForm>(() => ({ ...emptyForm }));
  const [selectedAddressId, setSelectedAddressId] = useState<string>('new');
  const [rates, setRates] = useState<ShippingRate[] | null>(null);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);

  const providerName = activePlugin?.name ?? '';

  // Load site settings (country list + tax config).
  useEffect(() => {
    let alive = true;
    getSiteSettings(db)
      .then((s) => {
        if (alive) setSite(s ?? null);
      })
      .catch(() => {
        if (alive) setSite(null);
      });
    return () => {
      alive = false;
    };
  }, [db]);

  // Seed contact email from profile once auth lands.
  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      email: f.email || user.email || '',
      firstName: f.firstName || userProfile?.displayName?.split(' ')[0] || '',
      lastName: f.lastName || userProfile?.displayName?.split(' ').slice(1).join(' ') || '',
    }));
  }, [user, userProfile]);

  // Default-select the user's default address once profile + addresses load.
  useEffect(() => {
    if (!userProfile?.addresses?.length) return;
    const def = userProfile.addresses.find((a) => a.isDefault) ?? userProfile.addresses[0];
    if (def) {
      setSelectedAddressId(def.id);
      applyAddressToForm(def);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.uid]);

  const applyAddressToForm = (addr: UserAddress) => {
    setForm((f) => ({
      ...f,
      firstName: addr.name.split(' ')[0] ?? f.firstName,
      lastName: addr.name.split(' ').slice(1).join(' ') || f.lastName,
      address: addr.address,
      city: addr.city,
      postalCode: addr.zip,
      countryCode: addr.country,
      saveAddressToProfile: false,
    }));
  };

  const handleAddressPick = (id: string) => {
    setSelectedAddressId(id);
    if (id === 'new') {
      setForm((f) => ({
        ...f,
        firstName: '',
        lastName: '',
        address: '',
        apartment: '',
        city: '',
        postalCode: '',
        countryCode: '',
        saveAddressToProfile: true,
      }));
      return;
    }
    const picked = userProfile?.addresses?.find((a) => a.id === id);
    if (picked) applyAddressToForm(picked);
  };

  // Supported-country options. Empty list → library falls back to a tiny
  // global default so checkout doesn't lock up before an admin configures it.
  const countryOptions = useMemo(() => {
    const list: SupportedCountry[] =
      site?.supportedCountries && site.supportedCountries.length > 0
        ? site.supportedCountries
        : DEFAULT_COUNTRIES;
    return [
      { value: '', label: t('checkout.country.select') },
      ...list.map((c) => ({ value: c.code, label: c.name })),
    ];
  }, [site?.supportedCountries, t]);

  // Recompute available shipping rates whenever cart or country changes.
  useEffect(() => {
    let alive = true;
    if (count === 0) {
      setRates(null);
      setSelectedRate(null);
      return;
    }
    // Honor the site-wide `hideRatesUntilAddressEntered` toggle before we even
    // run the query — keeps the picker blank while the shopper is still filling
    // in their address, which is the point of the setting.
    const hideUntilAddress = site?.shippingOptions?.hideRatesUntilAddressEntered ?? false;
    if (hideUntilAddress && (!form.countryCode || !form.postalCode.trim())) {
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
        // Client-side filter by eligibleCountries.
        let filtered = form.countryCode
          ? list.filter((r) => {
              const eligible = r.eligibleCountries;
              return !eligible || eligible.length === 0 || eligible.includes(form.countryCode);
            })
          : list;
        // When the merchant enables `hideRatesWhenFreeAvailable` and any rate
        // is 0, suppress the paid options so the shopper auto-lands on free.
        if (site?.shippingOptions?.hideRatesWhenFreeAvailable) {
          const hasFree = filtered.some((r) => r.price === 0);
          if (hasFree) filtered = filtered.filter((r) => r.price === 0);
        }
        setRates(filtered);
        setSelectedRate((prev) => {
          if (prev && filtered.some((r) => r.installId === prev.installId)) return prev;
          return filtered[0] ?? null;
        });
      })
      .catch((err) => {
        console.error('[caspian-store] Failed to calculate shipping rates:', err);
        if (alive) setRates([]);
      });
    return () => {
      alive = false;
    };
  }, [
    db,
    items,
    subtotal,
    count,
    currency,
    form.countryCode,
    form.postalCode,
    site?.shippingOptions?.hideRatesUntilAddressEntered,
    site?.shippingOptions?.hideRatesWhenFreeAvailable,
  ]);

  // Tax estimate.
  const taxAmount = useMemo(() => {
    if (!site?.taxMode || site.taxMode === 'none') return 0;
    if (site.taxMode === 'flat') return subtotal * (site.flatTaxRate ?? 0);
    // per-country
    const row = site.supportedCountries?.find((c) => c.code === form.countryCode);
    return subtotal * (row?.taxRate ?? 0);
  }, [site, subtotal, form.countryCode]);

  const showTaxRow = site?.taxMode === 'flat' || site?.taxMode === 'per-country';
  const taxLabel = site?.taxLabel || t('checkout.taxDefault');
  const total = useMemo(
    () => subtotal + (selectedRate?.price ?? 0) + taxAmount,
    [subtotal, selectedRate, taxAmount],
  );

  // ---- Render gates ----

  if (authLoading) {
    return <p style={{ padding: 40, color: '#888' }}>{t('common.loading')}</p>;
  }

  if (!user) {
    const allowGuest = site?.accounts?.allowGuestCheckout ?? false;
    const allowRegister = site?.accounts?.allowAccountCreationAtCheckout ?? true;

    const handleGuestCheckout = async () => {
      setGuestSignInLoading(true);
      try {
        await signInAsGuest();
      } catch (error) {
        console.error('[caspian-store] Guest sign-in failed:', error);
        toast({
          title: 'Could not start guest checkout',
          description: error instanceof Error ? error.message : undefined,
          variant: 'destructive',
        });
        setGuestSignInLoading(false);
      }
    };

    return (
      <div
        className={className}
        style={{
          padding: 40,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{t('checkout.signInTitle')}</h1>
        <p style={{ color: '#666', marginTop: 0 }}>{t('checkout.signInSubtitle')}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/login">{t('signInGate.signInLink')}</Link>
          {allowRegister && <Link href="/register">Create an account</Link>}
        </div>
        {allowGuest && (
          <Button
            variant="outline"
            onClick={handleGuestCheckout}
            loading={guestSignInLoading}
            style={{ marginTop: 8 }}
          >
            Continue as guest
          </Button>
        )}
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
    // Subscribe to newsletter if opted in.
    if (form.newsletterOptIn && form.email.trim()) {
      try {
        await subscribeEmail(db, form.email.trim());
      } catch (err) {
        console.warn('[caspian-store] Newsletter subscribe failed (continuing):', err);
      }
    }

    // Persist new address to user profile if opted in.
    if (selectedAddressId === 'new' && form.saveAddressToProfile && user) {
      try {
        await addAddress(db, user.uid, {
          name: `${form.firstName} ${form.lastName}`.trim(),
          address: [form.address, form.apartment].filter(Boolean).join(' '),
          city: form.city,
          zip: form.postalCode,
          country: form.countryCode,
          isDefault: !userProfile?.addresses?.length,
        });
      } catch (err) {
        console.warn('[caspian-store] Address save failed (continuing):', err);
      }
    }

    try {
      await startCheckout({
        successUrl,
        cancelUrl,
        shippingCost: selectedRate?.price ?? 0,
        shippingInfo: selectedRate
          ? {
              name: `${form.firstName} ${form.lastName}`.trim(),
              address: [form.address, form.apartment].filter(Boolean).join(' '),
              city: form.city,
              zip: form.postalCode,
              country: form.countryCode,
              shippingMethod: selectedRate.label,
            }
          : undefined,
      });
    } catch {
      // error state is surfaced via the hook
    }
  };

  const savedAddressOptions = [
    ...(userProfile?.addresses ?? []).map((a) => ({
      value: a.id,
      label: `${a.name} — ${a.address}, ${a.city}${a.isDefault ? ' (default)' : ''}`,
    })),
    { value: 'new', label: t('checkout.address.useNew') },
  ];
  const hasSavedAddresses = (userProfile?.addresses?.length ?? 0) > 0;

  const formValid = Boolean(
    form.email &&
      form.firstName &&
      form.address &&
      form.city &&
      form.countryCode &&
      form.postalCode,
  );

  // ---- Render ----

  return (
    <div className={className} style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 64px' }}>
      <nav aria-label="breadcrumb" style={{ fontSize: 11, letterSpacing: '0.08em', color: '#888', marginBottom: 12 }}>
        <Link href={cartHref}>
          <span style={{ color: '#888' }}>{t('checkout.breadcrumb.cart')}</span>
        </Link>{' '}
        &gt; <span style={{ color: '#111', fontWeight: 600 }}>{t('checkout.breadcrumb.checkout')}</span>
      </nav>

      <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 32px', letterSpacing: '-0.01em' }}>
        {t('checkout.shippingInformation')}
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.5fr) 400px',
          gap: 32,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* --- Contact --- */}
          <section style={cardStyle}>
            <header
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <h2 style={h2Style}>{t('checkout.contact')}</h2>
            </header>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input
                type="email"
                placeholder={t('checkout.emailPlaceholder')}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#555' }}>
                <input
                  type="checkbox"
                  checked={form.newsletterOptIn}
                  onChange={(e) => setForm((f) => ({ ...f, newsletterOptIn: e.target.checked }))}
                />
                {t('checkout.newsletterOptIn')}
              </label>
            </div>
          </section>

          {/* --- Shipping Address --- */}
          <section style={cardStyle}>
            <h2 style={h2Style}>{t('checkout.shippingAddress')}</h2>

            {hasSavedAddresses && (
              <div style={{ marginBottom: 16 }}>
                <Label>{t('checkout.address.useSaved')}</Label>
                <Select
                  value={selectedAddressId}
                  onChange={(e) => handleAddressPick(e.target.value)}
                  options={savedAddressOptions}
                />
              </div>
            )}

            {(selectedAddressId === 'new' || !hasSavedAddresses) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input
                    placeholder={t('checkout.firstName')}
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  />
                  <Input
                    placeholder={t('checkout.lastName')}
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  />
                </div>
                <Input
                  placeholder={t('checkout.streetAddress')}
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
                <Input
                  placeholder={t('checkout.apartment')}
                  value={form.apartment}
                  onChange={(e) => setForm((f) => ({ ...f, apartment: e.target.value }))}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input
                    placeholder={t('checkout.city')}
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                  <Select
                    value={form.countryCode}
                    onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value }))}
                    options={countryOptions}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Input
                    placeholder={t('checkout.postalCode')}
                    value={form.postalCode}
                    onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                  />
                  <Input
                    type="tel"
                    placeholder={t('checkout.phone')}
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                {user && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#666' }}>
                    <input
                      type="checkbox"
                      checked={form.saveAddressToProfile}
                      onChange={(e) => setForm((f) => ({ ...f, saveAddressToProfile: e.target.checked }))}
                    />
                    {t('checkout.address.saveToProfile')}
                  </label>
                )}
              </div>
            )}
          </section>

          {/* --- Shipping Method --- */}
          <section style={cardStyle}>
            <h2 style={h2Style}>{t('checkout.shippingMethod')}</h2>
            {!form.countryCode ? (
              <p style={{ color: '#888', fontSize: 14, margin: 0 }}>{t('checkout.shippingMethodPickCountry')}</p>
            ) : rates === null ? (
              <p style={{ color: '#888', fontSize: 14, margin: 0 }}>{t('common.loading')}</p>
            ) : rates.length === 0 ? (
              <p style={{ color: '#b91c1c', fontSize: 14, margin: 0 }}>
                {t('checkout.shippingMethodNone')}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {rates.map((r) => {
                  const active = selectedRate?.installId === r.installId;
                  return (
                    <label
                      key={r.installId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '14px 16px',
                        border: active
                          ? '2px solid var(--caspian-primary, #111)'
                          : '1px solid rgba(0,0,0,0.1)',
                        borderRadius: 10,
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                          type="radio"
                          checked={active}
                          onChange={() => setSelectedRate(r)}
                          name="shipping-method"
                        />
                        <span>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{r.label}</div>
                          {r.estimatedDays && (
                            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                              {t('checkout.shippingEta', {
                                min: r.estimatedDays.min,
                                max: r.estimatedDays.max,
                              })}
                            </div>
                          )}
                        </span>
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        {r.price > 0 ? formatPrice(r.price) : t('checkout.rate.free')}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* --- Order Summary --- */}
        <aside style={{ position: 'sticky', top: 16 }}>
          <section style={cardStyle}>
            <h2 style={h2Style}>{t('checkout.orderSummary')}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
              {items.map((item) => {
                const img = item.product.images?.[0];
                return (
                  <div
                    key={`${item.product.id}-${item.selectedSize ?? ''}-${item.selectedColor ?? ''}`}
                    style={{ display: 'flex', gap: 12 }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: 56,
                        height: 56,
                        borderRadius: 6,
                        overflow: 'hidden',
                        background: '#f5f5f5',
                        flexShrink: 0,
                      }}
                    >
                      {img && <Image src={img.url} alt={img.alt || item.product.name} fill />}
                      <span
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          background: '#888',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {item.quantity}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
                        {item.product.name}
                      </p>
                      {(item.selectedSize || item.selectedColor) && (
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#888' }}>
                          {[item.selectedColor, item.selectedSize].filter(Boolean).join(' / ')}
                        </p>
                      )}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 12 }}>
              <SummaryRow label={t('cart.subtotal')} value={formatPrice(subtotal)} />
              <SummaryRow
                label={t('checkout.shippingLine')}
                value={
                  selectedRate
                    ? selectedRate.price > 0
                      ? formatPrice(selectedRate.price)
                      : t('checkout.rate.free')
                    : t('checkout.rate.notSelected')
                }
              />
              {showTaxRow && (
                <SummaryRow
                  label={taxLabel}
                  value={form.countryCode ? formatPrice(taxAmount) : t('checkout.taxPending')}
                />
              )}
            </div>
            <div
              style={{
                borderTop: '1px solid rgba(0,0,0,0.08)',
                paddingTop: 12,
                marginTop: 8,
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 700 }}>{t('checkout.totalLine')}</span>
              <span>
                <span style={{ fontSize: 11, color: '#888', marginRight: 6 }}>{currency}</span>
                <span style={{ fontSize: 22, fontWeight: 700 }}>{formatPrice(total)}</span>
              </span>
            </div>

            <Button
              size="lg"
              style={{ width: '100%', marginTop: 20 }}
              onClick={handlePay}
              loading={loading}
              disabled={!selectedRate || !formValid}
            >
              {loading ? t('checkout.redirecting') : t('checkout.continueToPayment')}
            </Button>
            {error && <p style={{ color: '#b91c1c', fontSize: 13, marginTop: 8 }}>{error}</p>}

            <p
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontSize: 11,
                color: '#888',
                marginTop: 12,
                marginBottom: 0,
                letterSpacing: '0.04em',
              }}
            >
              {t('checkout.secureLine')}
              {providerName ? ` · ${providerName}` : ''}
            </p>
          </section>

          <div style={{ marginTop: 12 }}>
            <Link href={cartHref}>
              <span style={{ fontSize: 13, color: '#666' }}>← {t('checkout.returnToCart')}</span>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: 14,
        marginBottom: 8,
        color: '#333',
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  padding: 24,
  background: '#fff',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.05)',
};
const h2Style: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  margin: 0,
  marginBottom: 16,
};

/**
 * Minimal fallback country list used before the admin configures
 * `SiteSettings.supportedCountries`. Keeps checkout usable on fresh installs.
 */
const DEFAULT_COUNTRIES: SupportedCountry[] = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
];
