import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { ShippingMethod } from '../types';

function docToMethod(snap: QueryDocumentSnapshot): ShippingMethod {
  const data = snap.data();
  return {
    id: snap.id,
    slug: data.slug ?? snap.id,
    name: data.name ?? '',
    price: data.price ?? 0,
    estimatedDays: data.estimatedDays ?? { min: 0, max: 0 },
    isActive: data.isActive ?? true,
    order: data.order ?? 0,
    createdAt: data.createdAt,
  };
}

export async function listShippingMethods(
  db: Firestore,
  opts: { onlyActive?: boolean } = {},
): Promise<ShippingMethod[]> {
  const constraints = opts.onlyActive
    ? [where('isActive', '==', true), orderBy('order', 'asc')]
    : [orderBy('order', 'asc')];
  const snap = await getDocs(query(collection(db, 'shippingMethods'), ...constraints));
  return snap.docs.map(docToMethod);
}

export type ShippingMethodWriteInput = Omit<ShippingMethod, 'id' | 'createdAt'>;

export async function createShippingMethod(
  db: Firestore,
  input: ShippingMethodWriteInput,
  id?: string,
): Promise<string> {
  const payload = { ...input, createdAt: Timestamp.now() };
  if (id) {
    await setDoc(doc(db, 'shippingMethods', id), payload);
    return id;
  }
  const ref = await addDoc(collection(db, 'shippingMethods'), payload);
  return ref.id;
}

export async function updateShippingMethod(
  db: Firestore,
  id: string,
  input: Partial<ShippingMethodWriteInput>,
): Promise<void> {
  await updateDoc(doc(db, 'shippingMethods', id), input);
}

export async function deleteShippingMethod(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, 'shippingMethods', id));
}
