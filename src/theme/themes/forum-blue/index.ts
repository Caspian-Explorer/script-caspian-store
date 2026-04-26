import type { CatalogTheme } from '../../types';

const forumBlue: CatalogTheme = {
  id: 'forumBlue',
  name: 'Forum blue',
  description: 'Professional royal blue. Enterprise, SaaS, consulting.',
  categories: ['corporate', 'marketing'],
  version: '1.0.0',
  tokens: { primary: '#1e40af', primaryForeground: '#ffffff', accent: '#0ea5e9', radius: '0.5rem' },
  thumbnail: {
    background: '#f8fafc',
    foreground: '#1e40af',
    accent: '#0ea5e9',
    wordmark: 'Forum',
    tagline: 'for teams',
  },
};

export default forumBlue;
