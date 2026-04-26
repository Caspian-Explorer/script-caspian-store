import type { CatalogTheme } from '../../types';

const neonShop: CatalogTheme = {
  id: 'neonShop',
  name: 'Neon shop',
  description: 'High-energy lime on near-black. Drops and streetwear.',
  categories: ['shop', 'marketing', 'creative'],
  version: '1.0.0',
  tokens: { primary: '#0a0a0a', primaryForeground: '#f5fff0', accent: '#a3ff00', radius: '0.75rem' },
  thumbnail: {
    background: '#0a0a0a',
    foreground: '#a3ff00',
    accent: '#a3ff00',
    wordmark: 'Neon',
    tagline: 'drop 04 · LIVE',
  },
};

export default neonShop;
