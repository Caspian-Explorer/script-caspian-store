import { doc, getDoc, setDoc, Timestamp, type Firestore } from 'firebase/firestore';
import type { CartItemRef, FirestoreCart } from '../types';

export async function loadUserCart(db: Firestore, uid: string): Promise<CartItemRef[]> {
  const snap = await getDoc(doc(db, 'carts', uid));
  if (!snap.exists()) return [];
  const data = snap.data() as FirestoreCart;
  return data.items ?? [];
}

export async function saveUserCart(
  db: Firestore,
  uid: string,
  items: CartItemRef[],
): Promise<void> {
  await setDoc(doc(db, 'carts', uid), { items, updatedAt: Timestamp.now() });
}
