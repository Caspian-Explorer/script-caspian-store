/**
 * Server-side counterpart of `src/services/error-log-service.ts`. Writes a
 * doc to `errorLogs/{auto}` via the Admin SDK (rules bypassed). Never
 * throws — a broken reporter must not mask the original error.
 *
 * Keep this file in lockstep with the peers in `functions-stripe/src/` and
 * `functions-email/src/` — same shape, different default origin prefix.
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

const CODEBASE = 'caspian-admin';
const MAX_MESSAGE = 2000;
const MAX_STACK = 4000;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const BEARER_RE = /Bearer\s+[A-Za-z0-9\-_.~+/=]+/g;
const FIREBASE_KEY_RE = /AIza[0-9A-Za-z_\-]{35}/g;
const QUERY_VALUE_RE = /([?&])([^=&\s]+)=([^&\s]+)/g;

function redact(input: string): string {
  return input
    .replace(EMAIL_RE, '[email]')
    .replace(BEARER_RE, 'Bearer [redacted]')
    .replace(FIREBASE_KEY_RE, '[firebase-api-key]')
    .replace(QUERY_VALUE_RE, '$1$2=[redacted]');
}

/**
 * Persist a Cloud Function failure to Firestore `errorLogs`. Pairs with the
 * existing `logger.error(...)` call at the site — this does NOT replace it.
 * Swallows its own errors; the function's real work must not be affected
 * by a Firestore write hiccup.
 */
export async function reportFunctionError(
  origin: string,
  err: unknown,
  context?: Record<string, string | number | boolean>,
): Promise<void> {
  try {
    let message: string;
    let stack: string | undefined;
    if (err instanceof Error) {
      message = err.message || err.name || 'Unknown error';
      stack = err.stack;
    } else if (typeof err === 'string') {
      message = err;
    } else {
      message = String(err);
    }
    const redactedMessage = redact(message).slice(0, MAX_MESSAGE);
    const redactedStack = stack ? redact(stack).slice(0, MAX_STACK) : undefined;

    const doc: Record<string, unknown> = {
      source: 'cloud-function',
      origin: `${CODEBASE}.${origin}`.slice(0, 200),
      message: redactedMessage,
      libraryVersion: 'functions',
      seenCount: 1,
      lastSeenAt: Timestamp.now(),
      timestamp: Timestamp.now(),
    };
    if (redactedStack) doc.stack = redactedStack;
    if (context) {
      const safeCtx: Record<string, string | number | boolean> = {};
      for (const [k, v] of Object.entries(context)) {
        if (typeof v === 'string') safeCtx[k] = redact(v).slice(0, 500);
        else safeCtx[k] = v;
      }
      doc.context = safeCtx;
    }
    if (process.env.GCLOUD_PROJECT) doc.firebaseProjectId = process.env.GCLOUD_PROJECT;
    await getFirestore().collection('errorLogs').add(doc);
  } catch (reporterErr) {
    logger.warn('[error-report] Failed to persist error log:', reporterErr);
  }
}
