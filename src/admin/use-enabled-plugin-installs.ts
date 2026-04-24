'use client';

import { useEffect, useState } from 'react';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { listShippingPluginInstalls } from '../services/shipping-plugin-service';
import { listPaymentPluginInstalls } from '../services/payment-plugin-service';
import { listEmailPluginInstalls } from '../services/email-plugin-service';

export type EnabledPluginCategory = 'shipping' | 'payment' | 'email';

export interface EnabledPluginInstall {
  category: EnabledPluginCategory;
  /** The catalog plugin id (e.g. `flat-rate`, `stripe`, `sendgrid`). */
  pluginId: string;
  /** The install document id (Firestore doc id). */
  installId: string;
  /** Merchant-chosen display name. */
  name: string;
  /** Sort order as stored on the install doc. */
  order: number;
}

/**
 * Reads the currently-enabled plugin installs across shipping, payment, and
 * email collections, merged into one list.
 *
 * Added in v7.1.0 to power two surfaces:
 * 1. The unified `<AdminPluginsPage>` list view.
 * 2. Dynamic sidebar children under the Plugins nav group in `<AdminShell>` —
 *    each enabled install becomes a sidebar leaf linking to
 *    `/admin/plugins/<pluginId>/<installId>`.
 *
 * Re-fetches on window focus so a merchant who enables/disables a plugin in
 * another tab sees the sidebar update when they come back. Firestore reads
 * are cheap and bounded (3 queries × small install counts) so the trade-off
 * is fine without a snapshot listener.
 */
export function useEnabledPluginInstalls(): {
  installs: EnabledPluginInstall[];
  loading: boolean;
  refresh: () => void;
} {
  const { db } = useCaspianFirebase();
  const [installs, setInstalls] = useState<EnabledPluginInstall[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      listShippingPluginInstalls(db, { onlyEnabled: true }).catch(() => []),
      listPaymentPluginInstalls(db, { onlyEnabled: true }).catch(() => []),
      listEmailPluginInstalls(db, { onlyEnabled: true }).catch(() => []),
    ])
      .then(([shipping, payment, email]) => {
        if (!alive) return;
        const merged: EnabledPluginInstall[] = [
          ...shipping.map((x) => ({
            category: 'shipping' as const,
            pluginId: x.pluginId,
            installId: x.id,
            name: x.name,
            order: x.order,
          })),
          ...payment.map((x) => ({
            category: 'payment' as const,
            pluginId: x.pluginId,
            installId: x.id,
            name: x.name,
            order: x.order,
          })),
          ...email.map((x) => ({
            category: 'email' as const,
            pluginId: x.pluginId,
            installId: x.id,
            name: x.name,
            order: x.order,
          })),
        ];
        merged.sort((a, b) => {
          if (a.category !== b.category) return a.category.localeCompare(b.category);
          return a.order - b.order;
        });
        setInstalls(merged);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [db, refreshTick]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onFocus = () => setRefreshTick((n) => n + 1);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return { installs, loading, refresh: () => setRefreshTick((n) => n + 1) };
}
