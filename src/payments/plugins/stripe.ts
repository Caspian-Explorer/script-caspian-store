import { getIdToken } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import type {
  PaymentPlugin,
  PaymentPluginCheckoutCtx,
  PaymentPluginStartResult,
  StartCheckoutOptions,
  StripeConfig,
} from '../types';

interface StripeCallablePayload {
  items: Array<{
    productId: string;
    quantity: number;
    selectedSize: string | null;
    selectedColor: string | null;
  }>;
  successUrl: string;
  cancelUrl: string;
  promoCode: string | null;
  shippingCost: number;
  shippingInfo: StartCheckoutOptions['shippingInfo'] | null;
  locale: string | null;
}

interface StripeCallableResponse {
  sessionId: string;
  url: string | null;
}

function withSessionIdPlaceholder(url: string): string {
  if (url.includes('{CHECKOUT_SESSION_ID}')) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}session_id={CHECKOUT_SESSION_ID}`;
}

function buildPayload(
  ctx: PaymentPluginCheckoutCtx,
  options: StartCheckoutOptions,
): StripeCallablePayload {
  return {
    items: ctx.items.map((i) => ({
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
}

async function startCheckout(
  ctx: PaymentPluginCheckoutCtx,
  options: StartCheckoutOptions,
): Promise<PaymentPluginStartResult> {
  const payload = buildPayload(ctx, options);

  let data: StripeCallableResponse;

  if (options.endpoint) {
    const token = await getIdToken(ctx.user);
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
    data = (await response.json()) as StripeCallableResponse;
  } else {
    const callable = httpsCallable<StripeCallablePayload, StripeCallableResponse>(
      ctx.functions,
      'createStripeCheckoutSession',
    );
    const result = await callable(payload);
    data = result.data;
  }

  if (!data.url) throw new Error('Stripe did not return a checkout URL.');

  return { redirectUrl: data.url, externalRef: data.sessionId };
}

export const STRIPE_PLUGIN: PaymentPlugin<StripeConfig> = {
  id: 'stripe',
  name: 'Stripe',
  description:
    'Accept card payments via Stripe Checkout. Requires the `functions-stripe` Cloud Functions codebase to be deployed.',
  defaultConfig: { publishableKey: '' },
  validateConfig: (config) => {
    const c = (config ?? {}) as Partial<StripeConfig>;
    const publishableKey = typeof c.publishableKey === 'string' ? c.publishableKey.trim() : '';
    if (!publishableKey) {
      throw new Error('Stripe publishable key is required.');
    }
    if (!publishableKey.startsWith('pk_')) {
      throw new Error('Stripe publishable key must start with `pk_live_` or `pk_test_`.');
    }
    return { publishableKey };
  },
  startCheckout,
};
