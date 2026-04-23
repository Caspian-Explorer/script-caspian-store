import { STRIPE_PLUGIN } from './plugins/stripe';
import { BACS_PLUGIN } from './plugins/bacs';
import { CHEQUE_PLUGIN } from './plugins/cheque';
import { COD_PLUGIN } from './plugins/cod';
import type { PaymentPlugin, PaymentPluginId } from './types';

export const PAYMENT_PLUGIN_CATALOG: Record<PaymentPluginId, PaymentPlugin> = {
  stripe: STRIPE_PLUGIN as unknown as PaymentPlugin,
  bacs: BACS_PLUGIN as unknown as PaymentPlugin,
  cheque: CHEQUE_PLUGIN as unknown as PaymentPlugin,
  cod: COD_PLUGIN as unknown as PaymentPlugin,
};

export function getPaymentPlugin(id: string): PaymentPlugin | null {
  return (PAYMENT_PLUGIN_CATALOG as Record<string, PaymentPlugin>)[id] ?? null;
}
