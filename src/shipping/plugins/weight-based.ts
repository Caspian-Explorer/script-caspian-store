import type { ShippingPlugin, WeightBasedConfig } from '../types';

export const WEIGHT_BASED_PLUGIN: ShippingPlugin<WeightBasedConfig> = {
  id: 'weight-based',
  name: 'Weight-Based',
  description: 'Charge a base rate plus a per-kilogram surcharge. Requires each product to have a weight.',
  defaultConfig: { basePrice: 4, pricePerKg: 2 },
  validateConfig: (config) => {
    const c = (config ?? {}) as Partial<WeightBasedConfig>;
    const basePrice = Number(c.basePrice);
    const pricePerKg = Number(c.pricePerKg);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      throw new Error('Base price must be a non-negative number.');
    }
    if (!Number.isFinite(pricePerKg) || pricePerKg < 0) {
      throw new Error('Price per kg must be a non-negative number.');
    }
    return { basePrice, pricePerKg };
  },
  calculate: (config, ctx) => {
    let totalKg = 0;
    let anyWeighted = false;
    for (const item of ctx.items) {
      const kg = item.product.weightKg;
      if (typeof kg === 'number' && kg > 0) {
        totalKg += kg * item.quantity;
        anyWeighted = true;
      }
    }
    if (!anyWeighted) return null;
    return config.basePrice + totalKg * config.pricePerKg;
  },
  describe: (config, ctx) =>
    `${ctx.formatPrice(config.basePrice)} base + ${ctx.formatPrice(config.pricePerKg)} per kg`,
};
