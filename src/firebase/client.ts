import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';
import { describeFirebaseConfigSource } from './env-config';

export interface CaspianFirebase {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  functions: Functions;
}

export interface InitFirebaseOptions {
  config: FirebaseOptions;
  /** Optional instance name — useful when mounting multiple shops on one page. */
  name?: string;
  /** Optional region for Cloud Functions (default: us-central1). */
  functionsRegion?: string;
}

export function initCaspianFirebase({
  config,
  name,
  functionsRegion = 'us-central1',
}: InitFirebaseOptions): CaspianFirebase {
  const instanceName = name ?? 'caspian-store';
  // Pre-check the four required fields before handing off to Firebase. The
  // SDK's own error (`auth/invalid-api-key`) surfaces during a Next.js
  // /_not-found prerender as an opaque crash that doesn't tell the consumer
  // which env source to fix; this guard names the missing field(s) and the
  // detected platform. storageBucket and messagingSenderId are intentionally
  // not required — some Firebase products work without them.
  const missing = (['apiKey', 'authDomain', 'projectId', 'appId'] as const).filter(
    (k) => !config[k],
  );
  if (missing.length) {
    throw new Error(
      `Caspian Store: Firebase config is missing required field(s): ${missing.join(', ')}. ` +
        `On Firebase App Hosting, ensure FIREBASE_WEBAPP_CONFIG is forwarded in next.config.mjs ` +
        `(env: { FIREBASE_WEBAPP_CONFIG: process.env.FIREBASE_WEBAPP_CONFIG }) and the backend ` +
        `was created via the Firebase Console (which auto-injects FIREBASE_WEBAPP_CONFIG at build + runtime). ` +
        `On Vercel or local dev, set the six NEXT_PUBLIC_FIREBASE_* env vars. ` +
        `Detected platform: ${describeFirebaseConfigSource()}.`,
    );
  }
  const existing = getApps().find((a) => a.name === instanceName);
  const app = existing ?? initializeApp(config, instanceName);
  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
    functions: getFunctions(app, functionsRegion),
  };
}

/** Fall back to the default Firebase app if the consumer has already initialized it. */
export function getDefaultCaspianFirebase(functionsRegion = 'us-central1'): CaspianFirebase | null {
  if (getApps().length === 0) return null;
  const app = getApp();
  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
    functions: getFunctions(app, functionsRegion),
  };
}
