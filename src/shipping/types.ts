import type { CartItem, ShippingInfo } from '../types';

export type ShippingPluginId =
  | 'flat-rate'
  | 'free-shipping'
  | 'free-over-threshold'
  | 'weight-based';

export const SHIPPING_PLUGIN_IDS: readonly ShippingPluginId[] = [
  'flat-rate',
  'free-shipping',
  'free-over-threshold',
  'weight-based',
] as const;

export interface CalculationContext {
  /** Cart subtotal in base currency units (e.g. 42.50 for $42.50). */
  subtotal: number;
  items: CartItem[];
  /** Shipping destination. May be null when the calculator is invoked before the address is filled. */
  address: ShippingInfo | null;
  currency: string;
}

export interface ShippingRate {
  installId: string;
  pluginId: ShippingPluginId;
  label: string;
  price: number;
  estimatedDays: { min: number; max: number };
}

export interface PluginDescribeContext {
  currency: string;
  formatPrice: (amount: number) => string;
}

export interface ShippingPlugin<C = unknown> {
  id: ShippingPluginId;
  name: string;
  description: string;
  defaultConfig: C;
  /** Parse raw Firestore config into the plugin's typed shape. Throws with a user-facing message on invalid input. */
  validateConfig: (config: unknown) => C;
  /** Compute shipping price for this cart. Return `null` to hide the plugin from the rate picker (e.g. weight-based when no items have weight). */
  calculate: (config: C, ctx: CalculationContext) => number | null;
  /** Human-readable summary of the config. Rendered on the public Shipping & Returns page. */
  describe: (config: C, ctx: PluginDescribeContext) => string;
}

// Plugin config shapes — exported so consumers and the admin UI can reference them.

export interface FlatRateConfig {
  price: number;
}

export type FreeShippingConfig = Record<string, never>;

export interface FreeOverThresholdConfig {
  threshold: number;
  fallbackPrice: number;
}

export interface WeightBasedConfig {
  basePrice: number;
  pricePerKg: number;
}
