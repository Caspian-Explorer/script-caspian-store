import {
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type CollectionReference,
  type Firestore,
} from 'firebase/firestore';
import { caspianCollections } from '../firebase/collections';
import { DEFAULT_SCRIPT_SETTINGS, type AdminTodo } from '../types';

/**
 * One-shot detectors for the first-run checklist in `<AdminTodoPage>`.
 * Each returns `true` when the work behind that todo has been observably
 * done from a Firestore snapshot. Deploy-related items
 * (`deploy-firestore-rules`, `deploy-storage-rules`, `deploy-cloud-functions`,
 * `configure-stripe-webhook`) are **not** detectable from Firestore and are
 * intentionally absent — the admin ticks those manually.
 */

async function hasAnyDoc(ref: CollectionReference): Promise<boolean> {
  const snap = await getDocs(query(ref, limit(1)));
  return !snap.empty;
}

async function hasEditedSiteSettings(db: Firestore): Promise<boolean> {
  const snap = await getDoc(doc(db, 'settings', 'site'));
  if (!snap.exists()) return false;
  const data = snap.data();
  const brandName = typeof data.brandName === 'string' ? data.brandName.trim() : '';
  // Ship defaults use "My Store" — anything else counts as edited.
  return brandName !== '' && brandName !== 'My Store';
}

async function hasMultipleActiveLanguages(db: Firestore): Promise<boolean> {
  const snap = await getDocs(
    query(caspianCollections(db).languages, where('isActive', '==', true), limit(2)),
  );
  return snap.size >= 2;
}

async function hasEditedHero(db: Firestore): Promise<boolean> {
  const snap = await getDoc(doc(db, 'scriptSettings', 'site'));
  if (!snap.exists()) return false;
  const hero = snap.data().hero as { title?: string } | undefined;
  const title = hero?.title?.trim() ?? '';
  const defaultTitle = DEFAULT_SCRIPT_SETTINGS.hero?.title ?? '';
  return title !== '' && title !== defaultTitle;
}

async function hasFeaturedCategory(db: Firestore): Promise<boolean> {
  const snap = await getDocs(
    query(caspianCollections(db).productCategories, where('isFeatured', '==', true), limit(1)),
  );
  return !snap.empty;
}

/**
 * Maps each seeded todo id to its detector. If a seeded id isn't in the map,
 * it's treated as manual (admin must check it off themselves).
 */
const DETECTORS: Record<string, (db: Firestore) => Promise<boolean>> = {
  'grant-admin-role': async () => true, // Tautological: only admins reach this page.
  'edit-site-settings': hasEditedSiteSettings,
  'activate-languages': hasMultipleActiveLanguages,
  'seed-categories': (db) => hasAnyDoc(caspianCollections(db).productCategories),
  'seed-products': (db) => hasAnyDoc(caspianCollections(db).products),
  'verify-shipping-plugins': (db) => hasAnyDoc(caspianCollections(db).shippingPluginInstalls),
  'edit-homepage-hero': hasEditedHero,
  'pin-featured-categories': hasFeaturedCategory,
};

/**
 * Runs every detector whose id matches a todo in the given list and returns
 * the ids that should flip to `done: true`. Intentionally returns only
 * currently-undone todos — already-done items aren't reported so callers
 * don't issue redundant writes.
 */
export async function verifyAdminTodos(
  db: Firestore,
  todos: AdminTodo[],
): Promise<string[]> {
  const undoneById = new Map<string, AdminTodo>();
  for (const t of todos) if (!t.done) undoneById.set(t.id, t);

  const checks = [...undoneById.keys()]
    .filter((id) => id in DETECTORS)
    .map(async (id) => {
      try {
        const done = await DETECTORS[id](db);
        return done ? id : null;
      } catch (error) {
        console.error(`[caspian-store] Detector for "${id}" failed:`, error);
        return null;
      }
    });

  const results = await Promise.all(checks);
  return results.filter((id): id is string => id !== null);
}

/** Exposed for testing / inspection. */
export const AUTO_DETECTABLE_TODO_IDS = Object.keys(DETECTORS);
