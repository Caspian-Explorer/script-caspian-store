/**
 * Returns a shallow copy of `obj` with `undefined`-valued keys omitted.
 *
 * Firestore's SDK rejects any document field whose value is `undefined`
 * (it accepts `null` or omitted keys, but not `undefined`). Service-layer
 * write functions that may receive optional/blank fields from forms route
 * their payloads through this helper before calling `addDoc`, `setDoc`, or
 * `updateDoc`.
 *
 * Preserves `null`, `false`, `0`, `''`, and empty arrays/objects — Firestore
 * accepts all of those.
 */
export function stripUndefined<T extends Record<string, unknown>>(
  obj: T,
): { [K in keyof T]: Exclude<T[K], undefined> } {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value !== undefined) out[key] = value;
  }
  return out as { [K in keyof T]: Exclude<T[K], undefined> };
}
