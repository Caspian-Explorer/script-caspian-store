import type { BrevoConfig, EmailPlugin } from '../types';

export const BREVO_PLUGIN: EmailPlugin<BrevoConfig> = {
  id: 'brevo',
  name: 'Brevo',
  description: 'Send transactional email via Brevo (formerly Sendinblue). Uses the @getbrevo/brevo SDK.',
  defaultConfig: { apiKey: '' },
  validateConfig: (config) => {
    const c = (config ?? {}) as Partial<BrevoConfig>;
    const apiKey = typeof c.apiKey === 'string' ? c.apiKey.trim() : '';
    if (!apiKey) {
      throw new Error('Brevo API key is required. Generate one at brevo.com → SMTP & API → API Keys.');
    }
    if (!apiKey.startsWith('xkeysib-')) {
      throw new Error('Brevo API keys start with "xkeysib-" — double-check the value.');
    }
    return { apiKey };
  },
};
