import { collection, getDocs, limit, query, where, type Firestore } from 'firebase/firestore';
import type { AppliedPromoCode } from '../types';

/**
 * Client-side promo code validator. Mirrors the server-side logic in the
 * `createStripeCheckoutSession` Cloud Function so consumers can show an
 * applied-discount preview in the cart before checkout.
 *
 * Security note: the authoritative discount is STILL computed server-side by
 * the Cloud Function at checkout time. This helper is for UI only.
 */
export async function validatePromoCode(
  db: Firestore,
  code: string,
  subtotal: number,
): Promise<AppliedPromoCode | null> {
  if (!code.trim()) return null;

  const snap = await getDocs(
    query(
      collection(db, 'promoCodes'),
      where('code', '==', code.trim().toUpperCase()),
      where('isActive', '==', true),
      limit(1),
    ),
  );
  if (snap.empty) return null;

  const promo = snap.docs[0].data() as {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    minOrderAmount?: number;
    maxDiscount?: number;
    isActive: boolean;
  };

  if (promo.minOrderAmount && subtotal < promo.minOrderAmount) return null;

  let discountAmount = 0;
  if (promo.type === 'percentage') {
    discountAmount = (subtotal * (promo.value ?? 0)) / 100;
    if (promo.maxDiscount) discountAmount = Math.min(discountAmount, promo.maxDiscount);
  } else if (promo.type === 'fixed') {
    discountAmount = Math.min(promo.value ?? 0, subtotal);
  }

  discountAmount = Math.max(0, discountAmount);
  if (discountAmount <= 0) return null;

  return {
    code: promo.code,
    type: promo.type,
    value: promo.value,
    discountAmount,
  };
}
