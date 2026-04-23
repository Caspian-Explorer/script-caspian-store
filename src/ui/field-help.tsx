'use client';

import { useId, useState, type ReactNode } from 'react';
import { HelpIcon } from './icons';

export interface FieldHelpProps {
  children: ReactNode;
  /** Optional ARIA label on the icon trigger. Defaults to "Help". */
  label?: string;
  /** Tooltip maximum width in pixels. Default 260. */
  maxWidth?: number;
}

/**
 * Inline `?` tooltip icon used next to a field label to surface a short
 * explanation on hover/focus. Hover + keyboard-focus both open the popover;
 * it auto-closes on mouse leave and blur. No JS-positioning — the popover
 * renders below-left of the icon with a fixed offset.
 */
export function FieldHelp({ children, label = 'Help', maxWidth = 260 }: FieldHelpProps) {
  const [open, setOpen] = useState(false);
  const popoverId = useId();

  return (
    <span
      style={{ display: 'inline-block', position: 'relative', verticalAlign: 'middle', marginLeft: 6 }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? popoverId : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16,
          padding: 0,
          border: 0,
          background: 'transparent',
          color: '#888',
          cursor: 'help',
        }}
      >
        <HelpIcon size={14} />
      </button>
      {open && (
        <span
          id={popoverId}
          role="tooltip"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: -8,
            zIndex: 50,
            maxWidth,
            minWidth: 180,
            padding: '8px 10px',
            background: '#111',
            color: '#fff',
            fontSize: 12,
            lineHeight: 1.45,
            borderRadius: 6,
            boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
            whiteSpace: 'normal',
            fontWeight: 400,
          }}
        >
          {children}
        </span>
      )}
    </span>
  );
}
