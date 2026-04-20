'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { FirebaseOptions } from 'firebase/app';
import { initCaspianFirebase, type CaspianFirebase } from '../firebase/client';
import { caspianCollections, type CaspianCollections } from '../firebase/collections';
import {
  DefaultCaspianLink,
  DefaultCaspianImage,
  useDefaultCaspianNavigation,
  type FrameworkAdapters,
} from '../primitives';
import { AuthProvider } from '../context/auth-context';
import { CartProvider } from '../context/cart-context';
import { ScriptSettingsProvider } from '../context/script-settings-context';
import { ThemeInjector } from '../context/theme-context';
import { ToastProvider } from '../ui/toast';

export interface CaspianStoreProviderProps {
  /** Firebase project config (apiKey, authDomain, projectId, etc.). */
  firebaseConfig: FirebaseOptions;
  /** Optional Cloud Functions region (default: us-central1). */
  functionsRegion?: string;
  /**
   * Framework-specific routing primitives. Strongly recommended — the defaults
   * cause full-page reloads. Pass `next/link` + `next/navigation`'s useRouter
   * for Next.js, or `react-router-dom`'s Link + a useNavigate wrapper.
   */
  adapters?: Partial<FrameworkAdapters>;
  /** Optional Firebase app name when mounting more than one store per page. */
  appName?: string;
  children: ReactNode;
}

export interface CaspianStoreContextValue {
  firebase: CaspianFirebase;
  collections: CaspianCollections;
  adapters: FrameworkAdapters;
}

const CaspianStoreContext = createContext<CaspianStoreContextValue | null>(null);

export function CaspianStoreProvider({
  firebaseConfig,
  functionsRegion,
  adapters,
  appName,
  children,
}: CaspianStoreProviderProps) {
  const value = useMemo<CaspianStoreContextValue>(() => {
    const firebase = initCaspianFirebase({
      config: firebaseConfig,
      functionsRegion,
      name: appName,
    });
    const collections = caspianCollections(firebase.db);
    const resolvedAdapters: FrameworkAdapters = {
      Link: adapters?.Link ?? DefaultCaspianLink,
      Image: adapters?.Image ?? DefaultCaspianImage,
      useNavigation: adapters?.useNavigation ?? useDefaultCaspianNavigation,
    };
    return { firebase, collections, adapters: resolvedAdapters };
    // Intentionally stable per mount; consumers should not swap these at runtime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CaspianStoreContext.Provider value={value}>
      <ToastProvider>
        <AuthProvider firebase={value.firebase}>
          <CartProvider db={value.firebase.db}>
            <ScriptSettingsProvider collections={value.collections}>
              <ThemeInjector />
              {children}
            </ScriptSettingsProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </CaspianStoreContext.Provider>
  );
}

export function useCaspianStore(): CaspianStoreContextValue {
  const ctx = useContext(CaspianStoreContext);
  if (!ctx) {
    throw new Error(
      'useCaspianStore must be called inside <CaspianStoreProvider>. ' +
        'Wrap your app root with CaspianStoreProvider and pass your Firebase config.',
    );
  }
  return ctx;
}

/** Convenience hooks for framework adapters. */
export function useCaspianLink() {
  return useCaspianStore().adapters.Link;
}

export function useCaspianImage() {
  return useCaspianStore().adapters.Image ?? DefaultCaspianImage;
}

export function useCaspianNavigation() {
  const hook = useCaspianStore().adapters.useNavigation;
  return hook();
}

export function useCaspianCollections() {
  return useCaspianStore().collections;
}

export function useCaspianFirebase() {
  return useCaspianStore().firebase;
}
