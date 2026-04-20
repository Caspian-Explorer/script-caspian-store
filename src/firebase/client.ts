import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getFunctions, type Functions } from 'firebase/functions';

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
