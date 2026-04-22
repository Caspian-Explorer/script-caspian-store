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
}

export const THEME_CATALOG: readonly CatalogTheme[] = [
  {
    id: 'cleanWhite',
    name: 'Clean white',
    description: 'Neutral charcoal on white. A minimal editorial default.',
    categories: ['minimal', 'corporate', 'shop'],
    tokens: { primary: '#111111', primaryForeground: '#ffffff', accent: '#171717', radius: '0.5rem' },
    thumbnail: { background: '#ffffff', foreground: '#111111', accent: '#d1d5db', wordmark: 'Clean', tagline: 'minimal · editorial' },
  },
  {
    id: 'minimalDark',
    name: 'Minimal dark',
    description: 'Inverted monochrome with a hot-pink accent. Nightshift mode.',
    categories: ['creative', 'portfolio', 'minimal'],
    tokens: { primary: '#ffffff', primaryForeground: '#0a0a0a', accent: '#ec4899', radius: '0.5rem' },
    thumbnail: { background: '#0a0a0a', foreground: '#ffffff', accent: '#ec4899', wordmark: 'Dark', tagline: 'after hours' },
  },
  {
    id: 'boutique',
    name: 'Boutique',
    description: 'Warm brown on cream with gold accents. Heritage retail.',
    categories: ['shop', 'health-beauty'],
    tokens: { primary: '#5b2d1f', primaryForeground: '#f8f5ef', accent: '#d4a574', radius: '0.25rem' },
    thumbnail: { background: '#f8f5ef', foreground: '#5b2d1f', accent: '#d4a574', wordmark: 'Boutique', tagline: 'since 1974' },
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Big radius, monochrome. Magazine-first portfolios.',
    categories: ['portfolio', 'creative'],
    isNew: true,
    tokens: { primary: '#1f1f1f', primaryForeground: '#fafafa', accent: '#9a9a9a', radius: '1rem' },
    fontFamily: "'Fraunces', Georgia, serif",
    thumbnail: { background: '#fafafa', foreground: '#1f1f1f', accent: '#9a9a9a', wordmark: 'Editorial', tagline: 'issue 014' },
  },
  {
    id: 'neonShop',
    name: 'Neon shop',
    description: 'High-energy lime on near-black. Drops and streetwear.',
    categories: ['shop', 'marketing', 'creative'],
    tokens: { primary: '#0a0a0a', primaryForeground: '#f5fff0', accent: '#a3ff00', radius: '0.75rem' },
    thumbnail: { background: '#0a0a0a', foreground: '#a3ff00', accent: '#a3ff00', wordmark: 'Neon', tagline: 'drop 04 · LIVE' },
  },
  {
    id: 'pastelStudio',
    name: 'Pastel studio',
    description: 'Soft peach on slate. Gentle, crafted, handmade.',
    categories: ['creative', 'portfolio', 'health-beauty'],
    tokens: { primary: '#334155', primaryForeground: '#ffffff', accent: '#fcd6c3', radius: '1rem' },
    thumbnail: { background: '#fcd6c3', foreground: '#334155', accent: '#ffffff', wordmark: 'Pastel', tagline: 'studio' },
  },
  {
    id: 'academy',
    name: 'Academy',
    description: 'Navy + ivory. Trustworthy classrooms and cohorts.',
    categories: ['education', 'events'],
    isNew: true,
    tokens: { primary: '#0f2e5a', primaryForeground: '#fefcf7', accent: '#c9a961', radius: '0.375rem' },
    fontFamily: "'Fraunces', Georgia, serif",
    thumbnail: { background: '#fefcf7', foreground: '#0f2e5a', accent: '#c9a961', wordmark: 'Academy', tagline: 'est. 2026' },
  },
  {
    id: 'kitchenTable',
    name: 'Kitchen table',
    description: 'Tomato red on warm cream. Menus, delivery, pantry.',
    categories: ['food', 'shop'],
    tokens: { primary: '#b23a2b', primaryForeground: '#fff8ec', accent: '#f4a261', radius: '0.625rem' },
    thumbnail: { background: '#fff8ec', foreground: '#b23a2b', accent: '#f4a261', wordmark: 'Kitchen', tagline: 'table · menu' },
  },
  {
    id: 'forumBlue',
    name: 'Forum blue',
    description: 'Professional royal blue. Enterprise, SaaS, consulting.',
    categories: ['corporate', 'marketing'],
    tokens: { primary: '#1e40af', primaryForeground: '#ffffff', accent: '#0ea5e9', radius: '0.5rem' },
    thumbnail: { background: '#f8fafc', foreground: '#1e40af', accent: '#0ea5e9', wordmark: 'Forum', tagline: 'for teams' },
  },
  {
    id: 'runway',
    name: 'Runway',
    description: 'High-contrast monochrome with bold serif wordmark.',
    categories: ['shop', 'portfolio', 'marketing'],
    tokens: { primary: '#000000', primaryForeground: '#ffffff', accent: '#dc2626', radius: '0rem' },
    fontFamily: "'Playfair Display', 'Times New Roman', serif",
    thumbnail: { background: '#ffffff', foreground: '#000000', accent: '#dc2626', wordmark: 'Runway', tagline: 'SS26' },
  },
];

export function findCatalogTheme(id: string): CatalogTheme | undefined {
  return THEME_CATALOG.find((t) => t.id === id);
}

export function countThemesByCategory(): Record<ThemeCategory, number> {
  const counts: Record<ThemeCategory, number> = {
    all: THEME_CATALOG.length,
    corporate: 0,
    shop: 0,
    creative: 0,
    portfolio: 0,
    education: 0,
    'health-beauty': 0,
    events: 0,
    food: 0,
    marketing: 0,
    minimal: 0,
  };
  for (const theme of THEME_CATALOG) {
    for (const cat of theme.categories) counts[cat] += 1;
  }
  return counts;
}
