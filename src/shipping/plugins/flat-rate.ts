import type { FlatRateConfig, ShippingPlugin } from '../types';

export const FLAT_RATE_PLUGIN: ShippingPlugin<FlatRateConfig> = {
  id: 'flat-rate',
  name: 'Flat Rate',
  description: 'Charge a fixed price on every order.',
  defaultConfig: { price: 5 },
  validateConfig: (config) => {
    const c = (config ?? {}) as Partial<FlatRateConfig>;
    const price = Number(c.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new Error('Flat rate price must be a non-negative number.');
    }
    return { price };
  },
  calculate: (config) => config.price,
  describe: (config, ctx) => ctx.formatPrice(config.price),
};
