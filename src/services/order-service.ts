import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import type { Order, OrderStatus } from '../types';

const PURCHASED_STATUSES: OrderStatus[] = ['paid', 'processing', 'shipped', 'delivered'];

export async function hasUserPurchasedProduct(
  db: Firestore,
  userId: string,
  productId: string,
): Promise<boolean> {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    where('status', 'in', PURCHASED_STATUSES),
  );
  const snap = await getDocs(q);
  return snap.docs.some((d) => {
    const data = d.data() as Order;
    return data.items?.some((item) => item.productId === productId) ?? false;
  });
}
