import type { FreeOverThresholdConfig, ShippingPlugin } from '../types';

export const FREE_OVER_THRESHOLD_PLUGIN: ShippingPlugin<FreeOverThresholdConfig> = {
  id: 'free-over-threshold',
  name: 'Free Over Threshold',
  description: 'Free shipping on orders above a subtotal threshold; a fallback rate otherwise.',
  defaultConfig: { threshold: 50, fallbackPrice: 5 },
  validateConfig: (config) => {
    const c = (config ?? {}) as Partial<FreeOverThresholdConfig>;
    const threshold = Number(c.threshold);
    const fallbackPrice = Number(c.fallbackPrice);
    if (!Number.isFinite(threshold) || threshold < 0) {
      throw new Error('Threshold must be a non-negative number.');
    }
    if (!Number.isFinite(fallbackPrice) || fallbackPrice < 0) {
      throw new Error('Fallback price must be a non-negative number.');
    }
    return { threshold, fallbackPrice };
  },
  calculate: (config, ctx) =>
    ctx.subtotal >= config.threshold ? 0 : config.fallbackPrice,
  describe: (config, ctx) =>
    `Free over ${ctx.formatPrice(config.threshold)}, otherwise ${ctx.formatPrice(config.fallbackPrice)}`,
};
