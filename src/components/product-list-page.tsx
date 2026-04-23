'use client';

import { useEffect, useMemo, useState } from 'react';
import type { InventorySettings, Product, TaxConfig } from '../types';
import { getProducts, type ProductFilters } from '../services/product-service';
import { getSiteSettings } from '../services/site-settings-service';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { ProductGrid } from './product-grid';

export interface ProductListPageProps {
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
}

/**
 * Drop-in product listing page. Fetches from Firestore on mount and renders a
 * responsive grid. For a listing wired to your own data source, use
 * `<ProductGrid products={...}>` directly.
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
}: ProductListPageProps) {
  const { db } = useCaspianFirebase();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventorySettings | undefined>(inventoryOverride);
  const [taxConfig, setTaxConfig] = useState<TaxConfig | undefined>(taxConfigOverride);

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

  return (
    <div className={className}>
      {(title || subtitle) && (
        <header style={{ marginBottom: 24 }}>
          {title && <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{title}</h1>}
          {subtitle && <p style={{ color: '#666', marginTop: 4 }}>{subtitle}</p>}
        </header>
      )}
      <ProductGrid
        products={products}
        loading={loading}
        getProductHref={getProductHref}
        formatPrice={formatPrice}
        emptyMessage={emptyMessage}
        inventory={inventory}
        taxConfig={taxConfig}
      />
    </div>
  );
}
