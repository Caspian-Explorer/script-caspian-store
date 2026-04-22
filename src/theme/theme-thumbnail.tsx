'use client';

import type { CatalogTheme } from './catalog';

export interface ThemeThumbnailProps {
  theme: CatalogTheme;
  className?: string;
}

export function ThemeThumbnail({ theme, className }: ThemeThumbnailProps) {
  const { thumbnail, tokens } = theme;
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 200"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`${theme.name} theme preview`}
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <rect width="300" height="200" fill={thumbnail.background} />
      <rect x="0" y="0" width="300" height="4" fill={thumbnail.accent} />
      <text
        x="24"
        y="92"
        fontFamily={theme.fontFamily ?? "'Inter', system-ui, sans-serif"}
        fontSize="34"
        fontWeight="700"
        fill={thumbnail.foreground}
      >
        {thumbnail.wordmark}
      </text>
      {thumbnail.tagline && (
        <text
          x="24"
          y="112"
          fontFamily={theme.fontFamily ?? "'Inter', system-ui, sans-serif"}
          fontSize="11"
          fontWeight="400"
          fill={thumbnail.foreground}
          opacity="0.65"
        >
          {thumbnail.tagline}
        </text>
      )}
      <rect x="24" y="128" width="86" height="24" rx={parseRadius(tokens.radius) * 6} fill={tokens.primary} />
      <text
        x="67"
        y="144"
        textAnchor="middle"
        fontFamily="'Inter', system-ui, sans-serif"
        fontSize="10"
        fontWeight="600"
        fill={tokens.primaryForeground}
      >
        Shop now
      </text>
      <rect x="200" y="48" width="76" height="104" rx={parseRadius(tokens.radius) * 6} fill={thumbnail.foreground} opacity="0.08" />
      <rect x="210" y="58" width="56" height="56" rx={parseRadius(tokens.radius) * 4} fill={thumbnail.accent} opacity="0.9" />
      <rect x="210" y="122" width="56" height="6" rx="2" fill={thumbnail.foreground} opacity="0.75" />
      <rect x="210" y="134" width="36" height="6" rx="2" fill={thumbnail.foreground} opacity="0.5" />
      <rect x="24" y="180" width="252" height="1" fill={thumbnail.foreground} opacity="0.15" />
    </svg>
  );
}

function parseRadius(radius: string): number {
  const num = parseFloat(radius);
  return Number.isFinite(num) ? num : 0.5;
}
