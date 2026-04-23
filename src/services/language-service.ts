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
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { LanguageDoc } from '../types';
import { stripUndefined } from '../utils/strip-undefined';

function docToLanguage(snap: QueryDocumentSnapshot): LanguageDoc {
  const data = snap.data();
  return {
    id: snap.id,
    code: data.code,
    name: data.name,
    nativeName: data.nativeName,
    flag: data.flag,
    isDefault: data.isDefault ?? false,
    isActive: data.isActive ?? true,
    direction: data.direction ?? 'ltr',
    order: data.order ?? 0,
    updatedAt: data.updatedAt,
  };
}

export async function listLanguages(db: Firestore): Promise<LanguageDoc[]> {
  const q = query(collection(db, 'languages'), orderBy('order', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(docToLanguage);
}

export type LanguageWriteInput = Omit<LanguageDoc, 'id' | 'updatedAt'>;

export async function createLanguage(
  db: Firestore,
  input: LanguageWriteInput,
  id?: string,
): Promise<string> {
  const payload = stripUndefined({ ...input, updatedAt: Timestamp.now() });
  if (id) {
    await setDoc(doc(db, 'languages', id), payload);
    return id;
  }
  const ref = await addDoc(collection(db, 'languages'), payload);
  return ref.id;
}

export async function updateLanguage(
  db: Firestore,
  id: string,
  input: Partial<LanguageWriteInput>,
): Promise<void> {
  await updateDoc(
    doc(db, 'languages', id),
    stripUndefined({ ...input, updatedAt: Timestamp.now() }),
  );
}

export async function deleteLanguage(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, 'languages', id));
}
