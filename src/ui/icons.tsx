import type { SVGProps } from 'react';

/**
 * Tiny stroke-based inline SVG icons used by the admin surface (3-dot action
 * menus, view-on-storefront links, profile dropdowns, etc.). Inline to avoid
 * adding a dependency; `currentColor` + `stroke-width: 2` makes them inherit
 * whatever button / link they sit inside.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function svgDefaults({ size = 16, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...rest,
  };
}

export function MoreHorizontalIcon(props: IconProps) {
  return (
    <svg {...svgDefaults(props)}>
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <svg {...svgDefaults(props)}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...svgDefaults(props)}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <svg {...svgDefaults(props)}>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 14v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}
