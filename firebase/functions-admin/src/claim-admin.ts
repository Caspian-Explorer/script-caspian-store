import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Callable that promotes the caller to admin, **only if no admin exists yet**.
 *
 * Closes the chicken-and-egg gap that `onUserCreate` can't: if the installer
 * registered before deploying the trigger, the trigger never fires for their
 * `users/{uid}` doc (it's only `onCreate`, not `onExisting`). This callable
 * runs on demand — wired to the "Claim admin role" button in the AdminGuard
 * access-denied screen — and checks the same safety invariant in-line.
 *
 * Failure modes:
 *   unauthenticated     — caller isn't signed in.
 *   failed-precondition — an admin already exists; the bootstrap window
 *                         has closed. Use the `grant-admin` CLI or
 *                         edit Firestore directly instead.
 *   not-found           — the caller's users/{uid} doc doesn't exist yet.
 *                         (Shouldn't happen — auth-context creates it on
 *                         first sign-in — but guard explicitly so this
 *                         callable never creates an unintended doc.)
 */
export const claimAdmin = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in before claiming admin.');
  }
  const uid = request.auth.uid;
  const db = getFirestore();

  const existingAdmins = await db
    .collection('users')
    .where('role', '==', 'admin')
    .limit(1)
    .get();
  if (!existingAdmins.empty) {
    throw new HttpsError(
      'failed-precondition',
      'Admin role is already assigned. Use the grant-admin CLI or the Firestore console.',
    );
  }

  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new HttpsError(
      'not-found',
      'Your user profile has not been created yet. Reload the page and try again.',
    );
  }

  await userRef.update({ role: 'admin' });
  logger.info(`[claimAdmin] Promoted ${uid} to admin via callable.`);
  return { ok: true };
});
