import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as firestoreLimit,
  orderBy,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import type { Order, OrderStatus } from '../types';

const PURCHASED_STATUSES: OrderStatus[] = ['paid', 'processing', 'shipped', 'delivered'];

export async function getOrderById(db: Firestore, orderId: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, 'orders', orderId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Order, 'id'>) };
}

export async function getOrdersByUser(
  db: Firestore,
  userId: string,
  max = 200,
): Promise<Order[]> {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    firestoreLimit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, 'id'>) }));
}

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
