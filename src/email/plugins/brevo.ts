import type { BrevoConfig, EmailPlugin } from '../types';

export const BREVO_PLUGIN: EmailPlugin<BrevoConfig> = {
  id: 'brevo',
  name: 'Brevo',
  description:
    'Send transactional email via Brevo (formerly Sendinblue). The API key is read from Google Secret Manager at runtime — generate it at brevo.com → SMTP & API → API Keys.',
  defaultConfig: {},
  validateConfig: () => ({}),
  secretName: 'CASPIAN_EMAIL_BREVO_API_KEY',
};
