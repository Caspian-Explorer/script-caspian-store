'use client';

import { useState, type FormEvent } from 'react';
import type { UserAddress } from '../../types';
import { useAuth } from '../../context/auth-context';
import { useCaspianFirebase } from '../../provider/caspian-store-provider';
import {
  addAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from '../../services/user-service';
import { Button } from '../../ui/button';
import { Input, Label } from '../../ui/input';
import { Badge } from '../../ui/misc';
import { Dialog } from '../../ui/dialog';
import { useToast } from '../../ui/toast';

const emptyAddress: Omit<UserAddress, 'id'> = {
  name: '',
  address: '',
  city: '',
  zip: '',
  country: '',
  isDefault: false,
};

export function AddressBook({ className }: { className?: string }) {
  const { user, userProfile, refreshProfile } = useAuth();
  const { db } = useCaspianFirebase();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserAddress | null>(null);
  const [form, setForm] = useState<Omit<UserAddress, 'id'>>(emptyAddress);
  const [saving, setSaving] = useState(false);

  if (!user || !userProfile) return null;

  const addresses = userProfile.addresses ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(emptyAddress);
    setDialogOpen(true);
  };

  const openEdit = (addr: UserAddress) => {
    setEditing(addr);
    setForm({
      name: addr.name,
      address: addr.address,
      city: addr.city,
      zip: addr.zip,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await updateAddress(db, user.uid, { ...editing, ...form });
        toast({ title: 'Address updated' });
      } else {
        await addAddress(db, user.uid, form);
        toast({ title: 'Address added' });
      }
      await refreshProfile();
      setDialogOpen(false);
    } catch (error) {
      console.error('[caspian-store] Save address failed:', error);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addr: UserAddress) => {
    if (!confirm(`Delete address "${addr.name}"?`)) return;
    try {
      await deleteAddress(db, user.uid, addr.id);
      await refreshProfile();
      toast({ title: 'Address deleted' });
    } catch (error) {
      console.error('[caspian-store] Delete address failed:', error);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const handleSetDefault = async (addr: UserAddress) => {
    try {
      await setDefaultAddress(db, user.uid, addr.id);
      await refreshProfile();
      toast({ title: 'Default address updated' });
    } catch (error) {
      console.error('[caspian-store] Set default failed:', error);
      toast({ title: 'Action failed', variant: 'destructive' });
    }
  };

  return (
    <section
      className={className}
      style={{ padding: 20, border: '1px solid #eee', borderRadius: 'var(--caspian-radius, 8px)' }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Addresses</h2>
        <Button variant="outline" size="sm" onClick={openCreate}>
          + Add address
        </Button>
      </header>

      {addresses.length === 0 ? (
        <p style={{ color: '#888', fontSize: 14, padding: '16px 0', margin: 0 }}>
          No addresses yet. Add one for faster checkout.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {addresses.map((addr) => (
            <li
              key={addr.id}
              style={{
                padding: 12,
                border: '1px solid #eee',
                borderRadius: 'var(--caspian-radius, 6px)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ margin: 0, fontWeight: 500 }}>{addr.name}</p>
                  {addr.isDefault && <Badge variant="secondary">Default</Badge>}
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#555', lineHeight: 1.4 }}>
                  {addr.address}
                  <br />
                  {addr.city} {addr.zip}
                  <br />
                  {addr.country}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                {!addr.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => handleSetDefault(addr)}>
                    Set default
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => openEdit(addr)}>
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(addr)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Edit address' : 'Add address'}
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave as unknown as () => void} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <Label>Full name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} required />
            </div>
            <div>
              <Label>ZIP</Label>
              <Input value={form.zip} onChange={(e) => setForm((f) => ({ ...f, zip: e.target.value }))} required />
            </div>
          </div>
          <div>
            <Label>Country</Label>
            <Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} required />
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            Set as default address
          </label>
        </form>
      </Dialog>
    </section>
  );
}
