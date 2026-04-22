import type { ThemeTokens } from '../types';

/**
 * Opinionated starting points for shop theming. Consumers apply via script
 * settings: `save({ theme: THEME_PRESETS.cleanWhite })` — or by clicking a
 * preset in `<ThemePresetPicker />`.
 */
export const THEME_PRESETS = {
  cleanWhite: {
    primary: '#111111',
    primaryForeground: '#ffffff',
    accent: '#171717',
    radius: '0.5rem',
  },
} as const satisfies Record<string, ThemeTokens>;

export type ThemePresetName = keyof typeof THEME_PRESETS;

export const THEME_PRESET_LABELS: Record<ThemePresetName, string> = {
  cleanWhite: 'Clean white',
};
