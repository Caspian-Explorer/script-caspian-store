'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ShippingPluginInstall } from '../types';
import {
  createShippingPluginInstall,
  deleteShippingPluginInstall,
  listShippingPluginInstalls,
  updateShippingPluginInstall,
  type ShippingPluginInstallWriteInput,
} from '../services/shipping-plugin-service';
import { SHIPPING_PLUGIN_CATALOG, getShippingPlugin } from '../shipping/catalog';
import { SHIPPING_PLUGIN_IDS, type ShippingPluginId } from '../shipping/types';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { useT } from '../i18n/locale-context';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Input, Label } from '../ui/input';
import { Badge, Skeleton } from '../ui/misc';
import { Table, TBody, TD, TH, THead, TR } from '../ui/table';
import { useToast } from '../ui/toast';

type DraftConfig = Record<string, string>;

interface DraftState {
  pluginId: ShippingPluginId;
  name: string;
  order: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  config: DraftConfig;
}

function stringifyDefaults(cfg: Record<string, unknown>): DraftConfig {
  const out: DraftConfig = {};
  for (const [k, v] of Object.entries(cfg)) {
    out[k] = v === undefined || v === null ? '' : String(v);
  }
  return out;
}

function draftFromPlugin(pluginId: ShippingPluginId, name: string, order: number): DraftState {
  const plugin = getShippingPlugin(pluginId);
  return {
    pluginId,
    name,
    order,
    estimatedDaysMin: 3,
    estimatedDaysMax: 7,
    config: stringifyDefaults((plugin?.defaultConfig ?? {}) as Record<string, unknown>),
  };
}

function draftFromInstall(install: ShippingPluginInstall): DraftState {
  return {
    pluginId: install.pluginId,
    name: install.name,
    order: install.order,
    estimatedDaysMin: install.estimatedDays.min,
    estimatedDaysMax: install.estimatedDays.max,
    config: stringifyDefaults(install.config),
  };
}

function coerceConfig(raw: DraftConfig): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    const trimmed = v.trim();
    if (trimmed === '') continue;
    const num = Number(trimmed);
    out[k] = Number.isFinite(num) && trimmed.match(/^-?\d+(\.\d+)?$/) ? num : trimmed;
  }
  return out;
}

