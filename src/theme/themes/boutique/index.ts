import type { CatalogTheme } from '../../types';

const boutique: CatalogTheme = {
  id: 'boutique',
  name: 'Boutique',
  description: 'Warm brown on cream with gold accents. Heritage retail.',
  categories: ['shop', 'health-beauty'],
  version: '1.0.0',
  tokens: { primary: '#5b2d1f', primaryForeground: '#f8f5ef', accent: '#d4a574', radius: '0.25rem' },
  thumbnail: {
    background: '#f8f5ef',
    foreground: '#5b2d1f',
    accent: '#d4a574',
    wordmark: 'Boutique',
    tagline: 'since 1974',
  },
};

export default boutique;
