'use client';

import { useEffect, useState } from 'react';
import type { ShippingMethod } from '../types';
import {
  createShippingMethod,
  deleteShippingMethod,
  listShippingMethods,
  updateShippingMethod,
  type ShippingMethodWriteInput,
} from '../services/shipping-method-service';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Input, Label } from '../ui/input';
import { Badge, Skeleton } from '../ui/misc';
import { Table, TBody, TD, TH, THead, TR } from '../ui/table';
import { useToast } from '../ui/toast';

const emptyDraft: ShippingMethodWriteInput = {
  slug: '',
  name: '',
  price: 0,
  estimatedDays: { min: 1, max: 3 },
  isActive: true,
  order: 0,
};

function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function AdminShippingPage({ className }: { className?: string }) {
  const { db } = useCaspianFirebase();
  const { toast } = useToast();
  const [methods, setMethods] = useState<ShippingMethod[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ShippingMethodWriteInput>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setMethods(await listShippingMethods(db));
    } catch (error) {
      console.error('[caspian-store] Failed to list shipping methods:', error);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setDraft({ ...emptyDraft, order: (methods?.length ?? 0) + 1 });
    setDialogOpen(true);
  };

  const openEdit = (m: ShippingMethod) => {
    setEditingId(m.id);
    setDraft({
      slug: m.slug,
      name: m.name,
      price: m.price,
      estimatedDays: m.estimatedDays,
      isActive: m.isActive,
      order: m.order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    if (draft.price < 0) {
      toast({ title: 'Price cannot be negative', variant: 'destructive' });
      return;
    }
    const slug = draft.slug || slugify(draft.name);
    setSaving(true);
    try {
      if (editingId) {
        await updateShippingMethod(db, editingId, { ...draft, slug });
        toast({ title: 'Shipping method updated' });
      } else {
        await createShippingMethod(db, { ...draft, slug });
        toast({ title: 'Shipping method created' });
      }
      setDialogOpen(false);
      await load();
    } catch (error) {
      console.error('[caspian-store] Save failed:', error);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: ShippingMethod) => {
    if (!confirm(`Delete shipping method "${m.name}"?`)) return;
    try {
      await deleteShippingMethod(db, m.id);
      setMethods((prev) => (prev ? prev.filter((x) => x.id !== m.id) : prev));
      toast({ title: 'Shipping method deleted' });
    } catch (error) {
      console.error('[caspian-store] Delete failed:', error);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const toggleActive = async (m: ShippingMethod) => {
    try {
      await updateShippingMethod(db, m.id, { isActive: !m.isActive });
      setMethods((prev) =>
        prev ? prev.map((x) => (x.id === m.id ? { ...x, isActive: !m.isActive } : x)) : prev,
      );
    } catch (error) {
      console.error('[caspian-store] Toggle failed:', error);
      toast({ title: 'Action failed', variant: 'destructive' });
    }
  };

  return (
    <div className={className}>
      <header
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Shipping methods</h1>
          <p style={{ color: '#666', marginTop: 4 }}>
            Displayed on the public Shipping & Returns page and offered at checkout.
          </p>
        </div>
        <Button onClick={openCreate}>+ New method</Button>
      </header>

      {methods === null ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton style={{ height: 48 }} />
          <Skeleton style={{ height: 48 }} />
        </div>
      ) : methods.length === 0 ? (
        <p style={{ color: '#888', padding: 32, textAlign: 'center' }}>No shipping methods configured.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Order</TH>
              <TH>Name</TH>
              <TH>Slug</TH>
              <TH>Delivery</TH>
              <TH>Price</TH>
              <TH>Active</TH>
              <TH style={{ textAlign: 'right' }}>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {methods.map((m) => (
              <TR key={m.id}>
                <TD style={{ fontFamily: 'monospace', fontSize: 13 }}>{m.order}</TD>
                <TD style={{ fontWeight: 500 }}>{m.name}</TD>
                <TD style={{ fontSize: 12, color: '#888', fontFamily: 'monospace' }}>{m.slug}</TD>
                <TD style={{ color: '#666' }}>
                  {m.estimatedDays.min}–{m.estimatedDays.max} days
                </TD>
                <TD>${m.price.toFixed(2)}</TD>
                <TD>
                  <Badge variant={m.isActive ? 'default' : 'secondary'}>
                    {m.isActive ? 'Active' : 'Hidden'}
                  </Badge>
                </TD>
                <TD style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <Button variant="outline" size="sm" onClick={() => toggleActive(m)}>
                      {m.isActive ? 'Hide' : 'Show'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(m)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(m)}>
                      Delete
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? 'Edit shipping method' : 'New shipping method'}
        maxWidth={560}
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <Label>Name</Label>
            <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          </div>
          <div>
            <Label>Slug (leave blank to auto-generate)</Label>
            <Input value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div>
              <Label>Min days</Label>
              <Input
                type="number"
                value={draft.estimatedDays.min}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    estimatedDays: { ...d.estimatedDays, min: Number(e.target.value) || 0 },
                  }))
                }
              />
            </div>
            <div>
              <Label>Max days</Label>
              <Input
                type="number"
                value={draft.estimatedDays.max}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    estimatedDays: { ...d.estimatedDays, max: Number(e.target.value) || 0 },
                  }))
                }
              />
            </div>
            <div>
              <Label>Price</Label>
              <Input
                type="number"
                step="0.01"
                value={draft.price}
                onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div>
            <Label>Order</Label>
            <Input
              type="number"
              value={draft.order}
              onChange={(e) => setDraft((d) => ({ ...d, order: Number(e.target.value) || 0 }))}
            />
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))}
            />
            Active (shown at checkout + shipping page)
          </label>
        </div>
      </Dialog>
    </div>
  );
}
