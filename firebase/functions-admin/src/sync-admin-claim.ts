import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';

/**
 * Keep the Firebase Auth custom claim `role` in sync with `users/{uid}.role`.
 *
 * The library's storage.rules + firestore.rules check
 * `request.auth.token.role == 'admin'` first (with a Firestore fallback for
 * migration safety). The claim is set:
 *
 *   - by `claimAdmin` (callable) when an admin promotes themselves via the UI
 *   - by `onUserCreate` (Firestore trigger) when the first signup auto-promotes
 *   - by `firebase/seed/grant-admin.mjs` (now CLI-side too)
 *
 * But there are still ways the Firestore `role` field gets written without
 * going through any of those — directly editing the Firestore console,
 * importing data, the v8.4.1 backfill script, a future admin CRUD page, etc.
 * This trigger is the safety net: every time a `users/{uid}` doc changes, we
 * reconcile the custom claim with whatever Firestore now says. Idempotent —
 * if the claim is already correct, this is a no-op.
 */
export const syncAdminClaim = onDocumentWritten('users/{uid}', async (event) => {
  const uid = event.params.uid;
  const after = event.data?.after.data();
  const before = event.data?.before.data();

  const newRole = after?.role;
  const oldRole = before?.role;
  if (newRole === oldRole) return;

  let userRecord;
  try {
    userRecord = await getAuth().getUser(uid);
  } catch (error) {
    // The Firestore doc can outlive the Auth user (e.g. account deletion in
    // flight, or a stale doc from a deleted test user). Nothing to sync.
    logger.warn(`[syncAdminClaim] Auth user not found for uid=${uid}; skipping.`, error);
    return;
  }

  const existingClaims = userRecord.customClaims ?? {};
  const claimRole = (existingClaims as { role?: string }).role;

  if (newRole === 'admin' && claimRole !== 'admin') {
    await getAuth().setCustomUserClaims(uid, { ...existingClaims, role: 'admin' });
    logger.info(`[syncAdminClaim] Set role='admin' custom claim for uid=${uid}.`);
    return;
  }

  if (newRole !== 'admin' && claimRole === 'admin') {
    const { role: _drop, ...rest } = existingClaims as { role?: string };
    void _drop;
    await getAuth().setCustomUserClaims(uid, rest);
    logger.info(`[syncAdminClaim] Cleared role='admin' custom claim for uid=${uid}.`);
  }
});
