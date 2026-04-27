import { defineConfig, type Options } from 'tsup';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Sync `src/version.ts` with `package.json#version` so the library can export
// CASPIAN_STORE_VERSION (and the admin About page can compare installed vs
// latest on GitHub) without drifting. Runs on every tsup invocation — build,
// dev, and the `prepare` hook that fires on `npm install`.
const rootPkgVersion = JSON.parse(readFileSync('package.json', 'utf8')).version as string;
const versionFile = join('src', 'version.ts');
const versionContents =
  `// Auto-generated from package.json by tsup.config.ts. Do not edit.\n` +
  `export const CASPIAN_STORE_VERSION = '${rootPkgVersion}';\n`;
const existing = (() => {
  try {
    return readFileSync(versionFile, 'utf8');
  } catch {
    return '';
  }
})();
if (existing !== versionContents) {
  writeFileSync(versionFile, versionContents);
}

// Drift guard for `CASPIAN_STORAGE_RULES`. The constant in `src/firebase/rules.ts`
// is a verbatim string copy of `firebase/storage.rules` (the file consumers
// deploy). Hand-editing one without the other silently ships diverged rules,
// so we fail the build when the bytes don't match. (Storage rules change ~once
// a year, so failing loud beats silent auto-rewrite.) Any literal backslash in
// the rules file is doubled in the JS source — the regex `svg\+xml` is
// `'svg\\\\+xml'` in `rules.ts` and `'svg\\+xml'` on disk — so we compare the
// JS-evaluated string against the disk bytes.
const storageRulesOnDisk = readFileSync(join('firebase', 'storage.rules'), 'utf8');
const rulesTsSource = readFileSync(join('src', 'firebase', 'rules.ts'), 'utf8');
const storageRulesMatch = rulesTsSource.match(
  /export const CASPIAN_STORAGE_RULES = `([\s\S]*?)`;/,
);
if (!storageRulesMatch) {
  throw new Error(
    'tsup.config.ts: could not find CASPIAN_STORAGE_RULES template literal in src/firebase/rules.ts',
  );
}
const storageRulesEvaluated = storageRulesMatch[1].replace(/\\\\/g, '\\');
if (storageRulesEvaluated !== storageRulesOnDisk) {
  throw new Error(
    'tsup.config.ts: CASPIAN_STORAGE_RULES drift — the constant in src/firebase/rules.ts ' +
      'does not match firebase/storage.rules byte-for-byte. Re-sync the constant ' +
      '(remember to double any literal backslashes when copying into the JS template literal).',
  );
}

// All three entries (`.`, `./firebase`, `./server`) ship from a single tsup
// config block. Earlier versions split them into three blocks, which made
// `clean: true` on the main entry race against the sibling entries' DTS
// writes — `dist/firebase/index.d.ts` and `dist/server/index.d.ts` would be
// produced and then wiped before the build settled. Consolidating fixes that:
// one clean, one DTS pass, one set of externals.
//
// The server entry assumes a Node runtime (firebase-admin, node:child_process),
// so those modules are externalised globally. They're harmless for the main
// and firebase entries because neither imports them.
function prependUseClient(format: 'esm' | 'cjs') {
  const ext = format === 'esm' ? 'mjs' : 'js';
  const file = join('dist', `index.${ext}`);
  const contents = readFileSync(file, 'utf8');
  if (!contents.startsWith("'use client'") && !contents.startsWith('"use client"')) {
    writeFileSync(file, `'use client';\n${contents}`);
  }
}

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'firebase/index': 'src/firebase/index.ts',
    'server/index': 'src/server/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  target: 'es2020',
  external: [
    'react',
    'react-dom',
    'firebase',
    'firebase/app',
    'firebase/auth',
    'firebase/firestore',
    'firebase/storage',
    'firebase/functions',
    'firebase-admin',
    'firebase-admin/app',
    'firebase-admin/auth',
    'node:child_process',
  ],
  // Prepend a raw `'use client';` to the main-entry bundles only. esbuild's
  // `banner` strips module-level directives during bundling ("Module level
  // directives cause errors when bundled"), so we patch post-write.
  // Only the main entry is client-only: `./firebase` and `./server` are
  // callable from Node (deploy scripts, Cloud Functions, route.ts handlers).
  async onSuccess() {
    prependUseClient('esm');
    prependUseClient('cjs');
  },
} satisfies Options);
