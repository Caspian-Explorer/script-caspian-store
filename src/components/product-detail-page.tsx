'use client';

import { useEffect, useState } from 'react';
import type { Product } from '../types';
import { getProductById } from '../services/product-service';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { useCart } from '../context/cart-context';
import { useToast } from '../ui/toast';
import { Button } from '../ui/button';
import { Badge, Separator, Skeleton } from '../ui/misc';
import { ProductGallery } from './product-gallery';
import { QuantitySelector, SizeSelector } from './product-selectors';
import { ProductReviews } from './reviews/product-reviews';

export interface ProductDetailPageProps {
  /** Either pass an id (we'll fetch) or a pre-fetched product. */
  productId?: string;
  product?: Product;
  /** Optional formatter for price display. Default: `$x.xx`. */
  formatPrice?: (price: number) => string;
  /** Hide the Reviews & Questions section. */
  hideReviews?: boolean;
  onNotFound?: () => void;
  className?: string;
}

export function ProductDetailPage({
  productId,
  product: externalProduct,
  formatPrice = (p) => `$${p.toFixed(2)}`,
  hideReviews,
  onNotFound,
  className,
}: ProductDetailPageProps) {
  const { db } = useCaspianFirebase();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(externalProduct ?? null);
  const [loading, setLoading] = useState(!externalProduct);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [avg, setAvg] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    if (externalProduct) {
      setProduct(externalProduct);
      setLoading(false);
      return;
    }
    if (!productId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const p = await getProductById(db, productId);
        if (!alive) return;
        if (!p) {
          onNotFound?.();
          setProduct(null);
        } else {
          setProduct(p);
          if (p.sizes && p.sizes.length > 0) setSelectedSize(p.sizes[0]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [db, productId, externalProduct, onNotFound]);

  if (loading) {
    return (
      <div className={className} style={gridStyle}>
        <Skeleton style={{ aspectRatio: '3 / 4' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton style={{ height: 14, width: '30%' }} />
          <Skeleton style={{ height: 24, width: '80%' }} />
          <Skeleton style={{ height: 18, width: '40%' }} />
          <Skeleton style={{ height: 40, width: '50%' }} />
        </div>
      </div>
    );
  }

  if (!product) {
    return <p style={{ textAlign: 'center', padding: 40, color: '#888' }}>Product not found.</p>;
  }

  const hasSizes = product.sizes && product.sizes.length > 0;

  const handleAddToCart = () => {
    if (hasSizes && !selectedSize) {
      toast({ title: 'Select a size', variant: 'destructive' });
      return;
    }
    addToCart(product, quantity, selectedSize);
    toast({ title: 'Added to cart', description: product.name });
    setQuantity(1);
  };

  return (
    <div className={className}>
      <div style={gridStyle}>
        <ProductGallery images={product.images} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {product.isNew && <Badge variant="secondary">New</Badge>}
            {product.limited && <Badge variant="destructive">Limited</Badge>}
          </div>
          <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', margin: 0 }}>
            {product.brand}
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '4px 0 12px' }}>{product.name}</h1>

          {totalReviews > 0 && (
            <p style={{ color: '#666', fontSize: 14, marginTop: 0 }}>
              {avg.toFixed(1)} ★ · {totalReviews} review{totalReviews === 1 ? '' : 's'}
            </p>
          )}

          <p style={{ fontSize: 28, fontWeight: 700, margin: '16px 0' }}>{formatPrice(product.price)}</p>

          <Separator />

          {hasSizes && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Size</p>
              <SizeSelector sizes={product.sizes!} value={selectedSize} onChange={setSelectedSize} />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Quantity</p>
            <QuantitySelector value={quantity} onChange={setQuantity} />
          </div>

          <Button size="lg" onClick={handleAddToCart}>
            Add to cart
          </Button>

          <Separator />

          <div>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Description</h2>
            <p style={{ color: '#555', lineHeight: 1.6, margin: 0 }}>{product.description}</p>
          </div>
        </div>
      </div>

      {!hideReviews && (
        <ProductReviews
          productId={product.id}
          onSummaryChange={({ average, total }) => {
            setAvg(average);
            setTotalReviews(total);
          }}
        />
      )}
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: 32,
};
