'use client';

import { useState } from 'react';
import type { ProductImage } from '../types';
import { useCaspianImage } from '../provider/caspian-store-provider';
import { cn } from '../utils/cn';

export function ProductGallery({ images, className }: { images: ProductImage[]; className?: string }) {
  const Image = useCaspianImage();
  const [active, setActive] = useState(0);
  const main = images[active];

  if (!main) {
    return (
      <div
        className={className}
        style={{
          aspectRatio: '3 / 4',
          background: '#f5f5f5',
          borderRadius: 'var(--caspian-radius, 8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
        }}
      >
        No images
      </div>
    );
  }

  return (
    <div className={cn('caspian-product-gallery', className)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          position: 'relative',
          aspectRatio: '3 / 4',
          background: '#f5f5f5',
          overflow: 'hidden',
          borderRadius: 'var(--caspian-radius, 8px)',
        }}
      >
        <Image src={main.url} alt={main.alt || ''} fill priority />
      </div>
      {images.length > 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(images.length, 6)}, 1fr)`, gap: 8 }}>
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              style={{
                position: 'relative',
                aspectRatio: '1',
                background: '#f5f5f5',
                borderRadius: 6,
                overflow: 'hidden',
                border: active === i ? '2px solid var(--caspian-primary, #111)' : '2px solid transparent',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <Image src={img.url} alt={img.alt || ''} fill />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
