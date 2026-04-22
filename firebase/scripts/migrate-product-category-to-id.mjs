#!/usr/bin/env node
/**
 * migrate-product-category-to-id.mjs — one-off migration for v1.22.0.
 *
 * Before v1.22, `products/{id}.category` stored the display name of a category
 * (e.g. "Sneakers"). From v1.22 it stores the category document id. This
 * script walks the `products` collection and rewrites the `category` field
 * from name → id using `productCategories` as the lookup table.
 *
 * Safe properties:
 *   - Idempotent: products whose `category` already matches a known category
 *     id are left untouched.
 *   - Ambiguous matches (two categories with the same name) are flagged and
 *     skipped — the admin must reassign by hand.
 *   - --dry-run mode logs what would change without writing.
 *
 * Usage:
 *   node firebase/scripts/migrate-product-category-to-id.mjs \
 *     --project my-firebase-project-id \
 *     --credentials ./service-account.json \
 *     [--dry-run]
 *
 * Alternatively set GOOGLE_APPLICATION_CREDENTIALS to the service account path.
 */

import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
  options: {
    project: { type: 'string' },
    credentials: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    help: { type: 'boolean', default: false },
  },
});

if (args.help) {
  console.log(
    'Usage: node migrate-product-category-to-id.mjs [--project <id>] [--credentials <path>] [--dry-run]',
  );
  process.exit(0);
}

let admin;
try {
  admin = await import('firebase-admin');
} catch {
  console.error(
    '[migrate] firebase-admin is not installed. Run `npm install --no-save firebase-admin` and re-run.',
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
  admin.default.initializeApp({
    projectId: args.project,
  });
}

const db = admin.default.firestore();
const isDryRun = args['dry-run'];

console.log(`[migrate] ${isDryRun ? 'DRY-RUN: ' : ''}Loading categories + products…`);

const [categoriesSnap, productsSnap] = await Promise.all([
  db.collection('productCategories').get(),
  db.collection('products').get(),
]);

const categoriesById = new Map();
const nameToIds = new Map(); // lowercase name → array of ids (for ambiguity detection)
for (const doc of categoriesSnap.docs) {
  const data = doc.data();
  categoriesById.set(doc.id, data.name ?? doc.id);
  const key = String(data.name ?? '').toLowerCase();
  if (!key) continue;
  const ids = nameToIds.get(key) ?? [];
  ids.push(doc.id);
  nameToIds.set(key, ids);
}

console.log(
  `[migrate] Loaded ${categoriesById.size} categories, ${productsSnap.size} products.`,
);

let rewritten = 0;
let alreadyIdFormat = 0;
let emptyCategory = 0;
let ambiguous = 0;
let unknown = 0;

const batch = db.batch();
let batchCount = 0;
const commits = [];

for (const doc of productsSnap.docs) {
  const data = doc.data();
  const current = typeof data.category === 'string' ? data.category : '';
  if (!current) {
    emptyCategory++;
    continue;
  }
  if (categoriesById.has(current)) {
    alreadyIdFormat++;
    continue;
  }
  const key = current.toLowerCase();
  const matches = nameToIds.get(key) ?? [];
  if (matches.length === 0) {
    console.warn(
      `[migrate] UNKNOWN: product ${doc.id} ("${data.name ?? '?'}") category="${current}" — no matching category; leaving unchanged.`,
    );
    unknown++;
    continue;
  }
  if (matches.length > 1) {
    console.warn(
      `[migrate] AMBIGUOUS: product ${doc.id} ("${data.name ?? '?'}") category="${current}" — matches ${matches.length} categories (${matches.join(', ')}); leaving unchanged, reassign manually.`,
    );
    ambiguous++;
    continue;
  }
  const targetId = matches[0];
  const sourceName = categoriesById.get(targetId);
  console.log(
    `[migrate] REWRITE: product ${doc.id} ("${data.name ?? '?'}") "${current}" → "${targetId}" (${sourceName})`,
  );
  if (!isDryRun) {
    batch.update(doc.ref, { category: targetId });
    batchCount++;
    if (batchCount === 400) {
      commits.push(batch.commit());
      batchCount = 0;
    }
  }
  rewritten++;
}

if (!isDryRun && batchCount > 0) commits.push(batch.commit());
await Promise.all(commits);

console.log('');
console.log('[migrate] Summary:');
console.log(`  Rewritten        : ${rewritten}${isDryRun ? ' (dry-run, no writes)' : ''}`);
console.log(`  Already id format: ${alreadyIdFormat}`);
console.log(`  Empty category   : ${emptyCategory}`);
console.log(`  Ambiguous        : ${ambiguous}  (leave these, reassign in admin)`);
console.log(`  Unknown          : ${unknown}  (create category or reassign in admin)`);

if (isDryRun) {
  console.log('');
  console.log('[migrate] Dry-run complete. Re-run without --dry-run to apply.');
} else {
  console.log('');
  console.log('[migrate] Done.');
}

process.exit(0);
