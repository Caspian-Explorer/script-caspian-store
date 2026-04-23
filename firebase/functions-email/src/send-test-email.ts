/**
 * Callable Cloud Function invoked by the admin emails page's "Send test"
 * button. Renders the chosen template with sample placeholders and delivers
 * it via the configured provider. Only admins can invoke.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { send } from './email-sender';
import { renderEmail, type EmailSettingsFields, type RenderContext } from './email-renderer';

interface Payload {
  key?: string;
  to?: string;
}

export const sendTestEmail = onCall(
  {},
  async (req) => {
    const uid = req.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Sign in required.');

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Admin role required.');
    }

    const { key, to } = (req.data ?? {}) as Payload;
    if (!key || typeof key !== 'string') {
      return { ok: false as const, error: 'Missing template key.' };
    }
    if (!to || typeof to !== 'string' || !to.includes('@')) {
      return { ok: false as const, error: 'Valid recipient required.' };
    }

    const [settingsSnap, templateSnap, siteSnap] = await Promise.all([
      db.collection('emailSettings').doc('site').get(),
      db.collection('emailTemplates').doc(key).get(),
      db.collection('settings').doc('site').get(),
    ]);

    if (!settingsSnap.exists) {
      return { ok: false as const, error: 'Configure global sender settings first.' };
    }
    const settings = settingsSnap.data() as EmailSettingsFields;
    if (!settings.fromAddress) {
      return { ok: false as const, error: 'From address is required in global settings.' };
    }

    const template = templateSnap.exists
      ? (templateSnap.data() as { subject: string; heading: string; additionalContent: string })
      : null;
    if (!template) {
      return {
        ok: false as const,
        error: `Template "${key}" has not been saved yet — open it and click Save first.`,
      };
    }

    const siteBrand = siteSnap.exists ? String(siteSnap.data()?.brandName ?? '') : '';
    const ctx: RenderContext = {
      siteTitle: settings.fromName || siteBrand || 'Store',
      orderNumber: 'TEST-' + Date.now(),
      orderTotal: '$99.00',
      orderDate: new Date().toLocaleDateString(),
      customerName: 'Alex Shopper',
      customerEmail: to,
    };

    const rendered = renderEmail(template, settings, ctx);
    const result = await send({
      to,
      from: { email: settings.fromAddress, name: settings.fromName },
      replyTo: settings.replyTo || undefined,
      subject: `[TEST] ${rendered.subject}`,
      html: rendered.html,
      text: rendered.text,
    });

    return result.ok
      ? ({ ok: true as const })
      : ({ ok: false as const, error: result.error ?? 'Unknown send error.' });
  },
);
