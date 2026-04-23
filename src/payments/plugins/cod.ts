import type { CodConfig, PaymentPlugin } from '../types';
import { startManualCheckout, validateManualConfig } from './manual-base';

export const COD_PLUGIN: PaymentPlugin<CodConfig> = {
  id: 'cod',
  name: 'Cash on delivery',
  description:
    "Accept payment in cash when the shopper receives their order. The order is created with status on-hold; your courier collects the cash on drop-off and you mark it paid in the admin.",
  defaultConfig: {
    instructions:
      'Pay with cash when you receive your order. Please have the exact amount ready if possible.',
    enabledForShippingMethods: [],
  },
  validateConfig: (raw) => {
    const base = validateManualConfig<CodConfig>(raw, 'Cash on delivery');
    // The admin UI stores the allowlist as a comma-separated string (single
    // `<Input>`); Firestore round-trips may also hand us a pre-split array.
    // Handle both so callers don't have to pre-format.
    const rawList = base.enabledForShippingMethods as unknown;
    const allowList = (
      Array.isArray(rawList)
        ? rawList
        : typeof rawList === 'string'
          ? rawList.split(',')
          : []
    )
      .map((s) => (typeof s === 'string' ? s.trim() : ''))
      .filter((s) => s.length > 0);
    return {
      instructions: base.instructions,
      enabledForShippingMethods: allowList.length ? allowList : undefined,
    };
  },
  startCheckout: (ctx, options) => startManualCheckout(ctx, options, 'cod'),
};
