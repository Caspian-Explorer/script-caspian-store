/**
 * Email-provider plugin contract. Mirrors src/shipping/types.ts and
 * src/payments/types.ts in shape: a metadata object keyed by plugin id that
 * the admin UI can browse and the Cloud Function runtime can resolve against
 * a per-store install.
 *
 * Unlike shipping + payments, the actual `send(message)` implementation
 * lives server-side in firebase/functions-email/src/providers/* — the library
 * only exports the metadata + config validator, because delivery happens from
 * Cloud Functions where the API key (loaded from Cloud Secret Manager) never
 * touches the browser.
 *
 * v8.0.0: API keys moved to Google Secret Manager (`firebase functions:secrets:set`).
 * Plugin config is now empty by default — the install record exists only to
 * tell the dispatcher *which* provider to use. The actual credentials live
 * in well-known secrets named `CASPIAN_EMAIL_<PROVIDER>_API_KEY`.
 */

export type EmailPluginId = 'sendgrid' | 'brevo';

export const EMAIL_PLUGIN_IDS: readonly EmailPluginId[] = ['sendgrid', 'brevo'] as const;

export interface EmailPlugin<C = Record<string, unknown>> {
  id: EmailPluginId;
  /** Brand name shown in admin UI. Plain string (brand names don't translate). */
  name: string;
  /** One-line description shown in the admin catalog browse dialog. */
  description: string;
  /** Default config rendered into the install dialog. */
  defaultConfig: C;
  /** Parse raw Firestore config into the plugin's typed shape. Throws with a user-facing message on invalid input. */
  validateConfig: (config: unknown) => C;
  /** Cloud Secret Manager name where the merchant's API key must be set. */
  secretName: string;
}

export type SendGridConfig = Record<string, never>;
export type BrevoConfig = Record<string, never>;

// `EmailPluginInstall` is defined in src/types.ts alongside ShippingPluginInstall
// and PaymentPluginInstall to keep all cross-cutting Firestore document types
// in one place (project convention per CLAUDE.md → "Add new cross-module types
// [in src/types.ts], not per-module files").
