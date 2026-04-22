import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Auto-promote the first-ever user to admin.
 *
 * Fires when a document is created at `users/{uid}`. Before promoting, we
 * check whether any admin already exists — if so, this is not the first user
 * and the doc is left untouched.
 *
 * Race-window caveat: if a malicious actor registers between "function
 * deployed" and "installer registers their own account," they win the role.
 * Mitigate by deploying the trigger immediately before the installer signs
 * up, or leave this function disabled and grant admin via the CLI
 * (`firebase/seed/grant-admin.mjs`).
 */
export const onUserCreate = onDocumentCreated('users/{uid}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const db = getFirestore();
  const existingAdmins = await db
    .collection('users')
    .where('role', '==', 'admin')
    .limit(1)
    .get();

  if (!existingAdmins.empty) {
    logger.info(
      `[onUserCreate] Skipping promote: admin already exists (uid=${event.params.uid}).`,
    );
    return;
  }

  await snap.ref.update({ role: 'admin' });
  logger.info(`[onUserCreate] First user promoted to admin: uid=${event.params.uid}.`);
});
