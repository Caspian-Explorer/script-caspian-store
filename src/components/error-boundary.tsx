'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import type { Firestore } from 'firebase/firestore';
import { logError } from '../services/error-log-service';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * Firestore handle used to persist the caught error. Omit to disable
   * logging and fall back to `console.error` only — useful in tests or when
   * the boundary is mounted outside a `CaspianStoreProvider`.
   */
  db?: Firestore;
  /**
   * Stable identifier persisted as the error's `origin`. Defaults to
   * `ErrorBoundary`. Pass a per-screen name (e.g. `AdminDashboardBoundary`)
   * if you mount multiple boundaries.
   */
  origin?: string;
  /**
   * Rendered in place of `children` after a catch. Receives the caught
   * error and a `reset` callback that clears the boundary state and
   * re-renders the subtree. Defaults to a minimal English notice.
   */
  fallback?: (err: Error, reset: () => void) => ReactNode;
  /** Fired on every catch in addition to persistence. */
  onError?: (err: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  err: Error | null;
}

/**
 * Class-based error boundary — React's only mechanism for capturing render
 * errors. Falls back to `fallback` or a minimal notice on crash, and
 * persists the error via `logError(db, …)` when a Firestore handle is
 * provided. Added for mod1182.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { err: null };

  static getDerivedStateFromError(err: Error): ErrorBoundaryState {
    return { err };
  }

  componentDidCatch(err: Error, info: ErrorInfo): void {
    const origin = this.props.origin ?? 'ErrorBoundary';
    this.props.onError?.(err, info);
    if (this.props.db) {
      void logError(this.props.db, {
        source: 'client',
        origin,
        error: err,
        context: info.componentStack ? { componentStack: info.componentStack.slice(0, 500) } : undefined,
      });
    } else {
      // eslint-disable-next-line no-console
      console.error(`[caspian-store] ${origin}:`, err);
    }
  }

  reset = (): void => {
    this.setState({ err: null });
  };

  render(): ReactNode {
    if (this.state.err) {
      if (this.props.fallback) return this.props.fallback(this.state.err, this.reset);
      return (
        <div role="alert" style={{ padding: '1rem', fontFamily: 'system-ui, sans-serif' }}>
          <strong>Something went wrong.</strong>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', opacity: 0.75 }}>
            The error has been logged. Try again or refresh the page.
          </p>
          <button
            type="button"
            onClick={this.reset}
            style={{
              marginTop: '0.5rem',
              padding: '0.375rem 0.75rem',
              border: '1px solid currentColor',
              borderRadius: '0.25rem',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
