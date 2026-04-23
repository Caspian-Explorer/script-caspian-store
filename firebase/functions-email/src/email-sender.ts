/**
 * Transactional-email dispatcher. Reads the first enabled install from the
 * `emailPluginInstalls` Firestore collection, resolves the matching provider,
 * and delivers the message. Added in v2.14 — replaces the v2.11 pattern of
 * one hard-coded SendGrid provider behind a Functions secret.
 *
 * No `defineSecret` calls live here. The provider API key is stored in the
 * install's `config.apiKey` (admin-only read via `isAdmin()` in
 * firestore.rules). Cloud Functions read via the Admin SDK, which bypasses
 * rules. This restores the zero-secrets invariant for the email codebase:
 * `firebase deploy --only functions:caspian-email` works immediately, even
 * before any provider is configured — the function is just dormant until an
 * admin installs one at /admin/email-plugins.
 *
 * Supported providers in v2.14: SendGrid, Brevo. New providers land by PR
 * adding a branch to `EMAIL_PROVIDERS` below plus a matching catalog entry
 * in `src/email/plugins/` on the library side (so the admin UI can offer
 * them for install).
 */

import sgMail from '@sendgrid/mail';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { reportFunctionError } from './error-report';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const BrevoSDK = require('@getbrevo/brevo') as typeof import('@getbrevo/brevo');

export interface SendableMessage {
  to: string | string[];
  from: { email: string; name?: string };
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

interface EmailPluginInstallDoc {
  pluginId: string;
  enabled: boolean;
  order: number;
  config: Record<string, unknown>;
}

type ProviderSendFn = (
  config: Record<string, unknown>,
  message: SendableMessage,
) => Promise<SendResult>;

const EMAIL_PROVIDERS: Record<string, ProviderSendFn> = {
  sendgrid: sendViaSendGrid,
  brevo: sendViaBrevo,
};

/**
 * Send a transactional email via whichever provider the merchant has
 * configured. Returns a failed `SendResult` (never throws) on provider errors
 * so caller triggers don't crash the whole event handler on provider outages.
 */
export async function send(message: SendableMessage): Promise<SendResult> {
  const install = await loadActiveInstall();
  if (!install) {
    logger.warn(
      '[email-sender] No enabled emailPluginInstalls doc — email to ' +
        JSON.stringify(message.to) +
        ' not sent. Install a provider at /admin/email-plugins.',
    );
    return { ok: false, error: 'No email provider is configured.' };
  }
  const provider = EMAIL_PROVIDERS[install.pluginId];
  if (!provider) {
    logger.error(`[email-sender] Unknown email pluginId "${install.pluginId}".`);
    void reportFunctionError('email-sender.unknownPluginId', new Error(`Unknown pluginId ${install.pluginId}`), {
      pluginId: install.pluginId,
    });
    return { ok: false, error: `Unknown email provider "${install.pluginId}".` };
  }
  return provider(install.config, message);
}

async function loadActiveInstall(): Promise<EmailPluginInstallDoc | null> {
  const db = getFirestore();
  const snap = await db
    .collection('emailPluginInstalls')
    .where('enabled', '==', true)
    .orderBy('order', 'asc')
    .limit(1)
    .get();
  if (snap.empty) return null;
  const data = snap.docs[0].data();
  return {
    pluginId: String(data.pluginId ?? ''),
    enabled: Boolean(data.enabled),
    order: Number(data.order ?? 0),
    config: (data.config ?? {}) as Record<string, unknown>,
  };
}

async function sendViaSendGrid(
  config: Record<string, unknown>,
  message: SendableMessage,
): Promise<SendResult> {
  const apiKey = typeof config.apiKey === 'string' ? config.apiKey.trim() : '';
  if (!apiKey) {
    logger.warn('[email-sender] SendGrid install has no apiKey — not sending.');
    return { ok: false, error: 'SendGrid API key not configured.' };
  }
  sgMail.setApiKey(apiKey);
  try {
    await sgMail.send({
      to: message.to,
      from: message.from,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    return { ok: true };
  } catch (error) {
    const err = error as { message?: string; response?: { body?: unknown } };
    const detail = err.response?.body ? JSON.stringify(err.response.body) : err.message;
    logger.error(`[email-sender] SendGrid error: ${detail}`);
    void reportFunctionError('email-sender.sendGrid', error);
    return { ok: false, error: detail ?? 'Unknown SendGrid error.' };
  }
}

async function sendViaBrevo(
  config: Record<string, unknown>,
  message: SendableMessage,
): Promise<SendResult> {
  const apiKey = typeof config.apiKey === 'string' ? config.apiKey.trim() : '';
  if (!apiKey) {
    logger.warn('[email-sender] Brevo install has no apiKey — not sending.');
    return { ok: false, error: 'Brevo API key not configured.' };
  }
  try {
    const apiInstance = new BrevoSDK.TransactionalEmailsApi();
    apiInstance.setApiKey(BrevoSDK.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    const payload = new BrevoSDK.SendSmtpEmail();
    payload.subject = message.subject;
    payload.htmlContent = message.html;
    payload.textContent = message.text;
    payload.sender = { email: message.from.email, name: message.from.name };
    payload.to = (Array.isArray(message.to) ? message.to : [message.to]).map((email) => ({ email }));
    if (message.replyTo) payload.replyTo = { email: message.replyTo };

    await apiInstance.sendTransacEmail(payload);
    return { ok: true };
  } catch (error) {
    const err = error as {
      message?: string;
      body?: unknown;
      response?: { body?: unknown };
    };
    const detail = err.response?.body
      ? JSON.stringify(err.response.body)
      : err.body
        ? JSON.stringify(err.body)
        : err.message;
    logger.error(`[email-sender] Brevo error: ${detail}`);
    void reportFunctionError('email-sender.brevo', error);
    return { ok: false, error: detail ?? 'Unknown Brevo error.' };
  }
}
