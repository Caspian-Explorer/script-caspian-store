import type { FeatureFlags, ThemeTokens } from '../../types';

export interface SiteInfoDraft {
  brandName: string;
  brandDescription: string;
  contactEmail: string;
  currency: string;
}

export interface BrandingDraft {
  /** Name of the selected preset in `THEME_PRESETS`, or empty string for custom. */
  themePreset: string;
  theme: ThemeTokens;
  heroTitle: string;
  heroSubtitle: string;
  heroCta: string;
}

export interface WizardDraft {
  siteInfo: SiteInfoDraft;
  branding: BrandingDraft;
  features: FeatureFlags;
}
