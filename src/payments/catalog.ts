import { STRIPE_PLUGIN } from './plugins/stripe';
import type { PaymentPlugin, PaymentPluginId } from './types';

export const PAYMENT_PLUGIN_CATALOG: Record<PaymentPluginId, PaymentPlugin> = {
  stripe: STRIPE_PLUGIN as unknown as PaymentPlugin,
};

export function getPaymentPlugin(id: string): PaymentPlugin | null {
  return (PAYMENT_PLUGIN_CATALOG as Record<string, PaymentPlugin>)[id] ?? null;
}
