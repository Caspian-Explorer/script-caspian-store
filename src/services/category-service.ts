import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  setDoc,
  Timestamp,
  updateDoc,
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

/** All categories, ordered — used by the admin page. */
export async function listAllCategories(db: Firestore): Promise<ProductCategoryDoc[]> {
  const q = query(collection(db, 'productCategories'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(docToCategory);
}

export type CategoryWriteInput = Omit<ProductCategoryDoc, 'id' | 'createdAt'>;

export async function createCategory(
  db: Firestore,
  input: CategoryWriteInput,
  id?: string,
): Promise<string> {
  const payload = { ...input, createdAt: Timestamp.now() };
  if (id) {
    await setDoc(doc(db, 'productCategories', id), payload);
    return id;
  }
  const ref = await addDoc(collection(db, 'productCategories'), payload);
  return ref.id;
}

export async function updateCategory(
  db: Firestore,
  id: string,
  input: Partial<CategoryWriteInput>,
): Promise<void> {
  await updateDoc(doc(db, 'productCategories', id), input);
}

export async function deleteCategory(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, 'productCategories', id));
}
