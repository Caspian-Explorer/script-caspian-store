'use client';

import { useEffect, useState } from 'react';
import type { ProductImage } from '../types';
import {
  createProduct,
  getProductById,
  updateProduct,
  type ProductWriteInput,
} from '../services/product-service';
import { useCaspianFirebase, useCaspianNavigation } from '../provider/caspian-store-provider';
import { Button } from '../ui/button';
import { Input, Label, Textarea } from '../ui/input';
import { Skeleton } from '../ui/misc';
import { useToast } from '../ui/toast';

export interface AdminProductEditorProps {
  /** Pass a product id to edit an existing product. Omit to create. */
  productId?: string;
  /** Where to go after save. Default: `/admin/products`. */
  afterSaveHref?: string;
  className?: string;
}

interface FormState {
  name: string;
  brand: string;
  description: string;
  price: string;
  category: string;
  sizes: string; // comma-separated
  color: string;
  isNew: boolean;
  limited: boolean;
  isActive: boolean;
  images: ProductImage[];
}

const empty: FormState = {
  name: '',
  brand: '',
  description: '',
  price: '0',
  category: '',
  sizes: '',
  color: '',
  isNew: false,
  limited: false,
  isActive: true,
  images: [],
};

export function AdminProductEditor({
  productId,
  afterSaveHref = '/admin/products',
  className,
}: AdminProductEditorProps) {
  const { db } = useCaspianFirebase();
  const nav = useCaspianNavigation();
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    if (!productId) return;
    let alive = true;
    (async () => {
      try {
        const p = await getProductById(db, productId);
        if (!alive) return;
        if (!p) {
          toast({ title: 'Product not found', variant: 'destructive' });
          return;
        }
        setForm({
          name: p.name,
          brand: p.brand,
          description: p.description,
          price: String(p.price),
          category: p.category,
          sizes: (p.sizes ?? []).join(', '),
          color: p.color ?? '',
          isNew: Boolean(p.isNew),
          limited: Boolean(p.limited),
          isActive: p.isActive !== false,
          images: p.images,
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [db, productId, toast]);

  const handleAddImage = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setForm((s) => ({
      ...s,
      images: [...s.images, { id, url, alt: s.name, hint: s.name }],
    }));
    setNewImageUrl('');
  };

  const handleRemoveImage = (id: string) => {
    setForm((s) => ({ ...s, images: s.images.filter((img) => img.id !== id) }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.brand.trim()) {
      toast({ title: 'Name and brand are required', variant: 'destructive' });
      return;
    }
    const priceNum = Number(form.price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      toast({ title: 'Enter a valid price', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload: ProductWriteInput = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        description: form.description.trim(),
        price: priceNum,
        category: form.category.trim(),
        sizes: form.sizes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        color: form.color.trim(),
        isNew: form.isNew,
        limited: form.limited,
        isActive: form.isActive,
        images: form.images,
      };
      if (productId) {
        await updateProduct(db, productId, payload);
        toast({ title: 'Product updated' });
      } else {
        await createProduct(db, payload);
        toast({ title: 'Product created' });
      }
      nav.push(afterSaveHref);
    } catch (error) {
      console.error('[caspian-store] Save failed:', error);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skeleton style={{ height: 24, width: 200 }} />
        <Skeleton style={{ height: 14, width: '100%' }} />
        <Skeleton style={{ height: 14, width: '80%' }} />
      </div>
    );
  }

  return (
    <div className={className} style={{ maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
        {productId ? 'Edit product' : 'New product'}
      </h1>

      <section style={sectionStyle}>
        <div style={gridStyle}>
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            />
          </Field>
          <Field label="Brand">
            <Input
              value={form.brand}
              onChange={(e) => setForm((s) => ({ ...s, brand: e.target.value }))}
            />
          </Field>
        </div>
        <Field label="Description">
          <Textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
          />
        </Field>
        <div style={gridStyle}>
          <Field label="Price">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.price}
              onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
            />
          </Field>
          <Field label="Category">
            <Input
              value={form.category}
              onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
            />
          </Field>
        </div>
        <div style={gridStyle}>
          <Field label="Sizes (comma-separated)">
            <Input
              value={form.sizes}
              onChange={(e) => setForm((s) => ({ ...s, sizes: e.target.value }))}
              placeholder="S, M, L, XL"
            />
          </Field>
          <Field label="Color">
            <Input
              value={form.color}
              onChange={(e) => setForm((s) => ({ ...s, color: e.target.value }))}
            />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Check label="New arrival" checked={form.isNew} onChange={(v) => setForm((s) => ({ ...s, isNew: v }))} />
          <Check label="Limited edition" checked={form.limited} onChange={(v) => setForm((s) => ({ ...s, limited: v }))} />
          <Check label="Active (visible in store)" checked={form.isActive} onChange={(v) => setForm((s) => ({ ...s, isActive: v }))} />
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Images</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 12 }}>
          {form.images.map((img) => (
            <div
              key={img.id}
              style={{
                position: 'relative',
                aspectRatio: '3 / 4',
                background: '#f5f5f5',
                borderRadius: 6,
                overflow: 'hidden',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => handleRemoveImage(img.id)}
                aria-label="Remove image"
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: 0,
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Input
            placeholder="Image URL…"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
          />
          <Button variant="outline" onClick={handleAddImage}>
            Add
          </Button>
        </div>
      </section>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button variant="outline" onClick={() => nav.push(afterSaveHref)} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving}>
          {saving ? 'Saving…' : productId ? 'Save changes' : 'Create product'}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

const sectionStyle: React.CSSProperties = {
  padding: 16,
  border: '1px solid #eee',
  borderRadius: 'var(--caspian-radius, 8px)',
  marginTop: 16,
  marginBottom: 16,
};
const h2Style: React.CSSProperties = { fontSize: 16, fontWeight: 600, margin: 0, marginBottom: 12 };
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };
