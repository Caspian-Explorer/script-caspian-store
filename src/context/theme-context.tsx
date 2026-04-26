'use client';

import { useEffect } from 'react';
import { useScriptSettings } from './script-settings-context';

/**
 * Applies the current theme tokens from script settings onto CSS custom
 * properties on the document root. Consumers can style their own components
 * against these variables too.
 */
export function ThemeInjector() {
  const { settings } = useScriptSettings();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const theme = settings.theme;
    root.style.setProperty('--caspian-primary', theme.primary);
    root.style.setProperty('--caspian-primary-foreground', theme.primaryForeground);
    root.style.setProperty('--caspian-accent', theme.accent);
    root.style.setProperty('--caspian-radius', theme.radius);
    if (theme.fontFamily) {
      root.style.setProperty('--caspian-font-family', theme.fontFamily);
    }
    if (theme.background) {
      root.style.setProperty('--caspian-background', theme.background);
    }
  }, [settings.theme]);

  return null;
}
