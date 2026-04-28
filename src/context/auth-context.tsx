'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import type { CaspianFirebase } from '../firebase/client';
import type { UserProfile } from '../types';
import { logError, reportServiceError } from '../services/error-log-service';

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  /**
   * Create an account without asking the shopper for a password — the
   * storefront generates a random one, signs the user in, and emails a
   * password-reset link so they can pick a real password on their own. Used
   * when `SiteSettings.accounts.sendPasswordSetupLink` is enabled. Added in v2.10.
   */
  signUpWithSetupLink: (email: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  /**
   * Create an anonymous Firebase Auth session. Used to back the "Continue as
   * guest" flow at checkout when `SiteSettings.accounts.allowGuestCheckout`
   * is true. Requires the Anonymous sign-in provider to be enabled in
   * Firebase Authentication. Added in v2.10.
   */
  signInAsGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchOrCreateUserProfile(
  firebase: CaspianFirebase,
  user: User,
): Promise<UserProfile> {
  const userDocRef = doc(firebase.db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return { uid: user.uid, ...userDoc.data() } as UserProfile;
  }

  const newProfile: Omit<UserProfile, 'uid'> = {
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL,
    role: 'customer',
    addresses: [],
    wishlist: [],
    createdAt: Timestamp.now(),
  };

  await setDoc(userDocRef, newProfile);
  return { uid: user.uid, ...newProfile };
}

export function AuthProvider({
  firebase,
  children,
}: {
  firebase: CaspianFirebase;
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // v8.6.0: pre-emptive admin-claim token refresh, gated to once per uid so
  // we don't loop on consumers whose `caspian-admin` Cloud Functions are
  // undeployed (the claim will never arrive — refreshing again won't help).
  const refreshedClaimForUid = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebase.auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await fetchOrCreateUserProfile(firebase, firebaseUser);
          setUserProfile(profile);
          // If Firestore says admin but the cached ID token is missing the
          // `role: 'admin'` custom claim, force-refresh once. This pre-empts
          // the most common storage/unauthorized cause: the claim was set
          // (by `claimAdmin`, `onUserCreate`, or `syncAdminClaim`) AFTER
          // the user's last token issuance, so storage.rules' fast path
          // fails until the token rotates ~1h later. Refreshing here makes
          // the next admin write — Storage upload, Firestore write — see
          // the claim immediately. Bounded to once per uid so a consumer
          // who hasn't deployed the admin Functions doesn't loop.
          if (
            profile.role === 'admin' &&
            refreshedClaimForUid.current !== firebaseUser.uid
          ) {
            refreshedClaimForUid.current = firebaseUser.uid;
            try {
              const tokenResult = await firebaseUser.getIdTokenResult();
              if (tokenResult.claims.role !== 'admin') {
                await firebaseUser.getIdToken(true);
              }
            } catch (error) {
              // Network blip — non-fatal. The §1 retry inside
              // `uploadAdminImage` is a second line of defense.
              reportServiceError(firebase.db, 'auth-context.refreshAdminClaim', error);
            }
          }
        } catch (error) {
          reportServiceError(firebase.db, 'auth-context.fetchProfile', error);
          setUserProfile(null);
        }
      } else {
        refreshedClaimForUid.current = null;
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [firebase]);

  const signIn = useCallback(
    async (email: string, password: string, rememberMe = true) => {
      await setPersistence(
        firebase.auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence,
      );
      await signInWithEmailAndPassword(firebase.auth, email, password);
    },
    [firebase],
  );

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      const credential = await createUserWithEmailAndPassword(
        firebase.auth,
        email,
        password,
      );
      await updateProfile(credential.user, { displayName });
      const userDocRef = doc(firebase.db, 'users', credential.user.uid);
      await setDoc(userDocRef, { displayName }, { merge: true });
    },
    [firebase],
  );

  const signUpWithSetupLink = useCallback(
    async (email: string, displayName: string) => {
      // Generate a high-entropy temporary password the shopper never sees —
      // we immediately email them a reset link so they can set a real one.
      const randomPassword = `TempPwd-${crypto.randomUUID()}-${Date.now()}`;
      const credential = await createUserWithEmailAndPassword(
        firebase.auth,
        email,
        randomPassword,
      );
      await updateProfile(credential.user, { displayName });
      const userDocRef = doc(firebase.db, 'users', credential.user.uid);
      await setDoc(userDocRef, { displayName }, { merge: true });
      // Best-effort; if the reset email fails the account still exists and
      // the shopper can use "forgot password" manually.
      try {
        await sendPasswordResetEmail(firebase.auth, email);
      } catch (error) {
        // Keep as warn — non-fatal; account was created successfully.
        // eslint-disable-next-line no-console
        console.warn('[caspian-store] Password setup email failed to send:', error);
        void logError(firebase.db, {
          source: 'service',
          origin: 'auth-context.sendPasswordResetEmail',
          error,
        });
      }
    },
    [firebase],
  );

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(firebase.auth, new GoogleAuthProvider());
  }, [firebase]);

  const signInAsGuest = useCallback(async () => {
    await signInAnonymously(firebase.auth);
  }, [firebase]);

  const signOut = useCallback(async () => {
    await firebaseSignOut(firebase.auth);
  }, [firebase]);

  const resetPassword = useCallback(
    async (email: string) => {
      await sendPasswordResetEmail(firebase.auth, email);
    },
    [firebase],
  );

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const profile = await fetchOrCreateUserProfile(firebase, user);
      setUserProfile(profile);
    } catch (error) {
      reportServiceError(firebase.db, 'auth-context.refreshProfile', error);
    }
  }, [firebase, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signIn,
        signUp,
        signUpWithSetupLink,
        signInWithGoogle,
        signInAsGuest,
        signOut,
        refreshProfile,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be called inside <CaspianStoreProvider>.');
  }
  return ctx;
}
