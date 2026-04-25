/**
 * Transactional-email dispatcher. Reads the first enabled install from the
 * `emailPluginInstalls` Firestore collection, resolves the matching provider,
 * and delivers the message via Google Secret Manager–backed credentials.
 *
 * v8.0.0 architecture:
 *   - Firestore (`emailPluginInstalls`) tells us *which* provider is active
 *     (sendgrid vs brevo) and stores merchant-display metadata (name,
 *     order, enabled flag). It does NOT hold API keys.
 *   - Google Cloud Secret Manager holds the API keys. Each provider's key
 *     lives at a well-known name declared in `secrets.ts`. Consumers set
 *     the value once per project via `firebase functions:secrets:set`.
 *   - The dispatcher resolves install → secret name → secret value at
 *     runtime. No secret value ever transits Firestore.
 *
 * Migration from the v2.14–v7.x model (apiKey-in-config) is documented in
 * the v8.0.0 CHANGELOG entry. The `config.apiKey` field is no longer read.
 *
 * Supported providers in v8.0.0: SendGrid, Brevo. New providers land by PR
 * adding (a) a `defineSecret` to `secrets.ts`, (b) a branch in
 * `EMAIL_PROVIDERS` below, (c) a matching catalog entry in
 * `src/email/plugins/` on the library side (so the admin UI can offer them).
 */

import sgMail from '@sendgrid/mail';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { reportFunctionError } from './error-report';
import { BREVO_API_KEY, SENDGRID_API_KEY } from './secrets';
import { BrevoClient } from '@getbrevo/brevo';

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
        ' not sent. Install a provider at /admin/plugins/email-providers.',
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
  return provider(message);
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
  message: SendableMessage,
): Promise<SendResult> {
  const apiKey = SENDGRID_API_KEY.value().trim();
  if (!apiKey) {
    logger.warn(
      '[email-sender] SendGrid secret CASPIAN_EMAIL_SENDGRID_API_KEY is empty — not sending. ' +
        'Run `firebase functions:secrets:set CASPIAN_EMAIL_SENDGRID_API_KEY` then redeploy caspian-email.',
    );
    return { ok: false, error: 'SendGrid API key not configured in Secret Manager.' };
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
  message: SendableMessage,
): Promise<SendResult> {
  const apiKey = BREVO_API_KEY.value().trim();
  if (!apiKey) {
    logger.warn(
      '[email-sender] Brevo secret CASPIAN_EMAIL_BREVO_API_KEY is empty — not sending. ' +
        'Run `firebase functions:secrets:set CASPIAN_EMAIL_BREVO_API_KEY` then redeploy caspian-email.',
    );
    return { ok: false, error: 'Brevo API key not configured in Secret Manager.' };
  }
  try {
    const client = new BrevoClient({ apiKey });
    const recipients = (Array.isArray(message.to) ? message.to : [message.to]).map(
      (email) => ({ email }),
    );
    await client.transactionalEmails.sendTransacEmail({
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text,
      sender: { email: message.from.email, name: message.from.name },
      to: recipients,
      replyTo: message.replyTo ? { email: message.replyTo } : undefined,
    });
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
