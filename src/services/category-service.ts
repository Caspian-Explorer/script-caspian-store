import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { ProductCategoryDoc } from '../types';

function docToCategory(docSnap: QueryDocumentSnapshot): ProductCategoryDoc {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    order: data.order ?? 0,
    isActive: data.isActive ?? true,
    isFeatured: data.isFeatured ?? false,
    imageUrl: data.imageUrl,
    parentId: data.parentId ?? null,
    path: data.path,
    depth: data.depth,
    createdAt: data.createdAt,
  };
}

/** Active categories ordered by their configured `order`. */
export async function listActiveCategories(db: Firestore): Promise<ProductCategoryDoc[]> {
  const q = query(
    collection(db, 'productCategories'),
    where('isActive', '==', true),
    orderBy('order', 'asc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(docToCategory);
}

/** Featured + active categories, ordered — used on the homepage. */
export async function getFeaturedCategories(db: Firestore): Promise<ProductCategoryDoc[]> {
  const list = await listActiveCategories(db);
  return list.filter((cat) => cat.isFeatured === true);
}
