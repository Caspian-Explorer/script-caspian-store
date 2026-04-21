'use client';

import { useEffect, useState } from 'react';
import type { LanguageDoc } from '../types';
import {
  createLanguage,
  deleteLanguage,
  listLanguages,
  updateLanguage,
  type LanguageWriteInput,
} from '../services/language-service';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Input, Label } from '../ui/input';
import { Select } from '../ui/select';
import { Badge, Skeleton } from '../ui/misc';
import { Table, TBody, TD, TH, THead, TR } from '../ui/table';
import { useToast } from '../ui/toast';

const emptyDraft: LanguageWriteInput = {
  code: '',
  name: '',
  nativeName: '',
  flag: '',
  isDefault: false,
  isActive: true,
  direction: 'ltr',
  order: 0,
};

export function AdminLanguagesPage({ className }: { className?: string }) {
  const { db } = useCaspianFirebase();
  const { toast } = useToast();
  const [languages, setLanguages] = useState<LanguageDoc[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LanguageWriteInput>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLanguages(await listLanguages(db));
    } catch (error) {
      console.error('[caspian-store] Failed to list languages:', error);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setDraft({ ...emptyDraft, order: (languages?.length ?? 0) + 1 });
    setOpen(true);
  };

  const openEdit = (l: LanguageDoc) => {
    setEditingId(l.id);
    setDraft({
      code: l.code,
      name: l.name,
      nativeName: l.nativeName,
      flag: l.flag ?? '',
      isDefault: l.isDefault,
      isActive: l.isActive,
      direction: l.direction,
      order: l.order,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft.code.trim() || !draft.name.trim()) {
      toast({ title: 'Code and name are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: LanguageWriteInput = {
        ...draft,
        code: draft.code.trim().toLowerCase(),
      };
      if (editingId) {
        await updateLanguage(db, editingId, payload);
        toast({ title: 'Language updated' });
      } else {
        await createLanguage(db, payload);
        toast({ title: 'Language created' });
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

  const handleDelete = async (l: LanguageDoc) => {
    if (l.isDefault) {
      toast({ title: "Can't delete the default language", variant: 'destructive' });
      return;
    }
    if (!confirm(`Delete language "${l.name}"?`)) return;
    try {
      await deleteLanguage(db, l.id);
      setLanguages((prev) => (prev ? prev.filter((x) => x.id !== l.id) : prev));
      toast({ title: 'Language deleted' });
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
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Languages</h1>
          <p style={{ color: '#666', marginTop: 4 }}>
            Locale registry — code, native name, direction, default flag.
          </p>
        </div>
        <Button onClick={openCreate}>+ New language</Button>
      </header>

      {languages === null ? (
        <Skeleton style={{ height: 120 }} />
      ) : languages.length === 0 ? (
        <p style={{ color: '#888', padding: 32, textAlign: 'center' }}>No languages yet.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Order</TH>
              <TH>Code</TH>
              <TH>Name</TH>
              <TH>Native name</TH>
              <TH>Direction</TH>
              <TH>Status</TH>
              <TH style={{ textAlign: 'right' }}>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {languages.map((l) => (
              <TR key={l.id}>
                <TD style={{ fontFamily: 'monospace', fontSize: 13 }}>{l.order}</TD>
                <TD style={{ fontFamily: 'monospace', fontSize: 13 }}>
                  {l.flag ? `${l.flag} ` : ''}
                  {l.code}
                </TD>
                <TD style={{ fontWeight: 500 }}>{l.name}</TD>
                <TD>{l.nativeName}</TD>
                <TD style={{ fontSize: 12, color: '#666' }}>{l.direction.toUpperCase()}</TD>
                <TD>
                  {l.isDefault && <Badge variant="secondary">Default</Badge>}{' '}
                  <Badge variant={l.isActive ? 'default' : 'secondary'}>
                    {l.isActive ? 'Active' : 'Hidden'}
                  </Badge>
                </TD>
                <TD style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <Button variant="outline" size="sm" onClick={() => openEdit(l)}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(l)}
                      disabled={l.isDefault}
                    >
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
        title={editingId ? 'Edit language' : 'New language'}
        maxWidth={520}
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <Label>Code (BCP 47, e.g. `en`, `ar`)</Label>
              <Input
                value={draft.code}
                onChange={(e) => setDraft((d) => ({ ...d, code: e.target.value }))}
              />
            </div>
            <div>
              <Label>Flag emoji</Label>
              <Input
                value={draft.flag ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, flag: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Name (English)</Label>
            <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          </div>
          <div>
            <Label>Native name</Label>
            <Input
              value={draft.nativeName}
              onChange={(e) => setDraft((d) => ({ ...d, nativeName: e.target.value }))}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <Label>Direction</Label>
              <Select
                value={draft.direction}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, direction: e.target.value as 'ltr' | 'rtl' }))
                }
                options={[
                  { value: 'ltr', label: 'Left-to-right' },
                  { value: 'rtl', label: 'Right-to-left' },
                ]}
              />
            </div>
            <div>
              <Label>Order</Label>
              <Input
                type="number"
                value={draft.order}
                onChange={(e) => setDraft((d) => ({ ...d, order: Number(e.target.value) || 0 }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))}
              />
              Active (visible to shoppers)
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={draft.isDefault}
                onChange={(e) => setDraft((d) => ({ ...d, isDefault: e.target.checked }))}
              />
              Default language
            </label>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
