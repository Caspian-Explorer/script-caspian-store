import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import Stripe from 'stripe';

const STRIPE_SECRET = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

/**
 * HTTP webhook — Stripe POSTs checkout.session.completed events here.
 *
 * Stage 0 version creates an order document and decrements product stock.
 * Cart clearing happens client-side after returning to success_url.
 */
export const stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    const stripe = new Stripe(STRIPE_SECRET.value(), { apiVersion: '2024-11-20.acacia' as any });

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET.value(),
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      res.status(400).send(`Webhook Error`);
      return;
    }

    if (event.type !== 'checkout.session.completed') {
      res.status(200).send(`Ignored ${event.type}`);
      return;
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId ?? session.client_reference_id;
    if (!userId) {
      res.status(400).send('Missing userId in session metadata');
      return;
    }

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product'],
    });

    const db = getFirestore();
    const now = Timestamp.now();
    const orderRef = db.collection('orders').doc(session.id);

    const items = lineItems.data.map((li) => {
      const product = (li.price?.product as Stripe.Product) ?? null;
      const meta = product?.metadata ?? {};
      return {
        productId: meta.productId ?? '',
        name: li.description ?? product?.name ?? '',
        brand: product?.description ?? '',
        price: (li.price?.unit_amount ?? 0) / 100,
        quantity: li.quantity ?? 1,
        selectedSize: meta.selectedSize || null,
        selectedColor: meta.selectedColor || null,
        imageUrl: product?.images?.[0] ?? '',
      };
    });

    await orderRef.set({
      userId,
      userEmail: session.customer_details?.email ?? '',
      status: 'paid',
      items,
      payment: {
        stripeSessionId: session.id,
        last4: '',
        brand: '',
        amount: (session.amount_total ?? 0) / 100,
      },
      subtotal: (session.amount_subtotal ?? 0) / 100,
      shippingCost: 0,
      discount: ((session.total_details?.amount_discount ?? 0)) / 100,
      promoCode: null,
      total: (session.amount_total ?? 0) / 100,
      createdAt: now,
      updatedAt: now,
    });

    // Decrement stock per item (best-effort).
    for (const item of items) {
      if (!item.productId) continue;
      const key = item.selectedSize || '_default';
      await db.collection('products').doc(item.productId).update({
        [`stock.${key}`]: FieldValue.increment(-item.quantity),
      }).catch((err) => {
        console.warn(`Failed to decrement stock for ${item.productId}:`, err);
      });
    }

    res.status(200).send('OK');
  },
);
