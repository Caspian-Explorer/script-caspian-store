'use client';

import type { ReactNode } from 'react';
import { useCaspianNavigation } from '../provider/caspian-store-provider';
import { AdminDashboard } from './admin-dashboard';
import { AdminProductsList } from './admin-products-list';
import { AdminProductEditor } from './admin-product-editor';
import { AdminOrdersList } from './admin-orders-list';
import { AdminOrderDetail } from './admin-order-detail';
import { AdminReviewsModeration } from './admin-reviews-moderation';
import { AdminJournalPage } from './admin-journal-page';
import { AdminPagesPage } from './admin-pages-page';
import { AdminFaqsPage } from './admin-faqs-page';
import { AdminPromoCodesPage } from './admin-promo-codes-page';
import { AdminSubscribersPage } from './admin-subscribers-page';
import { AdminUsersPage } from './admin-users-page';
import { AdminProductCategoriesPage } from './admin-product-categories-page';
import { AdminProductCollectionsPage } from './admin-product-collections-page';
import { AdminAppearancePage } from './admin-appearance-page';
import { AdminAboutPage } from './admin-about-page';
import { AdminSettingsShell } from './admin-settings-shell';
import { AdminPluginsShell } from './admin-plugins-shell';

/**
 * Dispatcher for every /admin/** route. Parses pathname from the navigation
 * adapter and renders the matching admin page or delegates to a subshell
 * (Settings, Plugins) that owns its own sub-tree. CaspianRoot mounts this
 * when the incoming pathname falls under /admin/** and wraps it in
 * AdminGuard + AdminShell externally.
 *
 * New admin pages land by adding a switch case here — never by asking the
 * consumer to add a route file. That is the v7 contract.
 */
export function AdminRoot(): ReactNode {
  const { pathname } = useCaspianNavigation();
  const after = pathname.replace(/^\/admin\/?/, '');
  if (!after) return <AdminDashboard />;
  const [head, a, b] = after.split('/');

  switch (head) {
    case 'products':
      if (a === 'new') return <AdminProductEditor />;
      if (b === 'edit') return <AdminProductEditor productId={a} />;
      return <AdminProductsList />;
    case 'orders':
      return a ? <AdminOrderDetail orderId={a} /> : <AdminOrdersList />;
    case 'users':
      return <AdminUsersPage />;
    case 'subscribers':
      return <AdminSubscribersPage />;
    case 'reviews':
      return <AdminReviewsModeration />;
    case 'categories':
      return <AdminProductCategoriesPage />;
    case 'collections':
      return <AdminProductCollectionsPage />;
    case 'promo-codes':
      return <AdminPromoCodesPage />;
    case 'pages':
      return <AdminPagesPage />;
    case 'faqs':
      return <AdminFaqsPage />;
    case 'journal':
      return <AdminJournalPage />;
    case 'appearance':
      return <AdminAppearancePage />;
    case 'about':
      return <AdminAboutPage />;
    case 'settings':
      return <AdminSettingsShell />;
    case 'plugins':
      return <AdminPluginsShell />;
    default:
      return <AdminDashboard />;
  }
}
