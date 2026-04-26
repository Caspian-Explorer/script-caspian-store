import type { CatalogTheme } from '../../types';

const kitchenTable: CatalogTheme = {
  id: 'kitchenTable',
  name: 'Kitchen table',
  description: 'Tomato red on warm cream. Menus, delivery, pantry.',
  categories: ['food', 'shop'],
  version: '1.0.0',
  tokens: { primary: '#b23a2b', primaryForeground: '#fff8ec', accent: '#f4a261', radius: '0.625rem' },
  thumbnail: {
    background: '#fff8ec',
    foreground: '#b23a2b',
    accent: '#f4a261',
    wordmark: 'Kitchen',
    tagline: 'table · menu',
  },
};

export default kitchenTable;
