import {
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  type Firestore,
  type QueryDocumentSnapshot,
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

function docToProduct(docSnap: QueryDocumentSnapshot): Product {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    brand: data.brand,
    description: data.description,
    price: data.price,
    images: data.images || [],
    category: data.category,
    isNew: data.isNew ?? false,
    limited: data.limited ?? false,
    sizes: data.sizes || [],
    color: data.color || '',
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
  const constraints: Parameters<typeof query>[1][] = [where('isActive', '==', true)];
  if (filters?.category) constraints.push(where('category', '==', filters.category));
  if (filters?.isNew) constraints.push(where('isNew', '==', true));
  if (filters?.limited) constraints.push(where('limited', '==', true));

  const q = query(
    doc(db, 'products', '_sentinel').parent,
    ...constraints,
    orderBy('createdAt', 'desc'),
    firestoreLimit(max),
  );
  const snapshot = await getDocs(q);
  let products = snapshot.docs.map(docToProduct);

  if (filters?.minPrice !== undefined) {
    products = products.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters?.maxPrice !== undefined) {
    products = products.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters?.sizes && filters.sizes.length > 0) {
    products = products.filter((p) =>
      p.sizes?.some((s) => filters.sizes!.includes(s)),
    );
  }
  return products;
}

export async function getProductById(db: Firestore, id: string): Promise<Product | null> {
  const docRef = doc(db, 'products', id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return docToProduct(docSnap as QueryDocumentSnapshot);
}
