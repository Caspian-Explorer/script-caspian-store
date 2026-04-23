import type { InventorySettings, Product } from '../types';

export const DEFAULT_INVENTORY_SETTINGS: InventorySettings = {
  trackStock: false,
  lowStockThreshold: 2,
  outOfStockThreshold: 0,
  outOfStockVisibility: 'show',
  stockDisplay: 'always',
};

/**
 * Sum the per-size stock counts on a product. Returns 0 when the product
 * has no stock map (legacy / pre-v2.9 products) — callers should treat this
 * as "unknown stock" rather than "definitely empty" and gate on
 * `InventorySettings.trackStock` upstream.
 */
export function totalStock(product: Pick<Product, 'stock'>): number {
  if (!product.stock) return 0;
  return Object.values(product.stock).reduce((acc, qty) => acc + (Number(qty) || 0), 0);
}

/**
 * Return whether *every* size on a product is at or below the configured
 * out-of-stock threshold. When the product has a `stock` map but no entries,
 * we treat that as out-of-stock; products with no stock map at all are
 * considered "unknown" — see `totalStock`.
 */
export function isProductOutOfStock(
  product: Pick<Product, 'stock' | 'sizes'>,
  settings: Pick<InventorySettings, 'outOfStockThreshold'> = DEFAULT_INVENTORY_SETTINGS,
): boolean {
  if (!product.stock) return false;
  const entries = Object.entries(product.stock);
  if (entries.length === 0) return true;
  return entries.every(([, qty]) => (Number(qty) || 0) <= settings.outOfStockThreshold);
}

/** Whether a single size is at or below the out-of-stock threshold. */
export function isSizeOutOfStock(
  stock: Record<string, number> | undefined,
  size: string,
  settings: Pick<InventorySettings, 'outOfStockThreshold'> = DEFAULT_INVENTORY_SETTINGS,
): boolean {
  if (!stock) return false;
  return (Number(stock[size]) || 0) <= settings.outOfStockThreshold;
}

/**
 * Resolve which (if any) badge a product card should render based on its
 * current stock totals and the merchant's `stockDisplay` preference.
 * `null` means render no stock-related badge.
 */
export type StockBadgeKind = 'out-of-stock' | 'low-stock' | 'in-stock';

export function resolveStockBadge(
  product: Pick<Product, 'stock' | 'sizes'>,
  settings: InventorySettings = DEFAULT_INVENTORY_SETTINGS,
): StockBadgeKind | null {
  if (!settings.trackStock) return null;
  if (settings.stockDisplay === 'never') return null;
  if (!product.stock) return null;
  const total = totalStock(product);
  if (isProductOutOfStock(product, settings)) return 'out-of-stock';
  if (total <= settings.lowStockThreshold) return 'low-stock';
  if (settings.stockDisplay === 'low') return null;
  return 'in-stock';
}
