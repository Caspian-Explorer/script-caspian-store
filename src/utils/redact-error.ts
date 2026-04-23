/**
 * Redact personally-identifiable and credential-shaped strings from error
 * messages and stack traces before they are persisted to Firestore or
 * pre-filled into a public GitHub issue URL. Added for mod1182.
 *
 * Patterns, in the order they are applied:
 *   - email addresses         → `[email]`
 *   - `Bearer <token>`        → `Bearer [redacted]`
 *   - Firebase Web API keys   → `[firebase-api-key]`   (matches `AIza...`)
 *   - Query-string values     → `?key=[redacted]&...`  (preserves keys)
 *
 * Pure helper: no deps, no I/O, safe to call on the hot path.
 */

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const BEARER_RE = /Bearer\s+[A-Za-z0-9\-_.~+/=]+/g;
const FIREBASE_KEY_RE = /AIza[0-9A-Za-z_\-]{35}/g;
const QUERY_VALUE_RE = /([?&])([^=&\s]+)=([^&\s]+)/g;

export const MAX_STACK_LENGTH = 4000;
export const MAX_MESSAGE_LENGTH = 2000;

export function redactString(input: string): string {
  return input
    .replace(EMAIL_RE, '[email]')
    .replace(BEARER_RE, 'Bearer [redacted]')
    .replace(FIREBASE_KEY_RE, '[firebase-api-key]')
    .replace(QUERY_VALUE_RE, '$1$2=[redacted]');
}

/**
 * Normalize an unknown thrown value into a `{ message, stack }` pair with
 * redaction and length caps applied. Accepts `Error` instances, strings,
 * and plain objects — anything else is coerced via `String(err)`.
 */
export function redactError(err: unknown): { message: string; stack?: string } {
  let rawMessage: string;
  let rawStack: string | undefined;

  if (err instanceof Error) {
    rawMessage = err.message || err.name || 'Unknown error';
    rawStack = err.stack;
  } else if (typeof err === 'string') {
    rawMessage = err;
  } else if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    rawMessage = (err as { message: string }).message;
    const maybeStack = (err as { stack?: unknown }).stack;
    if (typeof maybeStack === 'string') rawStack = maybeStack;
  } else {
    rawMessage = String(err);
  }

  const message = redactString(rawMessage).slice(0, MAX_MESSAGE_LENGTH);
  const stack = rawStack ? redactString(rawStack).slice(0, MAX_STACK_LENGTH) : undefined;
  return { message, stack };
}
