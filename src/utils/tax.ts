import type { SiteSettings, TaxConfig } from '../types';

export const DEFAULT_TAX_CONFIG: TaxConfig = {
  pricesEnteredWithTax: false,
  taxBasedOn: 'shipping',
  roundAtSubtotalLevel: true,
  displayPricesInShop: 'excl',
  displayPricesCartCheckout: 'excl',
  priceDisplaySuffix: '',
  displayTaxTotals: 'single',
};

/**
 * Resolve the ISO 3166 country code whose tax rate should drive the
 * computation for a given checkout, honoring `SiteSettings.taxConfig.taxBasedOn`.
 * Returns an empty string when the mode is `store` but the merchant hasn't
 * set a store country — callers should treat that as "no tax".
 */
export function resolveTaxCountryCode(
  site: Pick<SiteSettings, 'country' | 'taxConfig'> | null,
  shippingCountry: string,
  billingCountry: string = shippingCountry,
): string {
  const mode = site?.taxConfig?.taxBasedOn ?? 'shipping';
  if (mode === 'store') return site?.country ?? '';
  if (mode === 'billing') return billingCountry;
  return shippingCountry;
}

/**
 * Render the merchant-configured price-display suffix. Resolves the `{rate}`
 * placeholder to a percent string (e.g. `"8%"`) when the caller has a rate
 * in hand; otherwise leaves the placeholder verbatim so a downstream render
 * can still resolve it.
 */
export function renderPriceSuffix(
  config: TaxConfig | undefined,
  rate: number | null = null,
): string {
  const suffix = config?.priceDisplaySuffix?.trim();
  if (!suffix) return '';
  if (rate === null) return suffix;
  const pct = `${Math.round(rate * 10000) / 100}%`;
  return suffix.split('{rate}').join(pct);
}
