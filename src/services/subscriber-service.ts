import {
  addDoc,
  collection,
  getDocs,
  limit,
  query,
  Timestamp,
  where,
  type Firestore,
} from 'firebase/firestore';

export type SubscribeResult = 'subscribed' | 'already-subscribed';

/**
 * Newsletter signup. Idempotent: if the email is already in the `subscribers`
 * collection it returns `'already-subscribed'` instead of adding a duplicate.
 */
export async function subscribeEmail(db: Firestore, email: string): Promise<SubscribeResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) throw new Error('Email is required.');

  const existing = await getDocs(
    query(collection(db, 'subscribers'), where('email', '==', normalized), limit(1)),
  );
  if (!existing.empty) return 'already-subscribed';

  await addDoc(collection(db, 'subscribers'), {
    email: normalized,
    subscribedAt: Timestamp.now(),
  });
  return 'subscribed';
}
