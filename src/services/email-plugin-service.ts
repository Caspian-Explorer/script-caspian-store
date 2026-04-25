import {
  addDoc,
  deleteDoc,
  doc,
  getDocs,
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
import type { EmailPluginInstall } from '../types';
import { stripUndefined } from '../utils/strip-undefined';

function docToInstall(snap: QueryDocumentSnapshot): EmailPluginInstall {
  const data = snap.data();
  return {
    id: snap.id,
    pluginId: data.pluginId ?? '',
    name: data.name ?? '',
    enabled: data.enabled ?? false,
    order: data.order ?? 0,
    config: (data.config ?? {}) as Record<string, unknown>,
    createdAt: data.createdAt,
  };
}

export async function listEmailPluginInstalls(
  db: Firestore,
  opts: { onlyEnabled?: boolean } = {},
): Promise<EmailPluginInstall[]> {
  const constraints = opts.onlyEnabled
    ? [where('enabled', '==', true), orderBy('order', 'asc')]
    : [orderBy('order', 'asc')];
  const snap = await getDocs(query(caspianCollections(db).emailPluginInstalls, ...constraints));
  return snap.docs.map(docToInstall);
}

export type EmailPluginInstallWriteInput = Omit<EmailPluginInstall, 'id' | 'createdAt'>;

export async function createEmailPluginInstall(
  db: Firestore,
  input: EmailPluginInstallWriteInput,
  id?: string,
): Promise<string> {
  const payload = stripUndefined({ ...input, createdAt: Timestamp.now() });
  if (id) {
    await setDoc(doc(db, 'emailPluginInstalls', id), payload);
    return id;
  }
  const ref = await addDoc(caspianCollections(db).emailPluginInstalls, payload);
  return ref.id;
}

export async function updateEmailPluginInstall(
  db: Firestore,
  id: string,
  input: Partial<EmailPluginInstallWriteInput>,
): Promise<void> {
  await updateDoc(doc(db, 'emailPluginInstalls', id), stripUndefined({ ...input }));
}

export async function deleteEmailPluginInstall(
  db: Firestore,
  id: string,
): Promise<void> {
  await deleteDoc(doc(db, 'emailPluginInstalls', id));
}
