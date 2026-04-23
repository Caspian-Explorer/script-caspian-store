'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProductCategoryDoc, ProductImage } from '../types';
import {
  createProduct,
  getProductById,
  updateProduct,
  type ProductWriteInput,
} from '../services/product-service';
import { listAllCategories } from '../services/category-service';
import { useCaspianFirebase, useCaspianNavigation } from '../provider/caspian-store-provider';
import { Button } from '../ui/button';
import { ImageUploadField } from '../ui/image-upload-field';
import { Input, Label, Textarea } from '../ui/input';
import { Skeleton } from '../ui/misc';
import { RichTextEditor } from '../ui/rich-text-editor';
import { Select } from '../ui/select';
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
  shortDescription: string;
  /** Rich-text HTML produced by `<RichTextEditor>`. Sanitized on render. */
  details: string;
  price: string;
  /** Category document id (not the display name). */
  category: string;
  sizes: string; // comma-separated
  /**
   * Per-size stock counts as input strings (so the field can render an empty value).
   * Coerced to integers on save and persisted to `Product.stock`. Added in v2.9.
   */
  sizeStock: Record<string, string>;
  color: string;
  /** Weight in kg as a string so the input can render an empty field; coerced on save. */
  weightKg: string;
  isNew: boolean;
  limited: boolean;
  isActive: boolean;
  images: ProductImage[];
}

const empty: FormState = {
  name: '',
  brand: '',
  description: '',
  shortDescription: '',
  details: '',
  price: '0',
  category: '',
  sizes: '',
  sizeStock: {},
  color: '',
  weightKg: '',
  isNew: false,
  limited: false,
  isActive: true,
  images: [],
};

function parseSizeList(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Fixed palette of named product colors. Keep in sync with the storefront
 * swatch rendering if you add custom renderers. If you need brand-specific
 * colors later, swap this for a Firestore-backed `productColors` collection.
 */
const COLOR_PALETTE = [
  'Black',
  'White',
  'Red',
  'Blue',
  'Green',
  'Yellow',
  'Pink',
  'Purple',
  'Orange',
  'Brown',
  'Grey',
  'Beige',
  'Multi',
] as const;

const COLOR_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '— No color —' },
  ...COLOR_PALETTE.map((c) => ({ value: c, label: c })),
];

/**
 * Accepts a legacy stored color string (any case) and returns the matching
 * palette entry, or `''` if it doesn't match. Callers should still render the
 * legacy value in a small hint if non-empty but unmatched.
 */
function normalizeLegacyColor(raw: string): string {
  if (!raw) return '';
  const match = COLOR_PALETTE.find(
    (c) => c.toLowerCase() === raw.toLowerCase(),
  );
  return match ?? '';
}

/**
 * Builds category Select options indented by depth via an em-dash prefix.
 * Example: `"Shoes"`, `"— Sneakers"`, `"—— Low-top"`. Inactive categories
 * are surfaced because admins need to reassign products off of them.
 */
