import type { CatalogTheme } from '../../types';

const pastelStudio: CatalogTheme = {
  id: 'pastelStudio',
  name: 'Pastel studio',
  description: 'Soft peach on slate. Gentle, crafted, handmade.',
  categories: ['creative', 'portfolio', 'health-beauty'],
  version: '1.0.0',
  tokens: { primary: '#334155', primaryForeground: '#ffffff', accent: '#fcd6c3', radius: '1rem' },
  thumbnail: {
    background: '#fcd6c3',
    foreground: '#334155',
    accent: '#ffffff',
    wordmark: 'Pastel',
    tagline: 'studio',
  },
};

export default pastelStudio;
