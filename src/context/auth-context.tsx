'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
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

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebase.auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profile = await fetchOrCreateUserProfile(firebase, firebaseUser);
          setUserProfile(profile);
        } catch (error) {
          console.error('[caspian-store] Failed to fetch user profile:', error);
          setUserProfile(null);
        }
      } else {
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

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(firebase.auth, new GoogleAuthProvider());
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
      console.error('[caspian-store] Failed to refresh user profile:', error);
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
        signInWithGoogle,
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
