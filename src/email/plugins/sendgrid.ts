import type { EmailPlugin, SendGridConfig } from '../types';

export const SENDGRID_PLUGIN: EmailPlugin<SendGridConfig> = {
  id: 'sendgrid',
  name: 'SendGrid',
  description: 'Send transactional email via SendGrid (@sendgrid/mail v8+).',
  defaultConfig: { apiKey: '' },
  validateConfig: (config) => {
    const c = (config ?? {}) as Partial<SendGridConfig>;
    const apiKey = typeof c.apiKey === 'string' ? c.apiKey.trim() : '';
    if (!apiKey) {
      throw new Error('SendGrid API key is required. Generate one at sendgrid.com → Settings → API Keys.');
    }
    if (!apiKey.startsWith('SG.')) {
      throw new Error('SendGrid API keys start with "SG." — double-check the value.');
    }
    return { apiKey };
  },
};
