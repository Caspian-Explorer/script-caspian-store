'use client';

import type { ReactNode } from 'react';
import { AdminGuard, AdminShell } from '@caspian-explorer/script-caspian-store';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
