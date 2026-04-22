import type { FreeShippingConfig, ShippingPlugin } from '../types';

export const FREE_SHIPPING_PLUGIN: ShippingPlugin<FreeShippingConfig> = {
  id: 'free-shipping',
  name: 'Free Shipping',
  description: 'Offer shipping at no cost — useful for gifts, digital goods, or promotional periods.',
  defaultConfig: {},
  validateConfig: () => ({}),
  calculate: () => 0,
  describe: () => 'Free',
};
