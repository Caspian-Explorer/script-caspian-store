'use client';

import type { ReactNode } from 'react';
import { getShippingPlugin } from '../shipping/catalog';
import { getPaymentPlugin } from '../payments/catalog';
import { getEmailPlugin } from '../email/catalog';
import { AdminShippingPluginsPage } from './admin-shipping-plugins-page';
import { AdminPaymentPluginsPage } from './admin-payment-plugins-page';
import { AdminEmailPluginsPage } from './admin-email-plugins-page';

export interface AdminPluginInstallPageProps {
  /** Catalog plugin id (e.g. `flat-rate`, `stripe`, `sendgrid`). */
  pluginId: string;
  /** Firestore install doc id. */
  installId: string;
  className?: string;
}

/**
 * Per-install configure page introduced in v7.1.0. The sidebar's dynamic
 * Plugins children (one leaf per enabled install) link here, as does the
 * "Configure" action in `<AdminPluginsPage>`'s list view.
 *
 * Rather than duplicate the hundreds of lines of configure-dialog logic
 * from the three category pages, this page thin-wraps the right category
 * page and passes `autoConfigureInstallId`, which opens the configure
 * dialog for the requested install as soon as the list loads. Result: a
 * dedicated URL per install, with the full existing configure UX reused
 * verbatim — and any future improvement to those dialogs lands here for
 * free.
 */
export function AdminPluginInstallPage({
  pluginId,
  installId,
  className,
}: AdminPluginInstallPageProps): ReactNode {
  if (getShippingPlugin(pluginId)) {
    return (
      <AdminShippingPluginsPage
        className={className}
        autoConfigureInstallId={installId}
      />
    );
  }
  if (getPaymentPlugin(pluginId)) {
    return (
      <AdminPaymentPluginsPage
        className={className}
        autoConfigureInstallId={installId}
      />
    );
  }
  if (getEmailPlugin(pluginId)) {
    return (
      <AdminEmailPluginsPage
        className={className}
        autoConfigureInstallId={installId}
      />
    );
  }
  return (
    <div
      className={className}
      style={{
        maxWidth: 520,
        margin: '80px auto',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Unknown plugin</h1>
      <p style={{ color: '#666', marginTop: 8 }}>
        <code>{pluginId}</code> doesn&apos;t match any catalog entry. Uninstall this
        entry or check for a typo.
      </p>
    </div>
  );
}
