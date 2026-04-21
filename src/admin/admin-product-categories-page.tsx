'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProductCategoryDoc } from '../types';
import {
  createCategory,
  deleteCategory,
  listAllCategories,
  updateCategory,
  type CategoryWriteInput,
} from '../services/category-service';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { Button } from '../ui/button';
import { Dialog } from '../ui/dialog';
import { Input, Label, Textarea } from '../ui/input';
import { Select } from '../ui/select';
import { Badge, Skeleton } from '../ui/misc';
import { Table, TBody, TD, TH, THead, TR } from '../ui/table';
import { useToast } from '../ui/toast';

function slugify(v: string) {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const emptyDraft: CategoryWriteInput = {
  name: '',
  slug: '',
  description: '',
  order: 0,
  isActive: true,
  isFeatured: false,
  imageUrl: '',
  parentId: null,
};

export function AdminProductCategoriesPage({ className }: { className?: string }) {
  const { db } = useCaspianFirebase();
  const { toast } = useToast();
  const [cats, setCats] = useState<ProductCategoryDoc[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CategoryWriteInput>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setCats(await listAllCategories(db));
    } catch (error) {
      console.error('[caspian-store] Failed to list categories:', error);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parentOptions = useMemo(
    () => [
      { value: '', label: '— None (top-level) —' },
      ...(cats ?? []).map((c) => ({ value: c.id, label: c.name })),
    ],
    [cats],
  );

  const openCreate = () => {
    setEditingId(null);
    setDraft({ ...emptyDraft, order: (cats?.length ?? 0) + 1 });
    setOpen(true);
  };

  const openEdit = (c: ProductCategoryDoc) => {
    setEditingId(c.id);
    setDraft({
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      order: c.order,
      isActive: c.isActive,
      isFeatured: c.isFeatured ?? false,
      imageUrl: c.imageUrl ?? '',
      parentId: c.parentId ?? null,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    const slug = draft.slug || slugify(draft.name);
    setSaving(true);
    try {
      if (editingId) {
        await updateCategory(db, editingId, { ...draft, slug });
        toast({ title: 'Category updated' });
      } else {
        await createCategory(db, { ...draft, slug });
        toast({ title: 'Category created' });
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

  const handleDelete = async (c: ProductCategoryDoc) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    try {
      await deleteCategory(db, c.id);
      setCats((prev) => (prev ? prev.filter((x) => x.id !== c.id) : prev));
      toast({ title: 'Category deleted' });
    } catch (error) {
      console.error('[caspian-store] Delete failed:', error);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const nameById = new Map<string, string>();
  (cats ?? []).forEach((c) => nameById.set(c.id, c.name));

  return (
    <div className={className}>
      <header
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Product categories</h1>
          <p style={{ color: '#666', marginTop: 4 }}>
            Supports parent/child hierarchy via the `parentId` field.
          </p>
        </div>
        <Button onClick={openCreate}>+ New category</Button>
      </header>

      {cats === null ? (
        <Skeleton style={{ height: 120 }} />
      ) : cats.length === 0 ? (
        <p style={{ color: '#888', padding: 32, textAlign: 'center' }}>No categories yet.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Order</TH>
              <TH>Name</TH>
              <TH>Slug</TH>
              <TH>Parent</TH>
              <TH>Status</TH>
              <TH style={{ textAlign: 'right' }}>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {cats.map((c) => (
              <TR key={c.id}>
                <TD style={{ fontFamily: 'monospace', fontSize: 13 }}>{c.order}</TD>
                <TD style={{ fontWeight: 500 }}>{c.name}</TD>
                <TD style={{ fontSize: 12, color: '#888', fontFamily: 'monospace' }}>{c.slug}</TD>
                <TD style={{ color: '#666' }}>
                  {c.parentId ? nameById.get(c.parentId) ?? '—' : '—'}
                </TD>
                <TD>
                  {c.isFeatured && <Badge variant="secondary">Featured</Badge>}{' '}
                  <Badge variant={c.isActive ? 'default' : 'secondary'}>
                    {c.isActive ? 'Active' : 'Hidden'}
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
        title={editingId ? 'Edit category' : 'New category'}
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
            <Label>Name</Label>
            <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
          </div>
          <div>
            <Label>Slug (leave blank to auto-generate)</Label>
            <Input value={draft.slug} onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={draft.description ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <Label>Parent category</Label>
              <Select
                value={draft.parentId ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, parentId: e.target.value || null }))}
                options={parentOptions.filter((o) => o.value !== editingId)}
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
          <div>
            <Label>Image URL (optional)</Label>
            <Input
              value={draft.imageUrl ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))}
              />
              Active
            </label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
              <input
                type="checkbox"
                checked={draft.isFeatured ?? false}
                onChange={(e) => setDraft((d) => ({ ...d, isFeatured: e.target.checked }))}
              />
              Featured (homepage)
            </label>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
