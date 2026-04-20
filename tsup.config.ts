import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'firebase/index': 'src/firebase/index.ts',
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
  ],
  // Note: we rely on consumers marking their own import boundary with
  // "use client". esbuild strips module-level directives from bundled output,
  // so a banner here is ineffective. Track v0.1.1 for the esbuild plugin fix.
});
