'use client';

import { useState } from 'react';
import { cn } from '../utils/cn';
import { StarIcon } from './star-icon';

export interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
  className?: string;
}

const SIZE_CLASS = {
  sm: 'caspian-w-4 caspian-h-4',
  md: 'caspian-w-6 caspian-h-6',
  lg: 'caspian-w-8 caspian-h-8',
} as const;

export function StarRatingInput({
  value,
  onChange,
  size = 'lg',
  ariaLabel = 'Rating',
  className,
}: StarRatingInputProps) {
  const [hover, setHover] = useState(0);
  const display = hover || value;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('caspian-flex caspian-items-center caspian-gap-1', className)}
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const active = i <= display;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} star${i === 1 ? '' : 's'}`}
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(0)}
            className="caspian-rounded focus:caspian-outline-none focus-visible:caspian-ring-2 caspian-transition-transform hover:caspian-scale-110"
            style={{ color: active ? '#f59e0b' : 'rgba(100,100,100,0.4)' }}
          >
            <StarIcon
              className={SIZE_CLASS[size]}
              fill={active ? 'currentColor' : 'none'}
            />
          </button>
        );
      })}
    </div>
  );
}
