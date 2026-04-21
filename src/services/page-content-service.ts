import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp,
  type Firestore,
  type QueryDocumentSnapshot,
  type DocumentSnapshot,
} from 'firebase/firestore';
import type { PageContent } from '../types';

function docToPageContent(snap: QueryDocumentSnapshot | DocumentSnapshot): PageContent {
  const data = snap.data()!;
  return {
    id: snap.id,
    pageKey: data.pageKey ?? snap.id,
    title: data.title,
    subtitle: data.subtitle,
    content: data.content,
    updatedAt: data.updatedAt,
  };
}

/** Load a single page by its pageKey. Returns null if no doc exists yet. */
export async function getPageContent(
  db: Firestore,
  pageKey: string,
): Promise<PageContent | null> {
  const snap = await getDoc(doc(db, 'pageContents', pageKey));
  if (!snap.exists()) return null;
  return docToPageContent(snap);
}

export async function listPageContents(db: Firestore): Promise<PageContent[]> {
  const snap = await getDocs(collection(db, 'pageContents'));
  return snap.docs.map(docToPageContent);
}

export interface SavePageContentInput {
  pageKey: string;
  title: string;
  subtitle?: string;
  content: string;
}

export async function savePageContent(db: Firestore, input: SavePageContentInput): Promise<void> {
  await setDoc(doc(db, 'pageContents', input.pageKey), {
    pageKey: input.pageKey,
    title: input.title,
    subtitle: input.subtitle ?? '',
    content: input.content,
    updatedAt: Timestamp.now(),
  });
}
