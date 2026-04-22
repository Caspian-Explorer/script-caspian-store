'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Product } from '../types';
import { getProducts } from '../services/product-service';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { useT } from '../i18n/locale-context';
import { ProductGrid } from './product-grid';

export interface SearchResultsPageProps {
  /** Query string. If omitted, read `?q=` from `window.location.search`. */
  query?: string;
  /** Max products to load into the client-side filter. Default 500. */
  max?: number;
  getProductHref?: (productId: string) => string;
  formatPrice?: (price: number) => string;
  className?: string;
}

/**
 * Storefront search results. Loads the active-product catalog and filters
 * client-side by name / brand / category containing the query. Fine for
 * small-to-medium catalogs — wire a proper search backend (Algolia, Typesense)
 * via a consumer replacement of this component for large stores.
 */
export function SearchResultsPage({
  query: queryProp,
  max = 500,
  getProductHref,
  formatPrice,
  className,
}: SearchResultsPageProps) {
  const { db } = useCaspianFirebase();
  const t = useT();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryState, setQueryState] = useState<string>('');

  useEffect(() => {
    if (typeof queryProp === 'string') {
      setQueryState(queryProp);
      return;
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setQueryState(params.get('q') ?? '');
    }
  }, [queryProp]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getProducts(db, undefined, max);
        if (alive) setProducts(data);
      } catch (error) {
        console.error('[caspian-store] Failed to load products for search:', error);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [db, max]);

  const matches = useMemo(() => {
    const q = queryState.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const hay = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
      return hay.includes(q);
    });
  }, [products, queryState]);

  return (
    <div className={className} style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
          {queryState ? t('search.resultsFor', { query: queryState }) : t('search.title')}
        </h1>
        {!loading && queryState && (
          <p style={{ color: '#666', marginTop: 4 }}>
            {t('search.resultCount', { count: matches.length })}
          </p>
        )}
      </header>
      <ProductGrid
        products={matches}
        loading={loading}
        getProductHref={getProductHref}
        formatPrice={formatPrice}
        emptyMessage={queryState ? t('search.noResults') : t('search.emptyQuery')}
      />
    </div>
  );
}
