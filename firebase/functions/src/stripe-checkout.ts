import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';

const STRIPE_SECRET = defineSecret('STRIPE_SECRET_KEY');

interface CheckoutItem {
  productId: string;
  quantity: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
}

interface CheckoutRequest {
  items: CheckoutItem[];
  successUrl: string;
  cancelUrl: string;
  promoCode?: string | null;
  shippingMethodId?: string | null;
}

/**
 * Callable function — consumers invoke from the client via
 * httpsCallable(functions, 'createStripeCheckoutSession').
 *
 * Stage 0 version: validates products + prices from Firestore and creates a
 * Stripe Checkout Session. Promo-code discount and shipping-method wiring will
 * land in a later stage along with the matching client-side hook.
 */
export const createStripeCheckoutSession = onCall(
  { secrets: [STRIPE_SECRET], cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Sign-in required.');
    }

    const data = request.data as CheckoutRequest;
    if (!data?.items?.length) {
      throw new HttpsError('invalid-argument', 'No items in cart.');
    }

    const db = getFirestore();
    const stripe = new Stripe(STRIPE_SECRET.value(), { apiVersion: '2024-11-20.acacia' as any });

    const productIds = Array.from(new Set(data.items.map((i) => i.productId)));
    const docs = await Promise.all(
      productIds.map((id) => db.collection('products').doc(id).get()),
    );
    const productMap = new Map<string, FirebaseFirestore.DocumentData>();
    for (const snap of docs) {
      if (!snap.exists) {
        throw new HttpsError('not-found', `Product ${snap.id} does not exist.`);
      }
      productMap.set(snap.id, snap.data() as FirebaseFirestore.DocumentData);
    }

    const lineItems = data.items.map((item) => {
      const product = productMap.get(item.productId)!;
      if (!product.isActive) {
        throw new HttpsError('failed-precondition', `Product ${item.productId} is inactive.`);
      }
      const imageUrl = product.images?.[0]?.url;
      return {
        quantity: item.quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(Number(product.price) * 100),
          product_data: {
            name: product.name,
            description: product.brand,
            images: imageUrl ? [imageUrl] : undefined,
            metadata: {
              productId: item.productId,
              selectedSize: item.selectedSize ?? '',
              selectedColor: item.selectedColor ?? '',
            },
          },
        },
      } satisfies Stripe.Checkout.SessionCreateParams.LineItem;
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: data.successUrl,
      cancel_url: data.cancelUrl,
      client_reference_id: request.auth.uid,
      customer_email: request.auth.token.email ?? undefined,
      metadata: {
        userId: request.auth.uid,
      },
    });

    return { sessionId: session.id, url: session.url };
  },
);
