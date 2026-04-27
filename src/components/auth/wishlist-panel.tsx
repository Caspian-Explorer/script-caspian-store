'use client';

import { useEffect, useState } from 'react';
import { useCart } from '../../context/cart-context';
import { useWishlist } from '../../hooks/use-wishlist';
import { useT } from '../../i18n/locale-context';
import {
  useCaspianFirebase,
  useCaspianImage,
  useCaspianLink,
} from '../../provider/caspian-store-provider';
import { getProductsByIds } from '../../services/product-service';
import type { Product } from '../../types';
import { Button } from '../../ui/button';
import { useToast } from '../../ui/toast';

export interface WishlistPanelProps {
  /** Product-page URL builder. Default: `/product/{id}`. */
  getProductHref?: (productId: string) => string;
  /** Browse-products destination for the empty-state CTA. Default: `/shop`. */
  browseHref?: string;
  /** Currency formatter. Default: `$price.toFixed(2)`. */
  formatPrice?: (price: number) => string;
  className?: string;
}

/**
 * Account-page panel that shows the signed-in user's saved products. Uses
 * `useWishlist()` for the id list and `getProductsByIds()` for product data.
 */
export function WishlistPanel({
  getProductHref = (id) => `/product/${id}`,
  browseHref = '/shop',
  formatPrice = (p) => `$${p.toFixed(2)}`,
  className,
}: WishlistPanelProps) {
  const t = useT();
  const { db } = useCaspianFirebase();
  const Link = useCaspianLink();
  const Image = useCaspianImage();
  const { toast } = useToast();
  const { wishlist, remove, signedIn } = useWishlist();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!wishlist.length) {
      setProducts([]);
      return;
    }
    setLoading(true);
    getProductsByIds(db, wishlist)
      .then((list) => {
        if (!cancelled) setProducts(list);
      })
      .catch((error) => {
        console.error('[caspian-store] Wishlist load failed:', error);
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [db, wishlist]);

  if (!signedIn) {
    return (
      <section className={className} style={cardStyle}>
        <h2 style={titleStyle}>{t('wishlist.panel.title')}</h2>
        <p style={{ color: '#666', margin: '8px 0 0' }}>{t('wishlist.panel.signInRequired')}</p>
      </section>
    );
  }

  const handleRemove = async (productId: string) => {
    setBusyId(productId);
    try {
      await remove(productId);
      toast({ title: t('wishlist.removed') });
    } catch (error) {
      console.error('[caspian-store] Remove from wishlist failed:', error);
      toast({ title: t('wishlist.failed'), variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    toast({ title: t('product.addedToCart') });
  };

  return (
    <section className={className} style={cardStyle}>
      <header style={{ marginBottom: 16 }}>
        <h2 style={titleStyle}>{t('wishlist.panel.title')}</h2>
        <p style={{ color: '#666', margin: '4px 0 0', fontSize: 13 }}>
          {t('wishlist.panel.subtitle')}
        </p>
      </header>

      {loading && products.length === 0 ? (
        <p style={{ color: '#888', fontSize: 14, padding: '16px 0', margin: 0 }}>
          {t('common.loading')}
        </p>
      ) : products.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <p style={{ color: '#666', margin: 0 }}>{t('wishlist.panel.empty')}</p>
          <div style={{ marginTop: 12 }}>
            <Link href={browseHref} style={{ textDecoration: 'none' }}>
              <Button variant="outline" size="sm">
                {t('wishlist.panel.emptyCta')}
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {products.map((product) => {
            const img = product.images?.[0];
            const busy = busyId === product.id;
            return (
              <li
                key={product.id}
                style={{
                  border: '1px solid #eee',
                  borderRadius: 'var(--caspian-radius, 8px)',
                  padding: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  background: '#fff',
                }}
              >
                <Link
                  href={getProductHref(product.slug ?? product.id)}
                  style={{
                    display: 'block',
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    overflow: 'hidden',
                    borderRadius: 'var(--caspian-radius, 6px)',
                    background: '#f5f5f5',
                  }}
                >
                  {img ? (
                    <Image src={img.url} alt={img.alt || product.name} fill />
                  ) : null}
                </Link>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Link
                    href={getProductHref(product.slug ?? product.id)}
                    style={{
                      color: 'inherit',
                      textDecoration: 'none',
                      fontSize: 14,
                      fontWeight: 500,
                      lineHeight: 1.3,
                    }}
                  >
                    {product.name}
                  </Link>
                  <span style={{ fontSize: 14, color: '#333' }}>{formatPrice(product.price)}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    style={{ flex: 1 }}
                    disabled={busy}
                  >
                    {t('wishlist.panel.addToCart')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(product.id)}
                    disabled={busy}
                  >
                    {t('wishlist.panel.remove')}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  padding: 20,
  border: '1px solid #eee',
  borderRadius: 'var(--caspian-radius, 8px)',
  background: '#fff',
};
const titleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  margin: 0,
};
