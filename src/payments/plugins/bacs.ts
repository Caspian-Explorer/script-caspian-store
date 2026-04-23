import type { BacsConfig, PaymentPlugin } from '../types';
import { startManualCheckout, validateManualConfig } from './manual-base';

export const BACS_PLUGIN: PaymentPlugin<BacsConfig> = {
  id: 'bacs',
  name: 'Direct bank transfer (BACS)',
  description:
    "Accept payment by bank transfer. The shopper checks out, sees your bank details, and the order sits on-hold until you mark it paid in the admin. No Cloud Function or card processor required.",
  defaultConfig: {
    instructions:
      'Please transfer the total amount to the account below. We will ship your order once payment is confirmed.',
    accountName: '',
    accountNumber: '',
    sortCode: '',
    iban: '',
    swift: '',
  },
  validateConfig: (raw) => {
    const base = validateManualConfig<BacsConfig>(raw, 'BACS');
    const accountName = typeof base.accountName === 'string' ? base.accountName.trim() : '';
    const accountNumber = typeof base.accountNumber === 'string' ? base.accountNumber.trim() : '';
    if (!accountName) throw new Error('BACS requires an account name shoppers can pay into.');
    if (!accountNumber && !(base.iban && String(base.iban).trim())) {
      throw new Error('BACS requires either an account number or an IBAN.');
    }
    return {
      instructions: base.instructions,
      accountName,
      accountNumber,
      sortCode: typeof base.sortCode === 'string' ? base.sortCode.trim() : '',
      iban: typeof base.iban === 'string' ? base.iban.trim() : '',
      swift: typeof base.swift === 'string' ? base.swift.trim() : '',
    };
  },
  startCheckout: (ctx, options) => startManualCheckout(ctx, options, 'bacs'),
};
