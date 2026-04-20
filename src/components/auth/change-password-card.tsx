'use client';

import { useState } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { useAuth } from '../../context/auth-context';
import { useCaspianFirebase } from '../../provider/caspian-store-provider';
import { Button } from '../../ui/button';
import { Input, Label } from '../../ui/input';
import { useToast } from '../../ui/toast';

export function ChangePasswordCard({
  minPasswordLength = 8,
  className,
}: {
  minPasswordLength?: number;
  className?: string;
}) {
  const { user } = useAuth();
  const { auth } = useCaspianFirebase();
  const { toast } = useToast();
  const [currentPassword, setCurrent] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const isGoogleAccount = user.providerData.some((p) => p.providerId === 'google.com');

  const reset = () => {
    setCurrent('');
    setNewPassword('');
    setConfirm('');
    setOpen(false);
  };

  const handleSave = async () => {
    if (newPassword.length < minPasswordLength) {
      toast({ title: `Password must be at least ${minPasswordLength} characters`, variant: 'destructive' });
      return;
    }
    if (newPassword !== confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (!user.email) {
      toast({ title: 'No email associated with this account', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast({ title: 'Password updated' });
      reset();
    } catch (error) {
      console.error('[caspian-store] Password change failed:', error);
      const code = (error as { code?: string })?.code;
      toast({
        title: code === 'auth/wrong-password' ? 'Current password is incorrect' : 'Password change failed',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  // Reuse the auth instance to silence unused-import warnings while tree-shaking.
  void auth;

  return (
    <section
      className={className}
      style={{ padding: 20, border: '1px solid #eee', borderRadius: 'var(--caspian-radius, 8px)' }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Password</h2>
        {!open && !isGoogleAccount && (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Change
          </Button>
        )}
      </header>

      {isGoogleAccount ? (
        <p style={{ fontSize: 14, color: '#666', margin: 0 }}>
          You signed in with Google — manage your password in your Google account.
        </p>
      ) : open ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <Label>Current password</Label>
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div>
            <Label>New password</Label>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={minPasswordLength}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <Label>Confirm new password</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={reset} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Update password
            </Button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: '#666', margin: 0 }}>Change your sign-in password.</p>
      )}
    </section>
  );
}
