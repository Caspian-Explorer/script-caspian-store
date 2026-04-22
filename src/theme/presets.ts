import type { ThemeTokens } from '../types';
import { THEME_CATALOG } from './catalog';

/**
 * Map of theme tokens keyed by catalog id — derived from `THEME_CATALOG`.
 * Back-compat shim for code that references preset tokens directly, e.g.
 * `save({ theme: THEME_PRESETS.cleanWhite })`.
 */
export const THEME_PRESETS: Record<string, ThemeTokens> = Object.fromEntries(
  THEME_CATALOG.map((t) => [t.id, t.tokens]),
);

export type ThemePresetName = string;

export const THEME_PRESET_LABELS: Record<string, string> = Object.fromEntries(
  THEME_CATALOG.map((t) => [t.id, t.name]),
);
