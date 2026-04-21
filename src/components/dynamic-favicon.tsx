'use client';

import { useEffect } from 'react';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { getSiteSettings } from '../services/site-settings-service';

/**
 * Reads `settings/site.faviconUrl` from Firestore and updates the document's
 * `<link rel="icon">` href. Renders nothing.
 */
export function DynamicFavicon() {
  const { db } = useCaspianFirebase();
  useEffect(() => {
    let cancelled = false;
    getSiteSettings(db)
      .then((settings) => {
        if (cancelled || !settings?.faviconUrl) return;
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = settings.faviconUrl;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [db]);
  return null;
}
