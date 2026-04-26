'use client';

import { useEffect, useMemo, useState } from 'react';
import type { InventorySettings, Product, TaxConfig } from '../types';
import { getProducts, type ProductFilters } from '../services/product-service';
import { getSiteSettings } from '../services/site-settings-service';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { ProductGrid } from './product-grid';
import {
  ShopFilterSidebar,
  EMPTY_SHOP_FILTERS,
  type ShopFilterState,
} from './shop-filter-sidebar';
import { cn } from '../utils/cn';

export interface ProductListPageProps {
  /**
   * Server-side narrowing applied at the Firestore query layer (e.g. when
   * mounted under `/shop/[category]`). The interactive filter sidebar is
   * additive on top of this set — it never widens beyond what `filters`
   * returns.
   */
  filters?: ProductFilters;
  max?: number;
  title?: string;
  subtitle?: string;
  getProductHref?: (productId: string) => string;
  formatPrice?: (price: number) => string;
  emptyMessage?: string;
  className?: string;
  /**
   * Override the inventory settings read from `SiteSettings.inventory`.
   * When omitted, the page fetches site settings on mount and uses them to
   * apply the hide-out-of-stock filter and stock badging. Added in v2.9.
   */
  inventory?: InventorySettings;
  /**
   * Override the tax display config read from `SiteSettings.taxConfig`.
   * When omitted, fetched alongside inventory on mount. Added in v2.12.
   */
  taxConfig?: TaxConfig;
  /**
   * Hide the interactive filter sidebar. Useful for embedding the listing in
   * tighter layouts (sidebars, drawers) where filters don't fit. Added in v8.1.
   */
  hideFilters?: boolean;
}

/**
 * Drop-in product listing page. Fetches from Firestore on mount and renders a
 * left filter sidebar + responsive product grid. For a listing wired to your
 * own data source, use `<ProductGrid products={...}>` directly.
 */
export function ProductListPage({
  filters,
  max,
  title,
  subtitle,
  getProductHref,
  formatPrice,
  emptyMessage,
  className,
  inventory: inventoryOverride,
  taxConfig: taxConfigOverride,
  hideFilters,
}: ProductListPageProps) {
  const { db } = useCaspianFirebase();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventorySettings | undefined>(inventoryOverride);
  const [taxConfig, setTaxConfig] = useState<TaxConfig | undefined>(taxConfigOverride);
  const [filterState, setFilterState] = useState<ShopFilterState>(EMPTY_SHOP_FILTERS);

  useEffect(() => {
    if (inventoryOverride !== undefined && taxConfigOverride !== undefined) {
      setInventory(inventoryOverride);
      setTaxConfig(taxConfigOverride);
      return undefined;
    }
    let alive = true;
    getSiteSettings(db)
      .then((s) => {
        if (!alive) return;
        if (inventoryOverride === undefined) setInventory(s?.inventory);
        if (taxConfigOverride === undefined) setTaxConfig(s?.taxConfig);
      })
      .catch(() => {
        /* fall through — no inventory/tax wiring */
      });
    return () => {
      alive = false;
    };
  }, [db, inventoryOverride, taxConfigOverride]);

  const effectiveFilters = useMemo<ProductFilters | undefined>(() => {
    const hideOutOfStock =
      inventory?.trackStock && inventory.outOfStockVisibility === 'hide'
        ? { outOfStockThreshold: inventory.outOfStockThreshold }
        : undefined;
    if (!hideOutOfStock) return filters;
    return { ...(filters ?? {}), hideOutOfStock };
  }, [filters, inventory]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getProducts(db, effectiveFilters, max);
        if (alive) setProducts(data);
      } catch (error) {
        console.error('[caspian-store] Failed to load products:', error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [db, effectiveFilters, max]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) if (p.category) set.add(p.category);
    return [...set].sort();
  }, [products]);

  const availableSizes = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) for (const s of p.sizes ?? []) set.add(s);
    return [...set].sort();
  }, [products]);

  const visibleProducts = useMemo(() => {
    return products.filter((p) => {
      if (filterState.category && p.category !== filterState.category) return false;
      const min = filterState.minPrice === '' ? null : Number(filterState.minPrice);
      const max = filterState.maxPrice === '' ? null : Number(filterState.maxPrice);
      if (min !== null && !Number.isNaN(min) && p.price < min) return false;
      if (max !== null && !Number.isNaN(max) && p.price > max) return false;
      if (filterState.sizes.size > 0) {
        if (!p.sizes?.some((s) => filterState.sizes.has(s))) return false;
      }
      if (filterState.isNew && !p.isNew) return false;
      if (filterState.limited && !p.limited) return false;
      return true;
    });
  }, [products, filterState]);

  const grid = (
    <ProductGrid
      products={visibleProducts}
      loading={loading}
      getProductHref={getProductHref}
      formatPrice={formatPrice}
      emptyMessage={emptyMessage}
      inventory={inventory}
      taxConfig={taxConfig}
    />
  );

  return (
    <div className={className}>
      {(title || subtitle) && (
        <header style={{ marginBottom: 24 }}>
          {title && <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{title}</h1>}
          {subtitle && <p style={{ color: '#666', marginTop: 4 }}>{subtitle}</p>}
        </header>
      )}
      {hideFilters ? (
        grid
      ) : (
        <div className={cn('caspian-shop-grid')}>
          <ShopFilterSidebar
            state={filterState}
            onChange={setFilterState}
            availableCategories={availableCategories}
            availableSizes={availableSizes}
            resultCount={loading ? undefined : visibleProducts.length}
          />
          <div style={{ minWidth: 0 }}>{grid}</div>
        </div>
      )}
    </div>
  );
}
