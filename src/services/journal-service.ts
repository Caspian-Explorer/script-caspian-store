import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  type Firestore,
  type QueryDocumentSnapshot,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { caspianCollections } from '../firebase/collections';
import type { JournalArticle } from '../types';
import { stripUndefined } from '../utils/strip-undefined';

function docToArticle(snap: QueryDocumentSnapshot | DocumentSnapshot): JournalArticle {
  const data = snap.data()!;
  return {
    id: snap.id,
    title: data.title,
    excerpt: data.excerpt,
    category: data.category,
    date: data.date,
    imageUrl: data.imageUrl,
    content: data.content,
    createdAt: data.createdAt,
  };
}

export async function listJournalArticles(db: Firestore): Promise<JournalArticle[]> {
  const q = query(caspianCollections(db).journal, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(docToArticle);
}

export async function getJournalArticle(db: Firestore, id: string): Promise<JournalArticle | null> {
  const snap = await getDoc(doc(db, 'journal', id));
  if (!snap.exists()) return null;
  return docToArticle(snap);
}

export type JournalArticleWriteInput = Omit<JournalArticle, 'id' | 'createdAt'>;

export async function createJournalArticle(
  db: Firestore,
  input: JournalArticleWriteInput,
  id?: string,
): Promise<string> {
  const payload = stripUndefined({ ...input, createdAt: Timestamp.now() });
  if (id) {
    await setDoc(doc(db, 'journal', id), payload);
    return id;
  }
  const ref = await addDoc(caspianCollections(db).journal, payload);
  return ref.id;
}

export async function updateJournalArticle(
  db: Firestore,
  id: string,
  input: Partial<JournalArticleWriteInput>,
): Promise<void> {
  await updateDoc(doc(db, 'journal', id), stripUndefined({ ...input }));
}

export async function deleteJournalArticle(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, 'journal', id));
}