function buildCategoryOptions(
  categories: ProductCategoryDoc[],
): { value: string; label: string }[] {
  const byParent = new Map<string, ProductCategoryDoc[]>();
  for (const cat of categories) {
    const key = cat.parentId ?? '__root__';
    const list = byParent.get(key) ?? [];
    list.push(cat);
    byParent.set(key, list);
  }
  for (const [, list] of byParent) list.sort((a, b) => a.order - b.order);

  const out: { value: string; label: string }[] = [
    { value: '', label: '— Uncategorised —' },
  ];
  const walk = (parentKey: string, depth: number) => {
    const children = byParent.get(parentKey) ?? [];
    for (const cat of children) {
      const prefix = depth === 0 ? '' : '— '.repeat(depth);
      const inactiveTag = cat.isActive === false ? ' (hidden)' : '';
      out.push({ value: cat.id, label: `${prefix}${cat.name}${inactiveTag}` });
      walk(cat.id, depth + 1);
    }
  };
  walk('__root__', 0);
  return out;
}

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
  const [categories, setCategories] = useState<ProductCategoryDoc[]>([]);
  const [legacyColor, setLegacyColor] = useState<string>('');
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await listAllCategories(db);
        if (alive) setCategories(list);
      } catch (error) {
        console.error('[caspian-store] Failed to load categories:', error);
      }
    })();
    return () => {
      alive = false;
    };
  }, [db]);

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
        const normalizedColor = normalizeLegacyColor(p.color ?? '');
        if (!normalizedColor && p.color) setLegacyColor(p.color);
        const sizeList = p.sizes ?? [];
        const sizeStock: Record<string, string> = {};
        for (const size of sizeList) {
          const qty = p.stock?.[size];
          sizeStock[size] = qty === undefined ? '' : String(qty);
        }
        setForm({
          name: p.name,
          brand: p.brand,
          description: p.description,
          shortDescription: p.shortDescription ?? '',
          details: p.details ?? '',
          price: String(p.price),
          category: p.category,
          sizes: sizeList.join(', '),
          sizeStock,
          color: normalizedColor,
          weightKg: p.weightKg !== undefined ? String(p.weightKg) : '',
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

  const categoryOptions = useMemo(
    () => buildCategoryOptions(categories),
    [categories],
  );

  const legacyCategoryUnknown =
    productId &&
    form.category &&
    categories.length > 0 &&
    !categories.some((c) => c.id === form.category);

  const handleAddImageUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;
    const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setForm((s) => ({
      ...s,
      images: [...s.images, { id, url: trimmed, alt: s.name, hint: s.name }],
    }));
  };

  const handleAddUrlClick = () => {
    if (!newImageUrl.trim()) return;
    handleAddImageUrl(newImageUrl);
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
      const weightTrimmed = form.weightKg.trim();
      let weightKg: number | undefined;
      if (weightTrimmed !== '') {
        const parsed = Number(weightTrimmed);
        if (!Number.isFinite(parsed) || parsed < 0) {
          toast({ title: 'Enter a valid weight (kg)', variant: 'destructive' });
          setSaving(false);
          return;
        }
        weightKg = parsed;
      }
      const shortDescTrimmed = form.shortDescription.trim();
      const detailsTrimmed = form.details.trim();
      const cleanSizes = parseSizeList(form.sizes);
      // Persist stock entries only for sizes that actually exist on the product,
      // so stale rows can't pile up after sizes are renamed/removed.
      const stockMap: Record<string, number> = {};
      let hasAnyStock = false;
      for (const size of cleanSizes) {
        const raw = (form.sizeStock[size] ?? '').trim();
        if (raw === '') continue;
        const qty = Math.max(0, Math.floor(Number(raw)));
        if (Number.isFinite(qty)) {
          stockMap[size] = qty;
          hasAnyStock = true;
        }
      }
      const payload: ProductWriteInput = {
        name: form.name.trim(),
        brand: form.brand.trim(),
        description: form.description.trim(),
        shortDescription: shortDescTrimmed || undefined,
        details: detailsTrimmed || undefined,
        price: priceNum,
        category: form.category,
        sizes: cleanSizes,
        stock: hasAnyStock ? stockMap : undefined,
        color: form.color,
        weightKg,
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
        <Field label="Short description (PDP hero blurb)">
          <Textarea
            rows={2}
            placeholder="Punchy 1–3 line pitch shown above Add to Cart. Falls back to the first paragraph of Description when empty."
            value={form.shortDescription}
            onChange={(e) => setForm((s) => ({ ...s, shortDescription: e.target.value }))}
            maxLength={280}
          />
        </Field>
        <Field label="Details (bullets, specs, dimensions)">
          <RichTextEditor
            value={form.details}
            onChange={(html) => setForm((s) => ({ ...s, details: html }))}
            placeholder="Dimensions, materials, finish, compatibility, care instructions — use the bullet button to list specs."
            ariaLabel="Product details"
            minHeight={140}
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
          <Field label="Weight (kg)">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.weightKg}
              onChange={(e) => setForm((s) => ({ ...s, weightKg: e.target.value }))}
              placeholder="Leave blank unless using weight-based shipping"
            />
          </Field>
        </div>
        <div style={gridStyle}>
          <Field label="Category">
            <Select
              value={form.category}
              onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
              options={categoryOptions}
              style={{ width: '100%' }}
            />
            {legacyCategoryUnknown && (
              <p style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>
                Stored category <code>{form.category}</code> doesn&apos;t match any known
                category. Pick one from the list and save to migrate this product.
              </p>
            )}
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
            <Select
              value={form.color}
              onChange={(e) => setForm((s) => ({ ...s, color: e.target.value }))}
              options={COLOR_OPTIONS}
              style={{ width: '100%' }}
            />
            {legacyColor && (
              <p style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>
                Stored color <code>{legacyColor}</code> isn&apos;t in the palette. Pick
                the closest match from the list and save to normalise.
              </p>
            )}
          </Field>
        </div>
        <ProductStockGrid
          sizes={parseSizeList(form.sizes)}
          values={form.sizeStock}
          onChange={(size, value) =>
            setForm((s) => ({ ...s, sizeStock: { ...s.sizeStock, [size]: value } }))
          }
        />
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Check label="New arrival" checked={form.isNew} onChange={(v) => setForm((s) => ({ ...s, isNew: v }))} />
          <Check label="Limited edition" checked={form.limited} onChange={(v) => setForm((s) => ({ ...s, limited: v }))} />
          <Check label="Active (visible in store)" checked={form.isActive} onChange={(v) => setForm((s) => ({ ...s, isActive: v }))} />
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={h2Style}>Images</h2>
        <p style={{ margin: '0 0 12px', color: '#666', fontSize: 13 }}>
          Upload new images or paste a URL. Files land under <code>products/{productId ?? 'new'}/</code>
          in Firebase Storage.
        </p>
        {form.images.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: 8,
              marginBottom: 12,
            }}
          >
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
        )}
        <ImageUploadField
          value=""
          onChange={handleAddImageUrl}
          storagePath={`products/${productId ?? 'new'}`}
          label={form.images.length === 0 ? 'First image' : 'Add another image'}
          aspectRatio="3 / 4"
          previewMaxWidth={180}
        />
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Label style={{ fontSize: 12, color: '#666' }}>or paste image URL</Label>
            <Input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddUrlClick();
                }
              }}
              placeholder="https://…"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddUrlClick}
            disabled={!newImageUrl.trim()}
          >
            Add URL
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

function ProductStockGrid({
  sizes,
  values,
  onChange,
}: {
  sizes: string[];
  values: Record<string, string>;
  onChange: (size: string, value: string) => void;
}) {
  if (sizes.length === 0) {
    return (
      <Field label="Stock per size">
        <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
          Add at least one size above to track stock per size.
        </p>
      </Field>
    );
  }
  return (
    <Field label="Stock per size">
      <p style={{ fontSize: 13, color: '#666', margin: '0 0 8px' }}>
        Number of units available for each size. Leave blank to mark a size as untracked
        (always available).
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 8,
        }}
      >
        {sizes.map((size) => (
          <label
            key={size}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 'var(--caspian-radius, 6px)',
              padding: '6px 10px',
              background: '#fff',
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#444',
                minWidth: 32,
              }}
            >
              {size}
            </span>
            <Input
              type="number"
              min={0}
              value={values[size] ?? ''}
              placeholder="—"
              onChange={(e) => onChange(size, e.target.value)}
              style={{ flex: 1 }}
            />
          </label>
        ))}
      </div>
    </Field>
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
