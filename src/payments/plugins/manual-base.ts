import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import type {
  PaymentPluginCheckoutCtx,
  PaymentPluginStartResult,
  StartCheckoutOptions,
} from '../types';
import type { Order, OrderItem, OrderStatus } from '../../types';

/**
 * Resolve the success URL a manual-payment plugin should redirect to after
 * creating the order. Mirrors Stripe's `{CHECKOUT_SESSION_ID}` placeholder —
 * when present, it's substituted with the new Firestore order id.
 */
function resolveSuccessUrl(base: string, orderId: string): string {
  if (base.includes('{CHECKOUT_SESSION_ID}')) {
    return base.replace('{CHECKOUT_SESSION_ID}', orderId);
  }
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}order_id=${encodeURIComponent(orderId)}`;
}

/**
 * Kick off a manual-payment checkout: write a new `orders/{id}` document in
 * Firestore with `status: 'on-hold'` and the plugin's method stamped on the
 * `payment.method` field, then return a redirect URL pointing to the
 * consumer-provided success page. The order is immediately visible to the
 * shopper (read rules allow self-owned orders) and to admins (fulfillment).
 *
 * No money movement happens here — these plugins purely record the shopper's
 * intent to pay via the chosen method. The admin moves the order from
 * `on-hold` → `paid` manually once the funds arrive.
 */
export async function startManualCheckout(
  ctx: PaymentPluginCheckoutCtx,
  options: StartCheckoutOptions,
  method: NonNullable<Order['payment']['method']>,
): Promise<PaymentPluginStartResult> {
  // Firestore instance is attached to the same FirebaseApp `ctx.functions`
  // lives on — re-resolve rather than threading it down the contract.
  const db = getFirestore(ctx.functions.app);

  const items: OrderItem[] = ctx.items.map((i) => ({
    productId: i.product.id,
    name: i.product.name,
    brand: i.product.brand,
    price: i.product.price,
    quantity: i.quantity,
    selectedSize: i.selectedSize ?? null,
    selectedColor: i.selectedColor ?? null,
    imageUrl: i.product.images?.[0]?.url ?? '',
  }));

  const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
  const shippingCost = options.shippingCost ?? 0;
  const discount = 0; // Admin re-validates promo on fulfillment for manual flows.
  const total = Math.max(0, subtotal + shippingCost - discount);

  if (!options.shippingInfo) {
    throw new Error('Shipping information is required for manual-payment checkout.');
  }

  // Note: createdAt would normally be a Timestamp; we use serverTimestamp at
  // write time and fall back to a client-side Timestamp typing for our
  // Order interface. Firestore replaces it with the server-assigned value.
  const payload: Omit<Order, 'id'> = {
    userId: ctx.user.uid,
    userEmail: ctx.user.email ?? '',
    status: 'on-hold' satisfies OrderStatus,
    items,
    shippingInfo: options.shippingInfo,
    payment: {
      stripeSessionId: '',
      last4: '',
      brand: '',
      amount: total,
      method,
    },
    subtotal,
    shippingCost,
    discount,
    promoCode: options.promoCode ?? null,
    total,
    createdAt: serverTimestamp() as unknown as Timestamp,
  };

  const ref = await addDoc(collection(db, 'orders'), payload);

  return {
    redirectUrl: resolveSuccessUrl(options.successUrl, ref.id),
    externalRef: ref.id,
  };
}

/**
 * Shared config validator used by every manual-payment plugin. Each plugin
 * may chain additional field checks after this.
 */
export function validateManualConfig<T extends { instructions?: unknown }>(
  raw: unknown,
  pluginName: string,
): T {
  const c = (raw ?? {}) as Record<string, unknown>;
  const instructions = typeof c.instructions === 'string' ? c.instructions.trim() : '';
  if (!instructions) {
    throw new Error(
      `${pluginName} requires an "instructions" message shown to shoppers after checkout.`,
    );
  }
  return { ...c, instructions } as T;
}
