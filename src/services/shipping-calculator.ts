import type { Firestore } from 'firebase/firestore';
import type { CartItem, ShippingInfo, ShippingPluginInstall } from '../types';
import { getShippingPlugin } from '../shipping/catalog';
import type { ShippingRate } from '../shipping/types';
import { listShippingPluginInstalls } from './shipping-plugin-service';

export interface CalculateShippingRatesInput {
  db: Firestore;
  items: CartItem[];
  subtotal: number;
  address: ShippingInfo | null;
  currency: string;
  /** Optional: skip the Firestore fetch and calculate against a pre-loaded list. */
  installs?: ShippingPluginInstall[];
}

/**
 * Resolves enabled plugin installs into a list of offered rates for the given
 * cart. Plugins that return `null` from their `calculate` (e.g. Weight-Based
 * with no weighted items) are dropped. Invalid configs are dropped with a
 * console warning so a bad admin save doesn't take the whole checkout down.
 */
export async function calculateShippingRates(
  input: CalculateShippingRatesInput,
): Promise<ShippingRate[]> {
  const installs =
    input.installs ?? (await listShippingPluginInstalls(input.db, { onlyEnabled: true }));

  const ctx = {
    subtotal: input.subtotal,
    items: input.items,
    address: input.address,
    currency: input.currency,
  };

  const rates: ShippingRate[] = [];
  for (const install of installs) {
    if (!install.enabled) continue;
    const plugin = getShippingPlugin(install.pluginId);
    if (!plugin) {
      console.warn(
        `[caspian-store] Unknown shipping plugin "${install.pluginId}" on install ${install.id}; skipping.`,
      );
      continue;
    }
    let validated: unknown;
    try {
      validated = plugin.validateConfig(install.config);
    } catch (error) {
      console.warn(
        `[caspian-store] Shipping install ${install.id} (${install.pluginId}) has invalid config:`,
        error,
      );
      continue;
    }
    const price = plugin.calculate(validated, ctx);
    if (price === null || !Number.isFinite(price) || price < 0) continue;
    rates.push({
      installId: install.id,
      pluginId: install.pluginId,
      label: install.name,
      price,
      estimatedDays: install.estimatedDays,
      eligibleCountries: install.eligibleCountries,
    });
  }
  return rates;
}
