'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Product } from '../types';
import { deleteProduct, listAllProducts } from '../services/product-service';
import { useCaspianFirebase, useCaspianLink } from '../provider/caspian-store-provider';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge, Skeleton } from '../ui/misc';
import { useToast } from '../ui/toast';
import { Table, TBody, TD, TH, THead, TR } from '../ui/table';

export interface AdminProductsListProps {
  newProductHref?: string;
  getEditHref?: (productId: string) => string;
  formatPrice?: (n: number) => string;
  className?: string;
}

export function AdminProductsList({
  newProductHref = '/admin/products/new',
  getEditHref = (id) => `/admin/products/${id}/edit`,
  formatPrice = (n) => `$${n.toFixed(2)}`,
  className,
}: AdminProductsListProps) {
  const { db } = useCaspianFirebase();
  const Link = useCaspianLink();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listAllProducts(db);
      setProducts(list);
    } catch (error) {
      console.error('[caspian-store] Failed to load products:', error);
      toast({ title: 'Failed to load products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [db, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    setBusy(product.id);
    try {
      await deleteProduct(db, product.id);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast({ title: 'Product deleted' });
    } catch (error) {
      console.error('[caspian-store] Delete failed:', error);
      toast({ title: 'Delete failed', variant: 'destructive' });
    } finally {
      setBusy(null);
    }
  };

  const filtered = products.filter((p) => {
    if (!search) return true;
    const hay = `${p.name} ${p.brand} ${p.category}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  return (
    <div className={className}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Products</h1>
          <p style={{ color: '#666', marginTop: 4 }}>{products.length} in catalog</p>
        </div>
        <Link href={newProductHref}>
          <Button>+ New product</Button>
        </Link>
      </header>

      <div style={{ marginBottom: 16, maxWidth: 320 }}>
        <Input
          placeholder="Search by name, brand, or category…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton style={{ height: 40 }} />
          <Skeleton style={{ height: 40 }} />
          <Skeleton style={{ height: 40 }} />
        </div>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#888', padding: 32, textAlign: 'center' }}>No products match your search.</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Brand</TH>
              <TH>Category</TH>
              <TH>Price</TH>
              <TH>Status</TH>
              <TH style={{ textAlign: 'right' }}>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((p) => (
              <TR key={p.id}>
                <TD style={{ fontWeight: 500 }}>{p.name}</TD>
                <TD style={{ color: '#666' }}>{p.brand}</TD>
                <TD style={{ color: '#666' }}>{p.category}</TD>
                <TD>{formatPrice(p.price)}</TD>
                <TD>
                  <Badge variant={p.isActive === false ? 'secondary' : 'default'}>
                    {p.isActive === false ? 'Hidden' : 'Active'}
                  </Badge>
                </TD>
                <TD style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <Link href={getEditHref(p.id)}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busy === p.id}
                      onClick={() => handleDelete(p)}
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
    </div>
  );
}
