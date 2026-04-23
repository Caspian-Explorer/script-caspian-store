'use client';

import type { InventorySettings, Product } from '../types';
import { useCaspianLink, useCaspianImage } from '../provider/caspian-store-provider';
import { useT } from '../i18n/locale-context';
import { Badge } from '../ui/misc';
import { cn } from '../utils/cn';
import { resolveStockBadge } from '../utils/inventory';

export interface ProductCardProps {
  product: Product;
  /** Build the URL for clicking the card. Default: `/product/{id}`. */
  getProductHref?: (productId: string) => string;
  className?: string;
  /** Formatter for price display. Default: `$price.toFixed(2)`. */
  formatPrice?: (price: number) => string;
  /**
   * Merchant inventory settings. When omitted (or `trackStock: false`), no
   * stock badge renders — preserving pre-v2.9 behavior. Wire from
   * `SiteSettings.inventory` upstream. Added in v2.9.
   */
  inventory?: InventorySettings;
}

export function ProductCard({
  product,
  getProductHref = (id) => `/product/${id}`,
  className,
  formatPrice = (p) => `$${p.toFixed(2)}`,
  inventory,
}: ProductCardProps) {
  const Link = useCaspianLink();
  const Image = useCaspianImage();
  const t = useT();
  const img = product.images?.[0];
  const stockBadge = inventory ? resolveStockBadge(product, inventory) : null;

  return (
    <Link href={getProductHref(product.id)} className={cn('caspian-product-card', className)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, color: 'inherit', textDecoration: 'none' }}>
        <div
          style={{
            position: 'relative',
            aspectRatio: '3 / 4',
            background: '#f5f5f5',
            overflow: 'hidden',
            borderRadius: 'var(--caspian-radius, 8px)',
          }}
        >
          {img ? (
            <Image src={img.url} alt={img.alt || product.name} fill />
          ) : (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: 13,
              }}
            >
              {t('storefront.noImage')}
            </div>
          )}
          <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 4 }}>
            {product.isNew && <Badge variant="secondary">{t('storefront.badges.new')}</Badge>}
            {product.limited && <Badge variant="destructive">{t('storefront.badges.limited')}</Badge>}
            {stockBadge === 'out-of-stock' && <Badge variant="destructive">Out of stock</Badge>}
            {stockBadge === 'low-stock' && <Badge variant="default">Low stock</Badge>}
            {stockBadge === 'in-stock' && <Badge variant="secondary">In stock</Badge>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', margin: 0 }}>
            {product.brand}
          </p>
          <p style={{ fontSize: 15, fontWeight: 500, margin: 0, lineHeight: 1.3 }}>{product.name}</p>
          <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{formatPrice(product.price)}</p>
        </div>
      </div>
    </Link>
  );
}
