import {
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  limit as firestoreLimit,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { caspianCollections } from '../firebase/collections';
import type { ProductCollectionDoc } from '../types';
import { stripUndefined } from '../utils/strip-undefined';

function docToCollection(snap: QueryDocumentSnapshot): ProductCollectionDoc {
  const data = snap.data();
  return {
    id: snap.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    imageUrl: data.imageUrl,
    productIds: data.productIds ?? [],
    isActive: data.isActive ?? true,
    isFeatured: data.isFeatured ?? false,
    order: data.order ?? 0,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function listProductCollections(db: Firestore): Promise<ProductCollectionDoc[]> {
  const q = query(caspianCollections(db).productCollections, orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(docToCollection);
}

export async function getProductCollectionBySlug(
  db: Firestore,
  slug: string,
): Promise<ProductCollectionDoc | null> {
  const q = query(
    caspianCollections(db).productCollections,
    where('slug', '==', slug),
    where('isActive', '==', true),
    firestoreLimit(1),
  );
  const snap = await getDocs(q);
  const first = snap.docs[0];
  return first ? docToCollection(first) : null;
}

export type ProductCollectionWriteInput = Omit<
  ProductCollectionDoc,
  'id' | 'createdAt' | 'updatedAt'
>;

export async function createProductCollection(
  db: Firestore,
  input: ProductCollectionWriteInput,
  id?: string,
): Promise<string> {
  const now = Timestamp.now();
  const payload = stripUndefined({ ...input, createdAt: now, updatedAt: now });
  if (id) {
    await setDoc(doc(db, 'productCollections', id), payload);
    return id;
  }
  const ref = await addDoc(caspianCollections(db).productCollections, payload);
  return ref.id;
}

export async function updateProductCollection(
  db: Firestore,
  id: string,
  input: Partial<ProductCollectionWriteInput>,
): Promise<void> {
  await updateDoc(
    doc(db, 'productCollections', id),
    stripUndefined({ ...input, updatedAt: Timestamp.now() }),
  );
}

export async function deleteProductCollection(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, 'productCollections', id));
}
