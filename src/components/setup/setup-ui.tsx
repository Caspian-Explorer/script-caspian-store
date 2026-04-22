'use client';

import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react';

/**
 * Small field + button primitives local to the setup wizard. We deliberately
 * avoid the shared `<Input>`/`<Button>` primitives here so the wizard keeps
 * its distinct, mockup-faithful look (larger inputs, navy CTA) without
 * diverging those shared components for everyone else.
 */

export interface SetupFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: string;
}

export function SetupField({ label, error, hint, id, ...rest }: SetupFieldProps) {
  const fieldId = id ?? `setup-field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div style={fieldWrap}>
      <div style={fieldLabelRow}>
        <label htmlFor={fieldId} style={fieldLabel}>
          {label}
        </label>
        {error && <span style={fieldError}>{error}</span>}
      </div>
      <input
        id={fieldId}
        style={{ ...fieldInput, ...(error ? fieldInputError : null) }}
        {...rest}
      />
      {hint && !error && <p style={fieldHint}>{hint}</p>}
    </div>
  );
}

export interface SetupButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
  type?: 'button' | 'submit';
}

export function SetupButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  type = 'button',
}: SetupButtonProps) {
  const style = variant === 'primary' ? primaryButton : ghostButton;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseButton, ...style, ...(disabled ? disabledButton : null) }}
    >
      {children}
    </button>
  );
}

const fieldWrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  marginBottom: 16,
};

const fieldLabelRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: 6,
};

const fieldLabel: CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: '#022959',
};

const fieldError: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#DF4747',
};

const fieldHint: CSSProperties = {
  fontSize: 12,
  color: '#6A7A8A',
  margin: '6px 0 0 0',
};

const fieldInput: CSSProperties = {
  height: 44,
  padding: '0 14px',
  border: '1px solid #D6D9E6',
  borderRadius: 8,
  fontSize: 15,
  color: '#022959',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 140ms ease',
};

const fieldInputError: CSSProperties = {
  borderColor: '#DF4747',
};

const baseButton: CSSProperties = {
  height: 44,
  padding: '0 22px',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  border: 'none',
  transition: 'background-color 140ms ease, opacity 140ms ease',
};

const primaryButton: CSSProperties = {
  background: '#022959',
  color: '#FFFFFF',
};

const ghostButton: CSSProperties = {
  background: 'transparent',
  color: '#6A7A8A',
  fontWeight: 500,
  padding: '0 4px',
};

const disabledButton: CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
};
