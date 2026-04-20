'use client';

import { useCallback, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { getAuth, getIdToken } from 'firebase/auth';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { useCart } from '../context/cart-context';
import { useAuth } from '../context/auth-context';

interface CheckoutSessionResponse {
  sessionId: string;
  url: string | null;
}

export interface CheckoutShippingInfoInput {
  name: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  shippingMethod: string;
  orderNotes?: string;
}

export interface StartCheckoutOptions {
  /** URL to return to after payment. Stripe's `{CHECKOUT_SESSION_ID}` placeholder is appended automatically unless already present. */
  successUrl: string;
  /** URL to return to if the customer cancels at the Stripe page. */
  cancelUrl: string;
  /** Optional promo code (server re-validates; client-side value is ignored on the server). */
  promoCode?: string | null;
  /** Optional shipping cost — added as a Stripe line item when > 0. */
  shippingCost?: number;
  /** Optional shipping details — stored on the order when the webhook fires. */
  shippingInfo?: CheckoutShippingInfoInput;
  /** Optional locale pass-through (e.g. for email templating). */
  locale?: string;
  /**
   * Optional override of the server endpoint. When set, `startCheckout` will
   * POST JSON to this URL instead of invoking the Cloud Function callable.
   * The endpoint should match the Cloud Function's request/response contract.
   * Useful for consumers (like Next.js apps) that already have an API route.
   */
  endpoint?: string;
}

function withSessionIdPlaceholder(url: string): string {
  if (url.includes('{CHECKOUT_SESSION_ID}')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}session_id={CHECKOUT_SESSION_ID}`;
}

/**
 * Client hook to start a Stripe Checkout session.
 *
 * By default the hook calls the deployed `createStripeCheckoutSession` Cloud
 * Function via Firebase's callable interface. Consumers who already host
 * their own Stripe backend can pass `endpoint: '/api/checkout/create-session'`
 * in `startCheckout` options and the hook POSTs JSON there instead.
 */
export function useCheckout() {
  const { functions, auth } = useCaspianFirebase();
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(
    async (options: StartCheckoutOptions) => {
      if (!user) {
        const msg = 'You must be signed in to check out.';
        setError(msg);
        throw new Error(msg);
      }
      if (items.length === 0) {
        const msg = 'Your cart is empty.';
        setError(msg);
        throw new Error(msg);
      }

      setLoading(true);
      setError(null);

      const payload = {
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          selectedSize: i.selectedSize ?? null,
          selectedColor: i.selectedColor ?? null,
        })),
        successUrl: withSessionIdPlaceholder(options.successUrl),
        cancelUrl: options.cancelUrl,
        promoCode: options.promoCode ?? null,
        shippingCost: options.shippingCost ?? 0,
        shippingInfo: options.shippingInfo ?? null,
        locale: options.locale ?? null,
      };

      try {
        let data: CheckoutSessionResponse;

        if (options.endpoint) {
          // Consumer-hosted endpoint — attach bearer token so the consumer's
          // server can verify the caller with Firebase Admin SDK.
          const currentUser = auth.currentUser ?? getAuth().currentUser;
          const token = currentUser ? await getIdToken(currentUser) : '';
          const response = await fetch(options.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload),
          });
          if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.error || `Checkout failed (${response.status})`);
          }
          data = (await response.json()) as CheckoutSessionResponse;
        } else {
          // Firebase Callable — default path.
          const callable = httpsCallable<unknown, CheckoutSessionResponse>(
            functions,
            'createStripeCheckoutSession',
          );
          const result = await callable(payload);
          data = result.data;
        }

        if (!data.url) throw new Error('Stripe did not return a checkout URL.');

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
    [auth, functions, items, user, clearCart],
  );

  return { startCheckout, loading, error };
}
