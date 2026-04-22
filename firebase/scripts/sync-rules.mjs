#!/usr/bin/env node
/**
 * sync-rules.mjs — copies Firestore / Storage rules and indexes from the
 * installed `@caspian-explorer/script-caspian-store` package into the
 * consumer's project root.
 *
 * Why this exists: `npm install <new-version>` updates
 * `node_modules/@caspian-explorer/script-caspian-store/firebase/*`, but the
 * consumer's own `firestore.rules` / `firestore.indexes.json` / `storage.rules`
 * at the project root are what `firebase deploy` actually reads. Without a
 * sync step, those root files drift — the consumer thinks they've upgraded
 * but is still deploying yesterday's rules.
 *
 * Usage (from the consumer project root):
 *   npm run firebase:sync
 *
 * Which resolves to:
 *   node node_modules/@caspian-explorer/script-caspian-store/firebase/scripts/sync-rules.mjs
 *
 * Exit code: 0 on success, 1 if any source file is missing.
 *
 * **Overwrite warning:** this copies the library's rules verbatim. If you
 * hand-edited your root `firestore.rules` to add custom rules, running sync
 * will blow those away. Merge by hand in that case.
 */

import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve the library's firebase/ dir from this script's location.
// This file lives at <lib>/firebase/scripts/sync-rules.mjs, so ../ is the firebase/ dir.
const libFirebaseDir = resolve(__dirname, '..');
const consumerRoot = process.cwd();

const files = [
  'firestore.rules',
  'firestore.indexes.json',
  'storage.rules',
];

let missing = 0;
for (const name of files) {
  const src = join(libFirebaseDir, name);
  const dst = join(consumerRoot, name);
  if (!existsSync(src)) {
    console.error(`[firebase:sync] MISSING from library: ${src}`);
    missing++;
    continue;
  }
  copyFileSync(src, dst);
  const bytes = readFileSync(dst).length;
  console.log(`[firebase:sync] ✔ ${name}  (${bytes} bytes)`);
}

if (missing > 0) {
  console.error(`[firebase:sync] ${missing} source file(s) missing — check your @caspian-explorer/script-caspian-store install.`);
  process.exit(1);
}

console.log('');
console.log('[firebase:sync] Synced. Re-run `firebase deploy --only firestore:rules,firestore:indexes,storage` to apply.');
console.log('[firebase:sync] If you had hand-edited any of these files, your changes were overwritten — merge manually from git history if needed.');
