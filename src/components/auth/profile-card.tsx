'use client';

import { useState } from 'react';
import { useAuth } from '../../context/auth-context';
import { useCaspianFirebase } from '../../provider/caspian-store-provider';
import { updateDisplayName } from '../../services/user-service';
import { Button } from '../../ui/button';
import { Input, Label } from '../../ui/input';
import { useToast } from '../../ui/toast';

export function ProfileCard({ className }: { className?: string }) {
  const { user, userProfile, refreshProfile } = useAuth();
  const { db } = useCaspianFirebase();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(userProfile?.displayName ?? '');
  const [saving, setSaving] = useState(false);

  if (!user || !userProfile) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await updateDisplayName(db, user.uid, name.trim());
      await refreshProfile();
      toast({ title: 'Profile updated' });
      setEditing(false);
    } catch (error) {
      console.error('[caspian-store] Profile update failed:', error);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(userProfile.displayName);
    setEditing(false);
  };

  return (
    <section
      className={className}
      style={{ padding: 20, border: '1px solid #eee', borderRadius: 'var(--caspian-radius, 8px)' }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Profile</h2>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
      </header>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <Label>Display name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Row label="Display name" value={userProfile.displayName || '—'} />
          <Row label="Email" value={userProfile.email} />
        </div>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 14 }}>
      <span style={{ color: '#888' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
