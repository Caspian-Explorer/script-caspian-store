import type { ThemeTokens } from '../types';

/**
 * Opinionated starting points for shop theming. Consumers apply via script
 * settings: `save({ theme: THEME_PRESETS.minimalLight })` — or by clicking a
 * preset in `<ThemePresetPicker />`.
 */
export const THEME_PRESETS = {
  minimalLight: {
    primary: '#111111',
    primaryForeground: '#ffffff',
    accent: '#f5a8b8',
    radius: '0.5rem',
  },
  minimalDark: {
    primary: '#ffffff',
    primaryForeground: '#111111',
    accent: '#ec4899',
    radius: '0.5rem',
  },
  boutique: {
    primary: '#5b2d1f',
    primaryForeground: '#f8f5ef',
    accent: '#d4a574',
    radius: '0.25rem',
  },
  neon: {
    primary: '#0a0a0a',
    primaryForeground: '#f5fff0',
    accent: '#a3ff00',
    radius: '0.75rem',
  },
  pastel: {
    primary: '#334155',
    primaryForeground: '#ffffff',
    accent: '#fcd6c3',
    radius: '1rem',
  },
  monochrome: {
    primary: '#1f1f1f',
    primaryForeground: '#fafafa',
    accent: '#9a9a9a',
    radius: '0rem',
  },
} as const satisfies Record<string, ThemeTokens>;

export type ThemePresetName = keyof typeof THEME_PRESETS;

export const THEME_PRESET_LABELS: Record<ThemePresetName, string> = {
  minimalLight: 'Minimal light',
  minimalDark: 'Minimal dark',
  boutique: 'Boutique',
  neon: 'Neon',
  pastel: 'Pastel',
  monochrome: 'Monochrome',
};
