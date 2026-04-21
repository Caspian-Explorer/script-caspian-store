import type { ReactNode } from 'react';

const ICONS: Record<string, ReactNode> = {
  instagram: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H8v-2.9h2.4V9.5c0-2.4 1.4-3.7 3.6-3.7 1 0 2.1.2 2.1.2v2.3h-1.2c-1.2 0-1.5.7-1.5 1.5V12h2.6l-.4 2.9h-2.2v7A10 10 0 0 0 22 12z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M22.5 5.6a8.4 8.4 0 0 1-2.4.7 4.1 4.1 0 0 0 1.8-2.3c-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.6 11.6 0 0 1 1.7 4.4 4.1 4.1 0 0 0 3 9.9a4 4 0 0 1-1.8-.5v.1a4.1 4.1 0 0 0 3.3 4 4 4 0 0 1-1.8 0 4.1 4.1 0 0 0 3.8 2.9 8.2 8.2 0 0 1-6 1.7 11.6 11.6 0 0 0 6.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5a8.3 8.3 0 0 0 2-2.1z" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M17.5 2H21l-7.6 8.7L22 22h-7l-5-6.6L4 22H1l8.2-9.4L1 2h7l4.6 6.1L17.5 2z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.6 4 12 4 12 4s-7.6 0-9.4.4A3 3 0 0 0 .5 6.5C.1 8.4.1 12 .1 12s0 3.6.4 5.5a3 3 0 0 0 2.1 2.1C4.4 20 12 20 12 20s7.6 0 9.4-.4a3 3 0 0 0 2.1-2.1c.4-1.9.4-5.5.4-5.5s0-3.6-.4-5.5zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M19.6 6.7a5 5 0 0 1-3.4-1.5V15a5.7 5.7 0 1 1-5.7-5.7v3a2.8 2.8 0 1 0 2 2.7V2h2.9a5 5 0 0 0 4.2 4.4v.3z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3V9.5zm6 0h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4.1 0 4.9 2.7 4.9 6.2V21h-4V16c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3v5.2H9V9.5z" />
    </svg>
  ),
  pinterest: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.5 1.9-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.3-.9 3.6-.2 1 .5 1.9 1.6 1.9 1.9 0 3.3-2 3.3-4.9 0-2.6-1.9-4.4-4.5-4.4a4.7 4.7 0 0 0-4.9 4.7c0 .9.4 1.9.8 2.5l.1.4-.3 1.1c0 .2-.2.2-.4.1-1.3-.6-2.1-2.6-2.1-4.1 0-3.4 2.4-6.5 7-6.5 3.7 0 6.5 2.6 6.5 6.1 0 3.7-2.3 6.6-5.5 6.6a3 3 0 0 1-2.5-1.3l-.7 2.6c-.2.9-.9 2.1-1.4 2.8A10 10 0 1 0 12 2z" />
    </svg>
  ),
};

const FALLBACK = (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M2 12h20M12 2c2.5 3 4 6 4 10s-1.5 7-4 10c-2.5-3-4-6-4-10s1.5-7 4-10z" />
  </svg>
);

export function SocialIcon({ platform }: { platform: string }) {
  return <>{ICONS[platform.toLowerCase()] ?? FALLBACK}</>;
}
