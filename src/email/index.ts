export {
  EMAIL_PLUGIN_IDS,
  type EmailPluginId,
  type EmailPlugin,
  type SendGridConfig,
  type BrevoConfig,
} from './types';
export type { EmailPluginInstall } from '../types';
export { EMAIL_PLUGIN_CATALOG, getEmailPlugin } from './catalog';
export { SENDGRID_PLUGIN } from './plugins/sendgrid';
export { BREVO_PLUGIN } from './plugins/brevo';
