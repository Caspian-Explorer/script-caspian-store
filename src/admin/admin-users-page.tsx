'use client';

import { useCallback, useEffect, useState } from 'react';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { useT } from '../i18n/locale-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { countNewContacts } from '../services/contact-service';
import { AdminContactsList } from './admin-contacts-list';

export interface AdminUsersPageProps {
  className?: string;
}

/**
 * Admin > Users — customer-facing records. Tabbed parent; the first (and
 * currently only) tab renders the Contacts inbox. Additional tabs for
 * customer records, subscribers, etc. can slot in here without a nav re-org.
 */
export function AdminUsersPage({ className }: AdminUsersPageProps) {
  const { db } = useCaspianFirebase();
  const t = useT();
  const [newContactCount, setNewContactCount] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshCount = useCallback(async () => {
    try {
      const n = await countNewContacts(db);
      setNewContactCount(n);
    } catch (error) {
      console.error('[caspian-store] Failed to count new contacts:', error);
    }
  }, [db]);

  useEffect(() => {
    refreshCount();
  }, [refreshCount, refreshKey]);

  const handleMutated = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className={className}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{t('admin.users.title')}</h1>
        <p style={{ color: '#666', marginTop: 4 }}>{t('admin.users.subtitle')}</p>
      </header>

      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts">
            {t('admin.users.tabs.contacts')}
            {newContactCount !== null && newContactCount > 0 ? ` (${newContactCount})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <AdminContactsList refreshKey={refreshKey} onMutated={handleMutated} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
