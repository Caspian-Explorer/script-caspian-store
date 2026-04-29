import type { FirebaseOptions } from 'firebase/app';

/**
 * Resolve Firebase web config from the runtime environment, preferring
 * Firebase App Hosting's auto-injected `FIREBASE_WEBAPP_CONFIG` JSON blob and
 * falling back to the six `NEXT_PUBLIC_FIREBASE_*` vars that Vercel and
 * manual deploys typically use.
 *
 * `process.env` references are inlined at build time by Next.js'
 * DefinePlugin. `NEXT_PUBLIC_*` vars survive into the client bundle
 * automatically; `FIREBASE_WEBAPP_CONFIG` survives only when the consumer's
 * `next.config.mjs` forwards it via the `env:` block — see the v8.9.0 release
 * notes for the two-line consumer setup.
 *
 * Note: do NOT mark this module `'use client'`. It must remain a plain ESM
 * module so `process.env` references inline correctly on both the server
 * prerender pass and the browser bundle.
 */
export function readFirebaseConfigFromEnv(): FirebaseOptions {
  const blob = process.env.FIREBASE_WEBAPP_CONFIG;
  if (blob) {
    try {
      const parsed = JSON.parse(blob) as FirebaseOptions;
      if (parsed?.apiKey) return parsed;
    } catch (e) {
      throw new Error(
        `Caspian Store: FIREBASE_WEBAPP_CONFIG is set but is not valid JSON. ` +
          `Parse error: ${(e as Error).message}`,
      );
    }
  }
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

/**
 * Best-effort identification of which env source the config was read from.
 * Used to render an actionable error message when the resolved config is
 * incomplete — tells the consumer which platform's wiring to check.
 */
export function describeFirebaseConfigSource(): string {
  if (process.env.FIREBASE_WEBAPP_CONFIG) return 'FIREBASE_WEBAPP_CONFIG';
  if (process.env.K_SERVICE)
    return 'App Hosting (FIREBASE_WEBAPP_CONFIG missing — check next.config.mjs env: forwarding)';
  if (process.env.VERCEL) return 'Vercel (NEXT_PUBLIC_FIREBASE_* vars)';
  return 'unknown (NEXT_PUBLIC_FIREBASE_* vars)';
}
