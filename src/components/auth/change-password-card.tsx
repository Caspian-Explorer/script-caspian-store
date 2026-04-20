'use client';

import { useState } from 'react';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';
import { useAuth } from '../../context/auth-context';
import { useCaspianFirebase } from '../../provider/caspian-store-provider';
import { useT } from '../../i18n/locale-context';
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
  const t = useT();
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
      toast({ title: t('password.tooShort', { min: minPasswordLength }), variant: 'destructive' });
      return;
    }
    if (newPassword !== confirm) {
      toast({ title: t('password.mismatch'), variant: 'destructive' });
      return;
    }
    if (!user.email) {
      toast({ title: t('password.noEmail'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast({ title: t('password.updated') });
      reset();
    } catch (error) {
      console.error('[caspian-store] Password change failed:', error);
      const code = (error as { code?: string })?.code;
      toast({
        title: code === 'auth/wrong-password' ? t('password.wrongCurrent') : t('password.updateFailed'),
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
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{t('password.title')}</h2>
        {!open && !isGoogleAccount && (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            {t('password.change')}
          </Button>
        )}
      </header>

      {isGoogleAccount ? (
        <p style={{ fontSize: 14, color: '#666', margin: 0 }}>{t('password.googleHint')}</p>
      ) : open ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <Label>{t('password.current')}</Label>
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div>
            <Label>{t('password.new')}</Label>
            <Input
              type="password"
              autoComplete="new-password"
              minLength={minPasswordLength}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <Label>{t('password.confirmNew')}</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={reset} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {t('password.update')}
            </Button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: '#666', margin: 0 }}>{t('password.subtitle')}</p>
      )}
    </section>
  );
}
