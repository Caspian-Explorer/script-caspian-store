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

// Shared settings between the two builds.
const shared = {
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: false, // the main config handles the clean so the firebase config doesn't wipe it
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
  ],
} satisfies Partial<Options>;

// Prepend a raw `'use client';` to the main-entry output files AFTER tsup
// writes them. Doing this via esbuild's `banner` option does not work: esbuild
// detects the module-level directive in the bundled source and strips it with
// the warning "Module level directives cause errors when bundled". The
// post-write prepend is the only reliable path with tsup 8.5 + treeshake.
//
// Why only the main entry: `./firebase` exports `initCaspianFirebase` and
// Firestore-rules/-index constants — callable from Node (deploy scripts,
// Cloud Functions) and from Server Components. Marking it client-only
// would break those callsites.
function prependUseClient(format: 'esm' | 'cjs') {
  const ext = format === 'esm' ? 'mjs' : 'js';
  const file = join('dist', `index.${ext}`);
  const contents = readFileSync(file, 'utf8');
  if (!contents.startsWith("'use client'") && !contents.startsWith('"use client"')) {
    writeFileSync(file, `'use client';\n${contents}`);
  }
}

export default defineConfig([
  {
    ...shared,
    entry: { index: 'src/index.ts' },
    clean: true,
    async onSuccess() {
      prependUseClient('esm');
      prependUseClient('cjs');
    },
  },
  {
    ...shared,
    entry: { 'firebase/index': 'src/firebase/index.ts' },
  },
  {
    // Server-only entry (v7.4.0+). Hosts the self-update HTTP handler that
    // scaffolded route.ts used to inline. Externalize firebase-admin + Node
    // built-ins so they don't end up in the bundle — this entry assumes a
    // Node runtime and is consumed only from `app/api/**/route.ts`.
    ...shared,
    entry: { 'server/index': 'src/server/index.ts' },
    external: [
      ...shared.external,
      'firebase-admin',
      'firebase-admin/app',
      'firebase-admin/auth',
      'node:child_process',
    ],
  },
]);
