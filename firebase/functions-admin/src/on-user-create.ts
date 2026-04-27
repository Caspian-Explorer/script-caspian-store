import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';
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

  // Mirror the role into a Firebase Auth custom claim so storage.rules +
  // firestore.rules can authorize without a cross-service Firestore read
  // (v8.4.1+). Preserve any existing claims set by other processes.
  const uid = event.params.uid;
  const userRecord = await getAuth().getUser(uid);
  await getAuth().setCustomUserClaims(uid, {
    ...(userRecord.customClaims ?? {}),
    role: 'admin',
  });

  logger.info(`[onUserCreate] First user promoted to admin (role + custom claim): uid=${uid}.`);
});
