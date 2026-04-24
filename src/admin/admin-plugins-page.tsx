'use client';

import { useMemo, useState } from 'react';
import { useCaspianFirebase, useCaspianLink, useCaspianNavigation } from '../provider/caspian-store-provider';
import { useT } from '../i18n/locale-context';
import { SHIPPING_PLUGIN_CATALOG } from '../shipping/catalog';
import { PAYMENT_PLUGIN_CATALOG } from '../payments/catalog';
import { EMAIL_PLUGIN_CATALOG } from '../email/catalog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/misc';
import { Table, TBody, TD, TH, THead, TR } from '../ui/table';
import { cn } from '../utils/cn';
import {
  useEnabledPluginInstalls,
  type EnabledPluginCategory,
} from './use-enabled-plugin-installs';

type Filter = 'all' | EnabledPluginCategory;

interface CatalogEntry {
  category: EnabledPluginCategory;
  pluginId: string;
  name: string;
  description: string;
}

export interface AdminPluginsPageProps {
  className?: string;
}

/**
 * Unified plugin browser introduced in v7.1.0. Merges the three category
 * pages (Shipping, Payments, Email providers) into one searchable +
 * filterable list so merchants configure plugins from one surface instead
 * of swapping tabs. The three category pages themselves remain exported
 * for consumers who want a split view, and AdminPluginInstallPage deep-links
 * into them to reuse their configure dialogs.
 */
export function AdminPluginsPage({ className }: AdminPluginsPageProps) {
  useCaspianFirebase();
  const Link = useCaspianLink();
  const nav = useCaspianNavigation();
  const t = useT();
  const { installs, loading } = useEnabledPluginInstalls();

  const [search, setSearch] = useState(() => nav.searchParams?.get('q') ?? '');
  const [filter, setFilter] = useState<Filter>(() => {
    const raw = nav.searchParams?.get('filter') ?? '';
    return raw === 'shipping' || raw === 'payment' || raw === 'email' ? raw : 'all';
  });

  const catalog = useMemo<CatalogEntry[]>(() => {
    const out: CatalogEntry[] = [];
    for (const entry of Object.values(SHIPPING_PLUGIN_CATALOG)) {
      out.push({
        category: 'shipping',
        pluginId: entry.id,
        name: entry.name,
        description: entry.description ?? '',
      });
    }
    for (const entry of Object.values(PAYMENT_PLUGIN_CATALOG)) {
      out.push({
        category: 'payment',
        pluginId: entry.id,
        name: entry.name,
        description: entry.description ?? '',
      });
    }
    for (const entry of Object.values(EMAIL_PLUGIN_CATALOG)) {
      out.push({
        category: 'email',
        pluginId: entry.id,
        name: entry.name,
        description: entry.description ?? '',
      });
    }
    return out;
  }, []);

  const normalized = search.trim().toLowerCase();

  const filteredInstalls = useMemo(
    () =>
      installs.filter((x) => {
        if (filter !== 'all' && x.category !== filter) return false;
        if (!normalized) return true;
        return x.name.toLowerCase().includes(normalized) ||
          x.pluginId.toLowerCase().includes(normalized);
      }),
    [installs, filter, normalized],
  );

  const filteredCatalog = useMemo(
    () =>
      catalog.filter((x) => {
        if (filter !== 'all' && x.category !== filter) return false;
        if (!normalized) return true;
        return (
          x.name.toLowerCase().includes(normalized) ||
          x.description.toLowerCase().includes(normalized)
        );
      }),
    [catalog, filter, normalized],
  );

  const manageHrefFor = (category: EnabledPluginCategory): string => {
    switch (category) {
      case 'shipping':
        return '/admin/plugins/manage/shipping';
      case 'payment':
        return '/admin/plugins/manage/payments';
      case 'email':
        return '/admin/plugins/manage/email-providers';
    }
  };

  return (
    <div className={className}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          {t('admin.plugins.title')}
        </h1>
        <p style={{ color: '#666', marginTop: 4 }}>{t('admin.plugins.subtitle')}</p>
      </header>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.plugins.search.placeholder')}
          style={{ flex: '1 1 280px', maxWidth: 420 }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'shipping', 'payment', 'email'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn('caspian-chip', filter === key && 'is-active')}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                border: '1px solid #ddd',
                background: filter === key ? '#111' : '#fff',
                color: filter === key ? '#fff' : '#333',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: filter === key ? 600 : 500,
              }}
            >
              {t(`admin.plugins.filter.${key}`)}
            </button>
          ))}
        </div>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 12 }}>
          {t('admin.plugins.installed.title')}
        </h2>
        {loading ? (
          <div style={{ color: '#999', padding: 16 }}>{t('common.loading')}</div>
        ) : filteredInstalls.length === 0 ? (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: '#888',
              border: '1px dashed #ddd',
              borderRadius: 'var(--caspian-radius, 8px)',
              background: '#fafafa',
            }}
          >
            {t('admin.plugins.installed.empty')}
          </div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>{t('admin.plugins.col.category')}</TH>
                <TH>{t('admin.plugins.col.name')}</TH>
                <TH>{t('admin.plugins.col.plugin')}</TH>
                <TH style={{ textAlign: 'right' }}>{t('admin.plugins.col.actions')}</TH>
              </TR>
            </THead>
            <TBody>
              {filteredInstalls.map((x) => (
                <TR key={`${x.category}-${x.installId}`}>
                  <TD>
                    <Badge variant="outline">
                      {t(`admin.plugins.filter.${x.category}`)}
                    </Badge>
                  </TD>
                  <TD style={{ fontWeight: 600 }}>{x.name}</TD>
                  <TD style={{ color: '#666' }}>{x.pluginId}</TD>
                  <TD style={{ textAlign: 'right' }}>
                    <Link href={`/admin/plugins/${x.pluginId}/${x.installId}`}>
                      <Button size="sm" variant="outline">
                        {t('admin.plugins.configure')}
                      </Button>
                    </Link>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 12 }}>
          {t('admin.plugins.catalog.title')}
        </h2>
        {filteredCatalog.length === 0 ? (
          <div style={{ color: '#888', padding: 16, fontSize: 14 }}>
            {t('admin.plugins.catalog.empty')}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}
          >
            {filteredCatalog.map((entry) => (
              <div
                key={`${entry.category}-${entry.pluginId}`}
                style={{
                  border: '1px solid #eee',
                  borderRadius: 'var(--caspian-radius, 8px)',
                  padding: 14,
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge variant="outline">
                    {t(`admin.plugins.filter.${entry.category}`)}
                  </Badge>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{entry.name}</span>
                </div>
                <p style={{ color: '#666', fontSize: 13, margin: 0, minHeight: 36 }}>
                  {entry.description || '—'}
                </p>
                <Link href={manageHrefFor(entry.category)}>
                  <Button size="sm" variant="outline" style={{ alignSelf: 'flex-start' }}>
                    {t('admin.plugins.install')}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
