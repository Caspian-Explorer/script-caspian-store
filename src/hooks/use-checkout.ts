'use client';

import { useCallback, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { useCart } from '../context/cart-context';
import { useAuth } from '../context/auth-context';

interface CheckoutSessionResponse {
  sessionId: string;
  url: string | null;
}

export interface StartCheckoutOptions {
  /** URL to return to after payment. Stripe's `{CHECKOUT_SESSION_ID}` placeholder is appended automatically unless already present. */
  successUrl: string;
  /** URL to return to if the customer cancels at the Stripe page. */
  cancelUrl: string;
  /** Optional promo code to pass through to the server-side checkout flow. */
  promoCode?: string | null;
  /** Optional shipping method ID. */
  shippingMethodId?: string | null;
}

function withSessionIdPlaceholder(url: string): string {
  if (url.includes('{CHECKOUT_SESSION_ID}')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}session_id={CHECKOUT_SESSION_ID}`;
}

/**
 * Client hook to start a Stripe Checkout session via the deployed
 * `createStripeCheckoutSession` Cloud Function.
 *
 * Consumers deploy the function from `firebase/functions/` (see INSTALL.md),
 * call `startCheckout({ successUrl, cancelUrl })`, and we redirect the browser
 * to Stripe.
 */
export function useCheckout() {
  const { functions } = useCaspianFirebase();
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(
    async ({ successUrl, cancelUrl, promoCode, shippingMethodId }: StartCheckoutOptions) => {
      if (!user) {
        const err = 'You must be signed in to check out.';
        setError(err);
        throw new Error(err);
      }
      if (items.length === 0) {
        const err = 'Your cart is empty.';
        setError(err);
        throw new Error(err);
      }

      setLoading(true);
      setError(null);
      try {
        const callable = httpsCallable<unknown, CheckoutSessionResponse>(
          functions,
          'createStripeCheckoutSession',
        );
        const { data } = await callable({
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            selectedSize: i.selectedSize ?? null,
            selectedColor: i.selectedColor ?? null,
          })),
          successUrl: withSessionIdPlaceholder(successUrl),
          cancelUrl,
          promoCode: promoCode ?? null,
          shippingMethodId: shippingMethodId ?? null,
        });
        if (!data.url) throw new Error('Stripe did not return a checkout URL.');

        // Clear the client cart optimistically — the webhook will rebuild the
        // order server-side. If the user bounces back via cancelUrl their cart
        // is still persisted in Firestore/localStorage.
        clearCart();

        if (typeof window !== 'undefined') {
          window.location.href = data.url;
        }
        return data;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Checkout failed.';
        setError(msg);
        setLoading(false);
        throw e;
      }
    },
    [functions, items, user, clearCart],
  );

  return { startCheckout, loading, error };
}
