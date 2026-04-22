import { FLAT_RATE_PLUGIN } from './plugins/flat-rate';
import { FREE_OVER_THRESHOLD_PLUGIN } from './plugins/free-over-threshold';
import { FREE_SHIPPING_PLUGIN } from './plugins/free-shipping';
import { WEIGHT_BASED_PLUGIN } from './plugins/weight-based';
import type { ShippingPlugin, ShippingPluginId } from './types';

export const SHIPPING_PLUGIN_CATALOG: Record<ShippingPluginId, ShippingPlugin> = {
  'flat-rate': FLAT_RATE_PLUGIN as ShippingPlugin,
  'free-shipping': FREE_SHIPPING_PLUGIN as ShippingPlugin,
  'free-over-threshold': FREE_OVER_THRESHOLD_PLUGIN as ShippingPlugin,
  'weight-based': WEIGHT_BASED_PLUGIN as ShippingPlugin,
};

export function getShippingPlugin(id: string): ShippingPlugin | null {
  return (SHIPPING_PLUGIN_CATALOG as Record<string, ShippingPlugin>)[id] ?? null;
}
