import { defineConfig, type Options } from 'tsup';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

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
]);
