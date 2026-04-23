import { BREVO_PLUGIN } from './plugins/brevo';
import { SENDGRID_PLUGIN } from './plugins/sendgrid';
import type { EmailPlugin, EmailPluginId } from './types';

export const EMAIL_PLUGIN_CATALOG: Record<EmailPluginId, EmailPlugin> = {
  sendgrid: SENDGRID_PLUGIN as unknown as EmailPlugin,
  brevo: BREVO_PLUGIN as unknown as EmailPlugin,
};

export function getEmailPlugin(id: string): EmailPlugin | null {
  return (EMAIL_PLUGIN_CATALOG as Record<string, EmailPlugin>)[id] ?? null;
}
