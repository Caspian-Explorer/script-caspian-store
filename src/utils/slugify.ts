/**
 * Convert a free-text string into a URL-safe slug.
 *
 * Used for product URLs, collection URLs, and category URLs. Lowercases,
 * collapses non-alphanumeric runs into single hyphens, trims leading/trailing
 * hyphens, and caps the length so a 500-character product name doesn't yield a
 * 500-character URL.
 */
export function slugify(input: string, maxLen = 80): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, maxLen)
    .replace(/-$/, '');
}
