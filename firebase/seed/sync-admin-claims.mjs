#!/usr/bin/env node
/**
 * One-time backfill: set the Firebase Auth custom claim `role` for every
 * user whose Firestore `users/{uid}.role` is `'admin'`.
 *
 * v8.5.0 introduced custom-claims-based admin authorization in storage.rules
 * + firestore.rules (so cross-service Firestore reads aren't required on
 * every storage write). Admins promoted before v8.5.0 only have the
 * Firestore field set — they keep working via the rule's Firestore
 * fallback, but every admin write hits Firestore. Running this script
 * upgrades them to the fast path; subsequent rule evaluations short-
 * circuit on the claim and never read Firestore.
 *
 * Idempotent — if the claim is already set, the script logs "ok" and
 * moves on. Also safely handles users whose Auth account no longer
 * exists (Firestore doc lingering after a delete).
 *
 * Usage:
 *   node firebase/seed/sync-admin-claims.mjs \
 *     --project my-firebase-project-id \
 *     --credentials ./service-account.json \
 *     [--dry-run]
 *
 * After running, each affected admin must sign out + back in (or call
 * `auth.currentUser.getIdToken(true)` from the client) to pick up the
 * new claim on their ID token.
 */

import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
  options: {
    project: { type: 'string' },
    credentials: { type: 'string' },
    'dry-run': { type: 'boolean' },
  },
});

let admin;
try {
  admin = await import('firebase-admin');
} catch {
  console.error(
    '[sync-admin-claims] firebase-admin is not installed. Run `npm install --no-save firebase-admin` and re-run.',
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
const dryRun = Boolean(args['dry-run']);

const adminsSnap = await db.collection('users').where('role', '==', 'admin').get();
if (adminsSnap.empty) {
  console.log('[sync-admin-claims] No admins found in Firestore. Nothing to backfill.');
  process.exit(0);
}

console.log(
  `[sync-admin-claims] Found ${adminsSnap.size} admin(s) in Firestore.${dryRun ? ' (dry run)' : ''}`,
);

let setCount = 0;
let okCount = 0;
let missingCount = 0;
let errorCount = 0;

for (const doc of adminsSnap.docs) {
  const uid = doc.id;
  let userRecord;
  try {
    userRecord = await auth.getUser(uid);
  } catch (error) {
    if (error?.code === 'auth/user-not-found') {
      console.warn(`[sync-admin-claims] uid=${uid}: Auth user not found (stale Firestore doc); skipping.`);
      missingCount += 1;
      continue;
    }
    console.error(`[sync-admin-claims] uid=${uid}: getUser failed:`, error);
    errorCount += 1;
    continue;
  }

  const existing = userRecord.customClaims ?? {};
  if (existing.role === 'admin') {
    console.log(`[sync-admin-claims] uid=${uid}: claim already set, ok.`);
    okCount += 1;
    continue;
  }

  if (dryRun) {
    console.log(`[sync-admin-claims] uid=${uid}: WOULD set role='admin' (dry-run).`);
    setCount += 1;
    continue;
  }

  try {
    await auth.setCustomUserClaims(uid, { ...existing, role: 'admin' });
    console.log(`[sync-admin-claims] uid=${uid}: role='admin' claim set.`);
    setCount += 1;
  } catch (error) {
    console.error(`[sync-admin-claims] uid=${uid}: setCustomUserClaims failed:`, error);
    errorCount += 1;
  }
}

console.log(
  `[sync-admin-claims] Done. set=${setCount}  already-ok=${okCount}  missing=${missingCount}  errored=${errorCount}`,
);
console.log(
  `[sync-admin-claims] Affected admins must sign out + back in (or call \`auth.currentUser.getIdToken(true)\`) to pick up the new claim.`,
);
process.exit(errorCount > 0 ? 1 : 0);