export function AdminShippingPluginsPage({ className }: { className?: string }) {
  const { db } = useCaspianFirebase();
  const { toast } = useToast();
  const t = useT();
  const [installs, setInstalls] = useState<ShippingPluginInstall[] | null>(null);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setInstalls(await listShippingPluginInstalls(db));
    } catch (error) {
      console.error('[caspian-store] Failed to list shipping plugin installs:', error);
      setInstalls([]);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const catalogEntries = useMemo(
    () => SHIPPING_PLUGIN_IDS.map((id) => SHIPPING_PLUGIN_CATALOG[id]),
    [],
  );

  const openBrowse = () => setBrowseOpen(true);

  const openInstall = (pluginId: ShippingPluginId) => {
    const plugin = getShippingPlugin(pluginId);
    if (!plugin) return;
    setEditingId(null);
    setDraft(draftFromPlugin(pluginId, plugin.name, (installs?.length ?? 0) + 1));
    setBrowseOpen(false);
    setConfigOpen(true);
  };

  const openConfigure = (install: ShippingPluginInstall) => {
    setEditingId(install.id);
    setDraft(draftFromInstall(install));
    setConfigOpen(true);
  };

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast({ title: t('admin.shippingPlugins.errors.nameRequired'), variant: 'destructive' });
      return;
    }
    const plugin = getShippingPlugin(draft.pluginId);
    if (!plugin) {
      toast({ title: 'Unknown plugin', variant: 'destructive' });
      return;
    }
    const coerced = coerceConfig(draft.config);
    try {
      plugin.validateConfig(coerced);
    } catch (error) {
      toast({
        title: t('admin.shippingPlugins.errors.invalidConfig'),
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
      return;
    }
    const payload: ShippingPluginInstallWriteInput = {
      pluginId: draft.pluginId,
      name: draft.name.trim(),
      enabled: true,
      order: draft.order,
      estimatedDays: { min: draft.estimatedDaysMin, max: draft.estimatedDaysMax },
      config: coerced,
    };
    setSaving(true);
    try {
      if (editingId) {
        await updateShippingPluginInstall(db, editingId, payload);
        toast({ title: t('admin.shippingPlugins.toasts.updated') });
      } else {
        await createShippingPluginInstall(db, payload);
        toast({ title: t('admin.shippingPlugins.toasts.installed') });
      }
      setConfigOpen(false);
      await load();
    } catch (error) {
      console.error('[caspian-store] Shipping plugin save failed:', error);
      toast({ title: t('admin.shippingPlugins.errors.saveFailed'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (install: ShippingPluginInstall) => {
    if (!confirm(`${t('admin.shippingPlugins.confirmRemove')}\n\n"${install.name}"`)) return;
    try {
      await deleteShippingPluginInstall(db, install.id);
      setInstalls((prev) => (prev ? prev.filter((x) => x.id !== install.id) : prev));
      toast({ title: t('admin.shippingPlugins.toasts.removed') });
    } catch (error) {
      console.error('[caspian-store] Shipping plugin remove failed:', error);
      toast({ title: t('admin.shippingPlugins.errors.removeFailed'), variant: 'destructive' });
    }
  };

  const toggleEnabled = async (install: ShippingPluginInstall) => {
    try {
      await updateShippingPluginInstall(db, install.id, { enabled: !install.enabled });
      setInstalls((prev) =>
        prev
          ? prev.map((x) => (x.id === install.id ? { ...x, enabled: !install.enabled } : x))
          : prev,
      );
    } catch (error) {
      console.error('[caspian-store] Shipping plugin toggle failed:', error);
      toast({ title: t('admin.shippingPlugins.errors.toggleFailed'), variant: 'destructive' });
    }
  };

  const activePlugin = draft ? getShippingPlugin(draft.pluginId) : null;

  return (
    <div className={className}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
            {t('admin.shippingPlugins.title')}
          </h1>
          <p style={{ color: '#666', marginTop: 4 }}>
            {t('admin.shippingPlugins.subtitle')}
          </p>
        </div>
        <Button onClick={openBrowse}>{t('admin.shippingPlugins.browse')}</Button>
      </header>

      {installs === null ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton style={{ height: 48 }} />
          <Skeleton style={{ height: 48 }} />
        </div>
      ) : installs.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: 'center',
            border: '1px dashed #ddd',
            borderRadius: 'var(--caspian-radius, 8px)',
            color: '#666',
          }}
        >
          <p style={{ margin: 0, fontSize: 15 }}>{t('admin.shippingPlugins.empty')}</p>
          <div style={{ marginTop: 16 }}>
            <Button variant="outline" onClick={openBrowse}>
              {t('admin.shippingPlugins.browse')}
            </Button>
          </div>
        </div>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t('admin.shippingPlugins.col.order')}</TH>
              <TH>{t('admin.shippingPlugins.col.name')}</TH>
              <TH>{t('admin.shippingPlugins.col.plugin')}</TH>
              <TH>{t('admin.shippingPlugins.col.delivery')}</TH>
              <TH>{t('admin.shippingPlugins.col.status')}</TH>
              <TH style={{ textAlign: 'right' }}>{t('admin.shippingPlugins.col.actions')}</TH>
            </TR>
          </THead>
          <TBody>
            {installs.map((install) => {
              const plugin = getShippingPlugin(install.pluginId);
              return (
                <TR key={install.id}>
                  <TD style={{ fontFamily: 'monospace', fontSize: 13 }}>{install.order}</TD>
                  <TD style={{ fontWeight: 500 }}>{install.name}</TD>
                  <TD style={{ color: '#666' }}>{plugin?.name ?? install.pluginId}</TD>
                  <TD style={{ color: '#666' }}>
                    {install.estimatedDays.min}–{install.estimatedDays.max} {t('admin.shippingPlugins.daysSuffix')}
                  </TD>
                  <TD>
                    <Badge variant={install.enabled ? 'default' : 'secondary'}>
                      {install.enabled
                        ? t('admin.shippingPlugins.status.enabled')
                        : t('admin.shippingPlugins.status.disabled')}
                    </Badge>
                  </TD>
                  <TD style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <Button variant="outline" size="sm" onClick={() => toggleEnabled(install)}>
                        {install.enabled
                          ? t('admin.shippingPlugins.action.disable')
                          : t('admin.shippingPlugins.action.enable')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openConfigure(install)}>
                        {t('admin.shippingPlugins.action.configure')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(install)}
                      >
                        {t('admin.shippingPlugins.action.remove')}
                      </Button>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      <Dialog
        open={browseOpen}
        onOpenChange={setBrowseOpen}
        title={t('admin.shippingPlugins.browseTitle')}
        description={t('admin.shippingPlugins.browseSubtitle')}
        maxWidth={720}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {catalogEntries.map((plugin) => (
            <div
              key={plugin.id}
              style={{
                border: '1px solid #eee',
                borderRadius: 'var(--caspian-radius, 8px)',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
                {t(`shipping.plugins.${plugin.id}.name`) || plugin.name}
              </h3>
              <p style={{ margin: 0, color: '#666', fontSize: 13, flex: 1 }}>
                {t(`shipping.plugins.${plugin.id}.description`) || plugin.description}
              </p>
              <Button size="sm" onClick={() => openInstall(plugin.id)}>
                {t('admin.shippingPlugins.install')}
              </Button>
            </div>
          ))}
        </div>
      </Dialog>

      {draft && (
        <Dialog
          open={configOpen}
          onOpenChange={(v) => {
            setConfigOpen(v);
            if (!v) setDraft(null);
          }}
          title={
            editingId
              ? t('admin.shippingPlugins.configureTitle')
              : t('admin.shippingPlugins.installTitle')
          }
          description={activePlugin?.description}
          maxWidth={560}
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => setConfigOpen(false)}
                disabled={saving}
              >
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSave} loading={saving}>
                {t('common.save')}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <Label>{t('admin.shippingPlugins.field.name')}</Label>
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                placeholder={activePlugin?.name}
              />
              <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                {t('admin.shippingPlugins.field.nameHint')}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <div>
                <Label>{t('admin.shippingPlugins.field.minDays')}</Label>
                <Input
                  type="number"
                  value={draft.estimatedDaysMin}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, estimatedDaysMin: Number(e.target.value) || 0 } : d,
                    )
                  }
                />
              </div>
              <div>
                <Label>{t('admin.shippingPlugins.field.maxDays')}</Label>
                <Input
                  type="number"
                  value={draft.estimatedDaysMax}
                  onChange={(e) =>
                    setDraft((d) =>
                      d ? { ...d, estimatedDaysMax: Number(e.target.value) || 0 } : d,
                    )
                  }
                />
              </div>
              <div>
                <Label>{t('admin.shippingPlugins.field.order')}</Label>
                <Input
                  type="number"
                  value={draft.order}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, order: Number(e.target.value) || 0 } : d))
                  }
                />
              </div>
            </div>

            <ConfigFields draft={draft} setDraft={setDraft} />
          </div>
        </Dialog>
      )}
    </div>
  );
}

