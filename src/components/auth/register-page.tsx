'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/auth-context';
import { useCaspianLink, useCaspianNavigation } from '../../provider/caspian-store-provider';
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
  title = 'Create your account',
  subtitle = 'A quick sign-up lets you track orders and save favorites.',
  minPasswordLength = 8,
  className,
}: RegisterPageProps) {
  const { signUp, signInWithGoogle } = useAuth();
  const nav = useCaspianNavigation();
  const Link = useCaspianLink();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast({ title: 'Please enter your name', variant: 'destructive' });
      return;
    }
    if (password.length < minPasswordLength) {
      toast({ title: `Password must be at least ${minPasswordLength} characters`, variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await signUp(email, password, displayName.trim());
      nav.push(redirectTo);
    } catch (error) {
      console.error('[caspian-store] Sign-up failed:', error);
      const msg = error instanceof Error ? error.message : 'Sign-up failed';
      toast({ title: 'Sign-up failed', description: msg, variant: 'destructive' });
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
      toast({ title: 'Google sign-in failed', variant: 'destructive' });
      setSubmitting(false);
    }
  };

  return (
    <div className={className} style={{ maxWidth: 420, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{title}</h1>
        <p style={{ color: '#666', marginTop: 4 }}>{subtitle}</p>
      </header>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <Label htmlFor="reg-name">Full name</Label>
          <Input
            id="reg-name"
            autoComplete="name"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="reg-email">Email</Label>
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
          <Label htmlFor="reg-password">Password</Label>
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
          <Label htmlFor="reg-confirm">Confirm password</Label>
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
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <Separator />

      <Button variant="outline" size="lg" onClick={handleGoogle} disabled={submitting} style={{ width: '100%' }}>
        Continue with Google
      </Button>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
        Already have an account? <Link href={loginHref}>Sign in</Link>
      </p>
    </div>
  );
}
