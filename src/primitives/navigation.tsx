import type { CaspianNavigation, UseCaspianNavigation } from './types';

/**
 * Default navigation hook — reads from window.location and dispatches full-page
 * navigations via window.location.href. Consumers should pass a real hook via
 * `adapters.useNavigation` for SPA-style transitions.
 */
export const useDefaultCaspianNavigation: UseCaspianNavigation = (): CaspianNavigation => {
  return {
    pathname: typeof window === 'undefined' ? '/' : window.location.pathname,
    push: (href: string) => {
      if (typeof window !== 'undefined') window.location.href = href;
    },
    replace: (href: string) => {
      if (typeof window !== 'undefined') window.location.replace(href);
    },
    back: () => {
      if (typeof window !== 'undefined') window.history.back();
    },
  };
};
