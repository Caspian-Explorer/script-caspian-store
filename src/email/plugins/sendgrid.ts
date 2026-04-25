import type { EmailPlugin, SendGridConfig } from '../types';

export const SENDGRID_PLUGIN: EmailPlugin<SendGridConfig> = {
  id: 'sendgrid',
  name: 'SendGrid',
  description:
    'Send transactional email via SendGrid. The API key is read from Google Secret Manager at runtime — generate it at sendgrid.com → Settings → API Keys.',
  defaultConfig: {},
  validateConfig: () => ({}),
  secretName: 'CASPIAN_EMAIL_SENDGRID_API_KEY',
};
