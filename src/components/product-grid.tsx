'use client';

import type { Product } from '../types';
import { ProductCard } from './product-card';
import { Skeleton } from '../ui/misc';
import { useT } from '../i18n/locale-context';
import { cn } from '../utils/cn';

export interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  getProductHref?: (productId: string) => string;
  formatPrice?: (price: number) => string;
  minCardWidth?: number;
  emptyMessage?: string;
  className?: string;
}

export function ProductGrid({
  products,
  loading,
  getProductHref,
  formatPrice,
  minCardWidth = 220,
  emptyMessage,
  className,
}: ProductGridProps) {
  const t = useT();
  const empty = emptyMessage ?? t('storefront.empty');
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
    gap: 24,
  };

  if (loading) {
    return (
      <div className={cn('caspian-product-grid', className)} style={gridStyle}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton style={{ aspectRatio: '3 / 4', width: '100%' }} />
            <Skeleton style={{ height: 14, width: '70%' }} />
            <Skeleton style={{ height: 14, width: '40%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return <p style={{ color: '#888', textAlign: 'center', padding: 40 }}>{empty}</p>;
  }

  return (
    <div className={cn('caspian-product-grid', className)} style={gridStyle}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} getProductHref={getProductHref} formatPrice={formatPrice} />
      ))}
    </div>
  );
}
