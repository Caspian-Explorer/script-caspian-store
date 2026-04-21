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
  if (id) {
    await setDoc(doc(db, 'faqs', id), input);
    return id;
  }
  const ref = await addDoc(collection(db, 'faqs'), input);
  return ref.id;
}

export async function updateFaq(
  db: Firestore,
  id: string,
  input: Partial<FaqWriteInput>,
): Promise<void> {
  await updateDoc(doc(db, 'faqs', id), input);
}

export async function deleteFaq(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, 'faqs', id));
}
