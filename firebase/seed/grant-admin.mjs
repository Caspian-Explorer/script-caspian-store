#!/usr/bin/env node
/**
 * Grants admin role on a Firestore user doc.
 *
 * Usage:
 *   node firebase/seed/grant-admin.mjs \
 *     --project my-firebase-project-id \
 *     --credentials ./service-account.json \
 *     --email you@example.com
 *
 *   # or, if you already know the uid (e.g. copied from <AdminGuard>'s
 *   # access-denied screen):
 *   node firebase/seed/grant-admin.mjs \
 *     --project my-firebase-project-id \
 *     --credentials ./service-account.json \
 *     --uid <firebase-auth-uid>
 *
 * Exactly one of --uid or --email is required. When --email is used, the
 * script resolves the uid via firebase-admin/auth before writing to Firestore.
 *
 * Requires the target user to have signed in at least once (so the client has
 * created their users/{uid} doc).
 */

import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
  options: {
    project: { type: 'string' },
    credentials: { type: 'string' },
    uid: { type: 'string' },
    email: { type: 'string' },
  },
});

if ((!args.uid && !args.email) || (args.uid && args.email)) {
  console.error('[grant-admin] Pass exactly one of --uid <uid> or --email <address>.');
  process.exit(1);
}

let admin;
try {
  admin = await import('firebase-admin');
} catch {
  console.error(
    '[grant-admin] firebase-admin is not installed. Run `npm install --no-save firebase-admin` and re-run.',
  );
  process.exit(1);
}

const credentialsPath = args.credentials ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (credentialsPath) {
  const serviceAccount = JSON.parse(readFileSync(credentialsPath, 'utf8'));
  admin.default.initializeApp({
    credential: admin.default.credential.cert(serviceAccount),
    projectId: args.project ?? serviceAccount.project_id,
  });
} else {
  admin.default.initializeApp({ projectId: args.project });
}

const auth = admin.default.auth();
const db = admin.default.firestore();

let uid = args.uid;
if (!uid && args.email) {
  try {
    const record = await auth.getUserByEmail(args.email);
    uid = record.uid;
  } catch {
    console.error(`[grant-admin] No Firebase Auth user found for email: ${args.email}`);
    process.exit(1);
  }
}

const ref = db.collection('users').doc(uid);
const snap = await ref.get();
if (!snap.exists) {
  console.error(
    `[grant-admin] users/${uid} doc does not exist. Has the user signed in at least once? ` +
      `(The client creates this doc on first auth.)`,
  );
  process.exit(1);
}

await ref.set({ role: 'admin' }, { merge: true });
console.log(`[grant-admin] users/${uid}.role = 'admin'`);
process.exit(0);
