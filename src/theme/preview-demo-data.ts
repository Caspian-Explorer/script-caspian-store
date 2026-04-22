export interface DemoProduct {
  id: string;
  name: string;
  brand: string;
  price: string;
  badge?: string;
  swatch: string;
}

export const DEMO_PRODUCTS: readonly DemoProduct[] = [
  { id: 'p1', name: 'Linen Crewneck', brand: 'House Label', price: '$68', badge: 'New', swatch: '#e8e3d8' },
  { id: 'p2', name: 'Stone-washed Denim', brand: 'House Label', price: '$124', swatch: '#4a5568' },
  { id: 'p3', name: 'Minimal Tote', brand: 'Studio', price: '$42', badge: 'Limited', swatch: '#d4b996' },
  { id: 'p4', name: 'Everyday Tee', brand: 'House Label', price: '$34', swatch: '#1a1a1a' },
  { id: 'p5', name: 'Weekend Shorts', brand: 'Studio', price: '$58', swatch: '#8ba888' },
  { id: 'p6', name: 'Silk Scarf', brand: 'House Label', price: '$96', badge: 'New', swatch: '#c77d7d' },
];

export const DEMO_HERO = {
  eyebrow: 'Spring 2026',
  title: 'New season, quiet edits.',
  subtitle: 'Eight pieces that pair with what you already own. Made slowly, shipped carbon-neutral.',
  cta: 'Shop the edit',
};

export const DEMO_NAV = ['Shop', 'New in', 'Studio', 'Journal', 'Contact'];

export const DEMO_BRAND = 'Demo Store';
