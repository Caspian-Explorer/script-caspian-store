import type { ThemeTokens } from '../types';

export type ThemeCategory =
  | 'all'
  | 'corporate'
  | 'shop'
  | 'creative'
  | 'portfolio'
  | 'education'
  | 'health-beauty'
  | 'events'
  | 'food'
  | 'marketing'
  | 'minimal';

export const THEME_CATEGORY_LABELS: Record<ThemeCategory, string> = {
  all: 'All themes',
  corporate: 'Corporate',
  shop: 'Shop / WooCommerce',
  creative: 'Creative',
  portfolio: 'Portfolio',
  education: 'Education',
  'health-beauty': 'Health & Beauty',
  events: 'Events',
  food: 'Food',
  marketing: 'Marketing',
  minimal: 'Minimal',
};

export interface ThemeThumbnail {
  background: string;
  foreground: string;
  accent: string;
  wordmark: string;
  tagline?: string;
}

export interface CatalogTheme {
  id: string;
  name: string;
  description: string;
  categories: readonly Exclude<ThemeCategory, 'all'>[];
  isNew?: boolean;
  tokens: ThemeTokens;
  thumbnail: ThemeThumbnail;
  fontFamily?: string;
  /**
   * Per-theme semver. Bumped only when this theme's tokens, thumbnail, or copy
   * change in a release. The Appearance admin page reads it via
   * `useThemeUpdateTracker` and shows an "Updated" pill on cards whose version
   * differs from the per-user seen map in localStorage. Added in v8.1.
   */
  version: string;
  /**
   * Optional Google Fonts families to auto-load when this theme activates
   * (e.g. `["Poppins:wght@400;500;600;700"]`). The admin's activation handler
   * forwards them into `settings.fonts.googleFamilies` so `<FontLoader>`
   * injects the CSS link without consumer hand-edits. Added in v8.1.
   */
  googleFamilies?: string[];
}
