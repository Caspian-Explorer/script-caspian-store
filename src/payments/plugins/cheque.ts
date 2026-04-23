import type { ChequeConfig, PaymentPlugin } from '../types';
import { startManualCheckout, validateManualConfig } from './manual-base';

export const CHEQUE_PLUGIN: PaymentPlugin<ChequeConfig> = {
  id: 'cheque',
  name: 'Cheque payments',
  description:
    "Accept payment by mailed cheque. The shopper checks out, sees where to send the cheque, and the order sits on-hold until you mark it paid in the admin.",
  defaultConfig: {
    instructions:
      'Please mail your cheque to the address below. We will ship your order once the cheque clears.',
    payableTo: '',
    postalAddress: '',
  },
  validateConfig: (raw) => {
    const base = validateManualConfig<ChequeConfig>(raw, 'Cheque');
    return {
      instructions: base.instructions,
      payableTo: typeof base.payableTo === 'string' ? base.payableTo.trim() : '',
      postalAddress: typeof base.postalAddress === 'string' ? base.postalAddress.trim() : '',
    };
  },
  startCheckout: (ctx, options) => startManualCheckout(ctx, options, 'cheque'),
};
