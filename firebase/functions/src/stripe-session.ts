import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';

const STRIPE_SECRET = defineSecret('STRIPE_SECRET_KEY');

export interface GetSessionRequest {
  sessionId: string;
}

export interface GetSessionResponse {
  orderId: string | null;
  customerEmail: string | null;
  amountTotal: number | null;
  paymentStatus: string | null;
}

/**
 * Callable Cloud Function that maps a Stripe Checkout session ID to the
 * Firestore order doc created by the webhook. Useful on the post-checkout
 * success page when the client wants to display order details but only has
 * the session_id from the URL.
 */
export const getStripeSession = onCall(
  { secrets: [STRIPE_SECRET], cors: true },
  async (request) => {
    const { sessionId } = (request.data ?? {}) as GetSessionRequest;
    if (!sessionId) {
      throw new HttpsError('invalid-argument', 'Missing sessionId.');
    }

    const stripe = new Stripe(STRIPE_SECRET.value(), {
      apiVersion: '2024-11-20.acacia' as any,
    });

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      console.error('[caspian-store] Failed to retrieve Stripe session:', error);
      throw new HttpsError('not-found', 'Session not found.');
    }

    if (session.payment_status !== 'paid') {
      throw new HttpsError('failed-precondition', 'Payment not completed.');
    }

    const db = getFirestore();
    const snap = await db
      .collection('orders')
      .where('payment.stripeSessionId', '==', sessionId)
      .limit(1)
      .get();

    const response: GetSessionResponse = {
      orderId: snap.empty ? null : snap.docs[0].id,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
      paymentStatus: session.payment_status,
    };
    return response;
  },
);
