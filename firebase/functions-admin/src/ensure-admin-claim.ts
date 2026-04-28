import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Idempotent self-heal callable: mirrors `users/{caller.uid}.role` to the
 * caller's Firebase Auth custom claim.
 *
 * Why this exists: `syncAdminClaim` (the Firestore trigger) only fires on
 * NEW writes to `users/{uid}`. Admins whose role was set BEFORE the
 * trigger was deployed don't have the claim and the trigger will never
 * fire for them — they were stuck in the `claimNotSet` diagnosis path
 * unless they ran the `sync-admin-claims.mjs` backfill script. v8.8.0
 * lets the library call this from `<AuthProvider>` and `<ImageUploadField>`
 * to auto-heal that case without a CLI step.
 *
 * Safety: the callable mirrors what's ALREADY in Firestore — it does not
 * accept any payload, never escalates privilege beyond what `users/{uid}.role`
 * already says. If the caller's Firestore doc says `customer`, this is a
 * no-op and the existing claim (if any) is removed.
 *
 * Failure modes:
 *   unauthenticated     — caller isn't signed in.
 *   not-found           — caller's `users/{uid}` doc doesn't exist.
 *
 * Returns `{ ok, role, claimSet, requiresTokenRefresh }` so callers can
 * decide whether to force `auth.currentUser.getIdToken(true)`.
 */
export const ensureAdminClaim = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in before calling ensureAdminClaim.');
  }
  const uid = request.auth.uid;
  const db = getFirestore();
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError(
      'not-found',
      'Your user profile has not been created yet. Reload the page and try again.',
    );
  }

  const role = (userSnap.data()?.role as string | undefined) ?? 'customer';
  const userRecord = await getAuth().getUser(uid);
  const existing = userRecord.customClaims ?? {};
  const currentClaim = existing.role as string | undefined;

  // No-op fast path: claim already matches Firestore.
  if (currentClaim === role || (role !== 'admin' && currentClaim === undefined)) {
    return { ok: true, role, claimSet: false, requiresTokenRefresh: false };
  }

  if (role === 'admin') {
    await getAuth().setCustomUserClaims(uid, { ...existing, role: 'admin' });
    logger.info(`[ensureAdminClaim] Set role='admin' claim for uid=${uid}.`);
    return { ok: true, role, claimSet: true, requiresTokenRefresh: true };
  }

  // role isn't admin but a stale admin claim is on the token — strip it.
  const next: Record<string, unknown> = { ...existing };
  delete next.role;
  await getAuth().setCustomUserClaims(uid, next);
  logger.info(`[ensureAdminClaim] Cleared stale role claim for uid=${uid} (Firestore role=${role}).`);
  return { ok: true, role, claimSet: false, requiresTokenRefresh: true };
});
