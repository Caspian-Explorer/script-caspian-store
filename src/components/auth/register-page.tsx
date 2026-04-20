'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/auth-context';
import { useCaspianLink, useCaspianNavigation } from '../../provider/caspian-store-provider';
import { useT } from '../../i18n/locale-context';
import { Button } from '../../ui/button';
import { Input, Label } from '../../ui/input';
import { Separator } from '../../ui/misc';
import { useToast } from '../../ui/toast';

export interface RegisterPageProps {
  redirectTo?: string;
  loginHref?: string;
  title?: string;
  subtitle?: string;
  /** Minimum password length. Default: 8. */
  minPasswordLength?: number;
  className?: string;
}

export function RegisterPage({
  redirectTo = '/account',
  loginHref = '/login',
  title,
  subtitle,
  minPasswordLength = 8,
  className,
}: RegisterPageProps) {
  const { signUp, signInWithGoogle } = useAuth();
  const nav = useCaspianNavigation();
  const Link = useCaspianLink();
  const { toast } = useToast();
  const t = useT();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast({ title: t('auth.register.nameRequired'), variant: 'destructive' });
      return;
    }
    if (password.length < minPasswordLength) {
      toast({
        title: t('auth.register.passwordTooShort', { min: minPasswordLength }),
        variant: 'destructive',
      });
      return;
    }
    if (password !== confirm) {
      toast({ title: t('auth.register.passwordMismatch'), variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email, password, displayName.trim());
      nav.push(redirectTo);
    } catch (error) {
      console.error('[caspian-store] Sign-up failed:', error);
      const msg = error instanceof Error ? error.message : t('auth.register.failed');
      toast({ title: t('auth.register.failed'), description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle();
      nav.push(redirectTo);
    } catch (error) {
      console.error('[caspian-store] Google sign-in failed:', error);
      toast({ title: t('auth.register.failed'), variant: 'destructive' });
      setSubmitting(false);
    }
  };

  return (
    <div className={className} style={{ maxWidth: 420, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{title ?? t('auth.register.title')}</h1>
        <p style={{ color: '#666', marginTop: 4 }}>{subtitle ?? t('auth.register.subtitle')}</p>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <Label htmlFor="reg-name">{t('auth.register.name')}</Label>
          <Input
            id="reg-name"
            autoComplete="name"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="reg-email">{t('auth.login.email')}</Label>
          <Input
            id="reg-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="reg-password">{t('auth.login.password')}</Label>
          <Input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={minPasswordLength}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="reg-confirm">{t('auth.register.confirmPassword')}</Label>
          <Input
            id="reg-confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" loading={submitting}>
          {submitting ? t('auth.register.submitting') : t('auth.register.submit')}
        </Button>
      </form>

      <Separator />

      <Button variant="outline" size="lg" onClick={handleGoogle} disabled={submitting} style={{ width: '100%' }}>
        {t('auth.login.googleCta')}
      </Button>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
        {t('auth.register.hasAccount')} <Link href={loginHref}>{t('auth.register.signIn')}</Link>
      </p>
    </div>
  );
}
