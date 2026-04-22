import type { Auth, User } from 'firebase/auth';
import type { Functions } from 'firebase/functions';
import type { CartItem } from '../types';

export type PaymentPluginId = 'stripe';

export const PAYMENT_PLUGIN_IDS: readonly PaymentPluginId[] = ['stripe'] as const;

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
  /** URL to return to after payment. `{CHECKOUT_SESSION_ID}` is appended automatically unless already present. */
  successUrl: string;
  /** URL to return to if the customer cancels. */
  cancelUrl: string;
  /** Optional promo code (server re-validates; client-side value is ignored on the server). */
  promoCode?: string | null;
  /** Optional shipping cost — added as a line item when > 0. */
  shippingCost?: number;
  /** Optional shipping details — stored on the order when the webhook fires. */
  shippingInfo?: CheckoutShippingInfoInput;
  /** Optional locale pass-through (e.g. for email templating). */
  locale?: string;
  /**
   * Optional override of the server endpoint. When set, the plugin will POST
   * JSON to this URL instead of invoking its Cloud Function callable. Useful
   * for consumers (like Next.js apps) that already host the checkout endpoint.
   * Plugins that don't support a custom endpoint must ignore this.
   */
  endpoint?: string;
}

export interface PaymentPluginCheckoutCtx {
  functions: Functions;
  auth: Auth;
  /** Signed-in user. `useCheckout` guards the sign-in gate; plugins always receive a user. */
  user: User;
  items: CartItem[];
  /** Plugin config from the active `PaymentPluginInstall.config` (after `validateConfig`). */
  config: Record<string, unknown>;
}

export interface PaymentPluginStartResult {
  /** URL to redirect to for payment, if any. `useCheckout` navigates to it on success. */
  redirectUrl: string | null;
  /** Provider-assigned identifier for this attempt (Stripe: session id). Persisted on the resulting order. */
  externalRef: string;
}

export interface PaymentPlugin<C = Record<string, unknown>> {
  id: PaymentPluginId;
  /** Brand name shown in admin and checkout UI. Plain string (brand names don't translate). */
  name: string;
  /** One-line description shown in the admin catalog. */
  description: string;
  /** Default config rendered into the install dialog. */
  defaultConfig: C;
  /** Parse raw Firestore config into the plugin's typed shape. Throws with a user-facing message on invalid input. */
  validateConfig: (config: unknown) => C;
  /** Invoke the provider to start a checkout session. */
  startCheckout: (
    ctx: PaymentPluginCheckoutCtx,
    options: StartCheckoutOptions,
  ) => Promise<PaymentPluginStartResult>;
}

export type StripeMode = 'live' | 'test';

export interface StripeConfig {
  /** Which key pair is active. Server-side secrets (Cloud Functions) must be kept in sync. */
  mode: StripeMode;
  /** `pk_live_...` key. Required when `mode === 'live'`, optional otherwise. */
  publishableKeyLive: string;
  /** `pk_test_...` key. Required when `mode === 'test'`, optional otherwise. */
  publishableKeyTest: string;
  /**
   * Derived from `mode` at validate time — the active publishable key for
   * client-side Stripe.js. Not persisted; callers can read it from the
   * validated config.
   */
  publishableKey: string;
}
