'use client';

import { useCallback, useMemo } from 'react';
import { useAuth } from '../context/auth-context';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { addToWishlist, removeFromWishlist } from '../services/wishlist-service';

export function useWishlist() {
  const { user, userProfile, refreshProfile } = useAuth();
  const { db } = useCaspianFirebase();

  const ids = useMemo(() => new Set(userProfile?.wishlist ?? []), [userProfile]);

  const isSaved = useCallback((productId: string) => ids.has(productId), [ids]);

  const add = useCallback(
    async (productId: string) => {
      if (!user) throw new Error('Sign in to save to your wishlist.');
      await addToWishlist(db, user.uid, productId);
      await refreshProfile();
    },
    [db, user, refreshProfile],
  );

  const remove = useCallback(
    async (productId: string) => {
      if (!user) return;
      await removeFromWishlist(db, user.uid, productId);
      await refreshProfile();
    },
    [db, user, refreshProfile],
  );

  const toggle = useCallback(
    async (productId: string) => {
      if (ids.has(productId)) return remove(productId);
      return add(productId);
    },
    [ids, add, remove],
  );

  return {
    wishlist: userProfile?.wishlist ?? [],
    isSaved,
    add,
    remove,
    toggle,
    signedIn: Boolean(user),
  };
}