function ConfigFields({
  draft,
  setDraft,
}: {
  draft: DraftState;
  setDraft: React.Dispatch<React.SetStateAction<DraftState | null>>;
}) {
  const t = useT();
  const setConfigValue = (key: string, value: string) =>
    setDraft((d) => (d ? { ...d, config: { ...d.config, [key]: value } } : d));

  switch (draft.pluginId) {
    case 'flat-rate':
      return (
        <div>
          <Label>{t('admin.shippingPlugins.field.flatRate.price')}</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={draft.config.price ?? ''}
            onChange={(e) => setConfigValue('price', e.target.value)}
          />
        </div>
      );
    case 'free-shipping':
      return (
        <p style={{ fontSize: 13, color: '#666', margin: 0 }}>
          {t('admin.shippingPlugins.field.freeShipping.hint')}
        </p>
      );
    case 'free-over-threshold':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <Label>{t('admin.shippingPlugins.field.freeOverThreshold.threshold')}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={draft.config.threshold ?? ''}
              onChange={(e) => setConfigValue('threshold', e.target.value)}
            />
          </div>
          <div>
            <Label>{t('admin.shippingPlugins.field.freeOverThreshold.fallbackPrice')}</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={draft.config.fallbackPrice ?? ''}
              onChange={(e) => setConfigValue('fallbackPrice', e.target.value)}
            />
          </div>
        </div>
      );
    case 'weight-based':
      return (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <Label>{t('admin.shippingPlugins.field.weightBased.basePrice')}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={draft.config.basePrice ?? ''}
                onChange={(e) => setConfigValue('basePrice', e.target.value)}
              />
            </div>
            <div>
              <Label>{t('admin.shippingPlugins.field.weightBased.pricePerKg')}</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={draft.config.pricePerKg ?? ''}
                onChange={(e) => setConfigValue('pricePerKg', e.target.value)}
              />
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
            {t('admin.shippingPlugins.field.weightBased.hint')}
          </p>
        </>
      );
    default:
      return null;
  }
}
