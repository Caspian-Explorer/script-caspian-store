'use client';

import { useEffect, useState } from 'react';
import type { PromoCode } from '../types';
import {
  createPromoCode,
  deletePromoCode,
  listPromoCodes,
  updatePromoCode,
  type PromoCodeWriteInput,
} from '../services/promo-code-service';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Input, Label } from '../ui/input';
import { Select } from '../ui/select';
import { Badge, Skeleton } from '../ui/misc';
import { Table, TBody, TD, TH, THead, TR } from '../ui/table';
import { useToast } from '../ui/toast';

const emptyDraft: PromoCodeWriteInput = {
  code: '',
  type: 'percentage',
  value: 10,
  minOrderAmount: undefined,
  maxDiscount: undefined,
  isActive: true,
};

export function AdminPromoCodesPage({ className }: { className?: string }) {
  const { db } = useCaspianFirebase();
  const { toast } = useToast();
  const [codes, setCodes] = useState<PromoCode[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PromoCodeWriteInput>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setCodes(await listPromoCodes(db));
    } catch (error) {
      console.error('[caspian-store] Failed to list promo codes:', error);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setDraft(emptyDraft);
    setOpen(true);
  };

  const openEdit = (code: PromoCode) => {
    setEditingId(code.id);
    setDraft({
      code: code.code,
      type: code.type,
      value: code.value,
      minOrderAmount: code.minOrderAmount,
      maxDiscount: code.maxDiscount,
      isActive: code.isActive,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft.code.trim()) {
      toast({ title: 'Code is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updatePromoCode(db, editingId, draft);
        toast({ title: 'Promo code updated' });
      } else {
        await createPromoCode(db, draft);
        toast({ title: 'Promo code created' });
      }
      setOpen(false);
      await load();
    } catch (error) {
      console.error('[caspian-store] Save failed:', error);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (code: PromoCode) => {
    if (!confirm(`Delete promo code "${code.code}"?`)) return;
    try {
      await deletePromoCode(db, code.id);
      setCodes((prev) => (prev ? prev.filter((c) => c.id !== code.id) : prev));
      toast({ title: 'Promo code deleted' });
    } catch (error) {
      console.error('[caspian-store] Delete failed:', error);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  return (
    <div className={className}>
      <header
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Promo codes</h1>
          <p style={{ color: '#666', marginTop: 4 }}>
            Create discount codes validated by the Stripe Cloud Function at checkout.
          </p>
        </div>
        <Button onClick={openCreate}>+ New code</Button>
      </header>

      {codes === null ? (
        <Skeleton style={{ height: 120 }} />
      ) : codes.length === 0 ? (
        <p style={{ color: '#888', padding: 32, textAlign: 'center' }}>No promo codes yet.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Code</TH>
              <TH>Type</TH>
              <TH>Value</TH>
              <TH>Min order</TH>
              <TH>Max discount</TH>
              <TH>Status</TH>
              <TH style={{ textAlign: 'right' }}>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {codes.map((c) => (
              <TR key={c.id}>
                <TD style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.code}</TD>
                <TD>{c.type}</TD>
                <TD>
                  {c.type === 'percentage' ? `${c.value}%` : `$${c.value.toFixed(2)}`}
                </TD>
                <TD>{c.minOrderAmount ? `$${c.minOrderAmount.toFixed(2)}` : '—'}</TD>
                <TD>{c.maxDiscount ? `$${c.maxDiscount.toFixed(2)}` : '—'}</TD>
                <TD>
                  <Badge variant={c.isActive ? 'default' : 'secondary'}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TD>
                <TD style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(c)}>
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
        open={open}
        onOpenChange={setOpen}
        title={editingId ? 'Edit promo code' : 'New promo code'}
        maxWidth={560}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
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
            <Label>Code</Label>
            <Input
              value={draft.code}
              onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value.toUpperCase() }))}
              placeholder="SPRING20"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <Label>Type</Label>
              <Select
                value={draft.type}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, type: e.target.value as PromoCodeWriteInput['type'] }))
                }
                options={[
                  { value: 'percentage', label: 'Percentage' },
                  { value: 'fixed', label: 'Fixed amount' },
                ]}
              />
            </div>
            <div>
              <Label>Value ({draft.type === 'percentage' ? '%' : '$'})</Label>
              <Input
                type="number"
                step="0.01"
                value={draft.value}
                onChange={(e) => setDraft((d) => ({ ...d, value: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <Label>Min order amount (optional)</Label>
              <Input
                type="number"
                step="0.01"
                value={draft.minOrderAmount ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    minOrderAmount: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
            <div>
              <Label>Max discount (optional)</Label>
              <Input
                type="number"
                step="0.01"
                value={draft.maxDiscount ?? ''}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    maxDiscount: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
              />
            </div>
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))}
            />
            Active
          </label>
        </div>
      </Dialog>
    </div>
  );
}
