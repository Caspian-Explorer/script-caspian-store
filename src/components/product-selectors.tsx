'use client';

import { cn } from '../utils/cn';

export function SizeSelector({
  sizes,
  value,
  onChange,
  className,
}: {
  sizes: string[];
  value?: string;
  onChange: (size: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('caspian-size-selector', className)} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {sizes.map((s) => {
        const active = s === value;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            style={{
              minWidth: 48,
              padding: '8px 12px',
              border: `1px solid ${active ? 'var(--caspian-primary, #111)' : 'rgba(0,0,0,0.15)'}`,
              background: active ? 'var(--caspian-primary, #111)' : 'transparent',
              color: active ? 'var(--caspian-primary-foreground, #fff)' : 'inherit',
              borderRadius: 'var(--caspian-radius, 6px)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const btn: React.CSSProperties = {
    width: 36,
    height: 36,
    border: '1px solid rgba(0,0,0,0.15)',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: 18,
    lineHeight: 1,
  };
  return (
    <div
      className={cn('caspian-quantity', className)}
      style={{ display: 'inline-flex', alignItems: 'center', borderRadius: 'var(--caspian-radius, 6px)', overflow: 'hidden' }}
    >
      <button type="button" aria-label="Decrease quantity" onClick={() => onChange(clamp(value - 1))} style={btn}>
        −
      </button>
      <span style={{ minWidth: 40, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{value}</span>
      <button type="button" aria-label="Increase quantity" onClick={() => onChange(clamp(value + 1))} style={btn}>
        +
      </button>
    </div>
  );
}
