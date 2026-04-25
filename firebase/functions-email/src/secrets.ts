/**
 * Cloud Secret Manager declarations for the email-sending Cloud Functions.
 *
 * v8.0.0 moves provider API keys out of Firestore (`emailPluginInstalls.config.apiKey`,
 * the v2.14–v7.x storage path) and into Google Secret Manager. The secret
 * NAMES are well-known per provider — the dispatcher in `email-sender.ts`
 * picks the right one based on the active install's `pluginId`. Adding a new
 * provider means adding a `defineSecret` here AND a branch in the
 * `EMAIL_PROVIDERS` map in `email-sender.ts`.
 *
 * Each trigger that may eventually call `send()` MUST attach both secrets to
 * its options (`secrets: [SENDGRID_API_KEY, BREVO_API_KEY]`). Without that,
 * `secret.value()` returns an empty string at runtime even when the secret
 * is set on the project. This is the trade-off that comes with declaring
 * deps statically — Firebase enforces that the function instance has IAM
 * to read each secret it touches.
 *
 * Consumers run, once per project per provider:
 *   firebase functions:secrets:set CASPIAN_EMAIL_SENDGRID_API_KEY
 *   firebase functions:secrets:set CASPIAN_EMAIL_BREVO_API_KEY
 *
 * Then `firebase deploy --only functions:caspian-email`. If a secret is
 * referenced by a function but does not exist on the project, deploy fails
 * fast with a clear error — that's the desired UX (not silent breakage).
 */

import { defineSecret } from 'firebase-functions/params';

export const SENDGRID_API_KEY = defineSecret('CASPIAN_EMAIL_SENDGRID_API_KEY');
export const BREVO_API_KEY = defineSecret('CASPIAN_EMAIL_BREVO_API_KEY');

/** Every email-emitting function must attach this exact list. */
export const EMAIL_SECRETS = [SENDGRID_API_KEY, BREVO_API_KEY];
