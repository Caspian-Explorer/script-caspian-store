/**
 * Provider-agnostic transactional email sender. The exported `send` function
 * takes a rendered message (`{ to, subject, html }`) and delivers it via
 * SendGrid by default. Swap the concrete implementation by replacing the
 * body of `sendViaSendGrid` with your provider (Resend, SES, Postmark, etc.)
 * — no callers depend on the details.
 *
 * Secrets are declared via `defineSecret('SENDGRID_API_KEY')` in
 * `functions-admin/src/index.ts` and bound to each function that sends.
 * See README / CHANGELOG for set-up.
 */

import sgMail from '@sendgrid/mail';
import { logger } from 'firebase-functions';

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

/**
 * Send a single transactional email. Falls back to logging + returning a
 * friendly error when the provider key is missing so local emulator runs
 * don't throw on every trigger.
 */
export async function send(
  message: SendableMessage,
  apiKey: string | undefined,
): Promise<SendResult> {
  if (!apiKey) {
    logger.warn(
      '[email-sender] SENDGRID_API_KEY not set — email to ' +
        JSON.stringify(message.to) +
        ' not sent.',
    );
    return { ok: false, error: 'Provider API key not configured.' };
  }
  return sendViaSendGrid(message, apiKey);
}

async function sendViaSendGrid(
  message: SendableMessage,
  apiKey: string,
): Promise<SendResult> {
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
    return { ok: false, error: detail ?? 'Unknown SendGrid error.' };
  }
}
