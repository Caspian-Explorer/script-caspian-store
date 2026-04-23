import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { FaqItem } from '../types';
import { stripUndefined } from '../utils/strip-undefined';

function docToFaq(snap: QueryDocumentSnapshot): FaqItem {
  const data = snap.data();
  return {
    id: snap.id,
    category: data.category ?? '',
    question: data.question ?? '',
    answer: data.answer ?? '',
    order: data.order ?? 0,
  };
}

export async function listFaqs(db: Firestore): Promise<FaqItem[]> {
  const q = query(collection(db, 'faqs'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(docToFaq);
}

export type FaqWriteInput = Omit<FaqItem, 'id'>;

export async function createFaq(db: Firestore, input: FaqWriteInput, id?: string): Promise<string> {
  const payload = stripUndefined({ ...input });
  if (id) {
    await setDoc(doc(db, 'faqs', id), payload);
    return id;
  }
  const ref = await addDoc(collection(db, 'faqs'), payload);
  return ref.id;
}

export async function updateFaq(
  db: Firestore,
  id: string,
  input: Partial<FaqWriteInput>,
): Promise<void> {
  await updateDoc(doc(db, 'faqs', id), stripUndefined({ ...input }));
}

export async function deleteFaq(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, 'faqs', id));
}
