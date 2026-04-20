import type { ComponentType, ReactNode } from 'react';

/**
 * Minimal contract the host framework must satisfy so Caspian Store components
 * can render links, images, and navigate without depending on next/link, next/image
 * or next/navigation.
 *
 * Consumers pass these via <CaspianStoreProvider adapters={{ ... }}>.
 */

export interface CaspianLinkProps {
  href: string;
  className?: string;
  children?: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  target?: string;
  rel?: string;
  'aria-label'?: string;
}

export type CaspianLinkComponent = ComponentType<CaspianLinkProps>;

export interface CaspianImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  fill?: boolean;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
}

export type CaspianImageComponent = ComponentType<CaspianImageProps>;

export interface CaspianNavigation {
  /** Full pathname of the current route, e.g. `/product/abc`. */
  pathname: string;
  /** Push a new route. */
  push: (href: string) => void;
  /** Replace the current route. */
  replace: (href: string) => void;
  /** Navigate back in history. */
  back: () => void;
}

export type UseCaspianNavigation = () => CaspianNavigation;

export interface FrameworkAdapters {
  Link: CaspianLinkComponent;
  Image?: CaspianImageComponent;
  useNavigation: UseCaspianNavigation;
}
