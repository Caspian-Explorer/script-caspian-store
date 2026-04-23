'use client';

import { useMemo } from 'react';
import { cn } from '../utils/cn';
import { sanitizeRichHtml } from './rich-text-editor';

export interface HtmlContentProps {
  /** HTML authored via `<RichTextEditor>`. Sanitized before render. */
  html: string | undefined | null;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders sanitized HTML authored via `<RichTextEditor>`. Runs the same
 * allowlist sanitizer a second time at render so any Firestore-stored HTML
 * that was produced by an older editor (or written directly) is clamped to
 * the same safe subset before hitting the DOM.
 */
export function HtmlContent({ html, className, style }: HtmlContentProps) {
  const safe = useMemo(() => (html ? sanitizeRichHtml(html) : ''), [html]);
  if (!safe) return null;
  return (
    <div
      className={cn('caspian-html-content', className)}
      style={style}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
