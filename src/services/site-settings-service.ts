import { doc, getDoc, setDoc, type Firestore } from 'firebase/firestore';
import type { SiteSettings } from '../types';
import { stripUndefined } from '../utils/strip-undefined';

/**
 * Loads the site-level settings doc (`settings/site`) that stores brand /
 * contact / logo / favicon / social links. Distinct from `scriptSettings/site`
 * (which holds theme + features + hero + fonts managed by the package).
 */
export async function getSiteSettings(db: Firestore): Promise<SiteSettings | null> {
  const snap = await getDoc(doc(db, 'settings', 'site'));
  if (!snap.exists()) return null;
  return snap.data() as SiteSettings;
}

export async function saveSiteSettings(db: Firestore, input: SiteSettings): Promise<void> {
  await setDoc(doc(db, 'settings', 'site'), stripUndefined({ ...input }));
}
