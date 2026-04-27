'use client';

import { useEffect, useState } from 'react';
import type { ProductBrandDoc } from '../types';
import { listActiveBrands } from '../services/brand-service';
import { useCaspianFirebase } from '../provider/caspian-store-provider';

/**
 * Module-level cache of the active-brand list. A grid of product cards
 * mounted on the same page would otherwise fire one read per card; the
 * cache collapses that into a single Firestore read for the whole tree.
 *
 * The Brands admin page calls {@link refreshBrandsCache} after every
 * create / update / delete / migrate so storefront tabs see fresh data
 * on next mount. Cross-tab invalidation (admin renames a brand in tab A
 * while a storefront is open in tab B) is not handled — refreshing the
 * storefront tab picks it up.
 */
let cachedPromise: Promise<ProductBrandDoc[]> | null = null;

export function refreshBrandsCache(): void {
  cachedPromise = null;
}

export function useBrands(): {
  brands: ProductBrandDoc[];
  brandsById: Map<string, ProductBrandDoc>;
  loaded: boolean;
} {
  const { db } = useCaspianFirebase();
  const [brands, setBrands] = useState<ProductBrandDoc[] | null>(null);

  useEffect(() => {
    let alive = true;
    if (!cachedPromise) cachedPromise = listActiveBrands(db);
    cachedPromise
      .then((list) => {
        if (alive) setBrands(list);
      })
      .catch((error) => {
        console.error('[caspian-store] Failed to load brands:', error);
        if (alive) setBrands([]);
      });
    return () => {
      alive = false;
    };
  }, [db]);

  const list = brands ?? [];
  const brandsById = new Map(list.map((b) => [b.id, b]));
  return { brands: list, brandsById, loaded: brands !== null };
}

/**
 * Resolve a stored `Product.brand` value to a display name. Returns the
 * matching brand-doc's `name` when the value is a known brand id, the raw
 * value otherwise (preserves legacy free-text data from before the brands
 * collection existed). Returns the empty string for unset values.
 */
export function useBrandName(value: string | undefined): string {
  const { brandsById } = useBrands();
  if (!value) return '';
  return brandsById.get(value)?.name ?? value;
}
