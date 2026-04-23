import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  type Firestore,
  type QueryDocumentSnapshot,
  type DocumentSnapshot,
} from 'firebase/firestore';
import type { Product } from '../types';

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  isNew?: boolean;
  limited?: boolean;
}

function docToProduct(docSnap: QueryDocumentSnapshot | DocumentSnapshot): Product {
  const data = docSnap.data()!;
  return {
    id: docSnap.id,
    name: data.name,
    brand: data.brand,
    description: data.description,
    shortDescription: data.shortDescription,
    details: data.details,
    price: data.price,
    images: data.images || [],
    category: data.category,
    isNew: data.isNew ?? false,
    limited: data.limited ?? false,
    sizes: data.sizes || [],
    color: data.color || '',
    colorVariants: data.colorVariants,
    stock: data.stock || {},
    isActive: data.isActive ?? true,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function getProducts(
  db: Firestore,
  filters?: ProductFilters,
  max = 500,
): Promise<Product[]> {
  const products = collection(db, 'products');
  const constraints: Parameters<typeof query>[1][] = [where('isActive', '==', true)];
  if (filters?.category) constraints.push(where('category', '==', filters.category));
  if (filters?.isNew) constraints.push(where('isNew', '==', true));
  if (filters?.limited) constraints.push(where('limited', '==', true));

  const q = query(products, ...constraints, orderBy('createdAt', 'desc'), firestoreLimit(max));
  const snapshot = await getDocs(q);
  let list = snapshot.docs.map(docToProduct);
  if (filters?.minPrice !== undefined) list = list.filter((p) => p.price >= filters.minPrice!);
  if (filters?.maxPrice !== undefined) list = list.filter((p) => p.price <= filters.maxPrice!);
  if (filters?.sizes?.length) {
    list = list.filter((p) => p.sizes?.some((s) => filters.sizes!.includes(s)));
  }
  return list;
}

export async function getProductById(db: Firestore, id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, 'products', id));
  if (!snap.exists()) return null;
  return docToProduct(snap);
}

export async function getProductsByIds(db: Firestore, ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));
  const out: Product[] = [];
  for (const chunk of chunks) {
    const q = query(
      collection(db, 'products'),
      where('__name__', 'in', chunk),
      where('isActive', '==', true),
    );
    const snap = await getDocs(q);
    out.push(...snap.docs.map(docToProduct));
  }
  return out;
}

/** List every product (admin-only). */
export async function listAllProducts(db: Firestore): Promise<Product[]> {
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(docToProduct);
}

export type ProductWriteInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export async function createProduct(
  db: Firestore,
  data: ProductWriteInput,
  /** Optional document ID; if omitted, Firestore assigns one. */
  id?: string,
): Promise<string> {
  const now = Timestamp.now();
  const payload = { ...data, createdAt: now, updatedAt: now };
  if (id) {
    await setDoc(doc(db, 'products', id), payload);
    return id;
  }
  const ref = await addDoc(collection(db, 'products'), payload);
  return ref.id;
}

export async function updateProduct(
  db: Firestore,
  id: string,
  data: Partial<ProductWriteInput>,
): Promise<void> {
  await updateDoc(doc(db, 'products', id), { ...data, updatedAt: Timestamp.now() });
}

export async function deleteProduct(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, 'products', id));
}

export async function getRelatedProducts(
  db: Firestore,
  category: string,
  excludeId?: string,
  limit = 4,
): Promise<Product[]> {
  const q = query(
    collection(db, 'products'),
    where('isActive', '==', true),
    where('category', '==', category),
    firestoreLimit(limit + 1),
  );
  const snap = await getDocs(q);
  let list = snap.docs.map(docToProduct);
  if (excludeId) list = list.filter((p) => p.id !== excludeId);
  return list.slice(0, limit);
}
