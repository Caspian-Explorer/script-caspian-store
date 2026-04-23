'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
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
import { FontLoader } from '../context/font-loader';
import { ToastProvider } from '../ui/toast';
import { LocaleProvider } from '../i18n/locale-context';
import type { MessageDict } from '../i18n/messages';
import { ErrorBoundary } from '../components/error-boundary';
import { logError } from '../services/error-log-service';

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
  /** Locale code (BCP-47). Default: `en`. Does not change the messages dict on its own — pair with `messages` or `messagesByLocale`. */
  locale?: string;
  /** Partial or full message dictionary overriding the built-in English defaults. Missing keys fall through. */
  messages?: MessageDict;
  /**
   * Alternative to `messages` for multi-locale sites. Pass a map of `{ en: {...}, ar: {...} }`;
   * the active `locale` selects which one applies. Supports `fr-CA` → `fr` fallback.
   */
  messagesByLocale?: Record<string, MessageDict>;
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
  locale,
  messages,
  messagesByLocale,
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
      <ErrorBoundary db={value.firebase.db} origin="CaspianStoreProvider">
        <GlobalErrorCapture db={value.firebase.db} projectId={firebaseConfig.projectId} />
        <LocaleProvider locale={locale} messages={messages} messagesByLocale={messagesByLocale}>
          <ToastProvider>
            <AuthProvider firebase={value.firebase}>
              <CartProvider db={value.firebase.db}>
                <ScriptSettingsProvider collections={value.collections}>
                  <ThemeInjector />
                  <FontLoader />
                  {children}
                </ScriptSettingsProvider>
              </CartProvider>
            </AuthProvider>
          </ToastProvider>
        </LocaleProvider>
      </ErrorBoundary>
    </CaspianStoreContext.Provider>
  );
}

/**
 * Subscribes to `window.onerror` and `window.onunhandledrejection` for the
 * lifetime of the provider. Render-path errors are already covered by the
 * `ErrorBoundary` wrapper; this picks up the things React can't catch —
 * async throws from event handlers, timers, and unhandled promise
 * rejections. Added for mod1182.
 */
function GlobalErrorCapture({ db, projectId }: { db: CaspianFirebase['db']; projectId?: string }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onError = (ev: ErrorEvent) => {
      void logError(db, {
        source: 'client',
        origin: 'window.onerror',
        error: ev.error ?? ev.message,
        firebaseProjectId: projectId,
      });
    };
    const onRejection = (ev: PromiseRejectionEvent) => {
      void logError(db, {
        source: 'client',
        origin: 'window.onunhandledrejection',
        error: ev.reason,
        firebaseProjectId: projectId,
      });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [db, projectId]);
  return null;
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
