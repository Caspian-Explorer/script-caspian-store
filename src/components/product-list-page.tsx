'use client';

import { useEffect, useState } from 'react';
import type { Product } from '../types';
import { getProducts, type ProductFilters } from '../services/product-service';
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
}: ProductListPageProps) {
  const { db } = useCaspianFirebase();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getProducts(db, filters, max);
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
  }, [db, filters, max]);

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
      />
    </div>
  );
}
