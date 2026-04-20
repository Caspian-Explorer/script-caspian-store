'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/auth-context';
import { useCaspianLink, useCaspianNavigation } from '../../provider/caspian-store-provider';
import { Button } from '../../ui/button';
import { Input, Label } from '../../ui/input';
import { Separator } from '../../ui/misc';
import { useToast } from '../../ui/toast';

export interface LoginPageProps {
  /** Path to redirect to after successful sign-in. Default: `/account`. */
  redirectTo?: string;
  registerHref?: string;
  forgotPasswordHref?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function LoginPage({
  redirectTo = '/account',
  registerHref = '/register',
  forgotPasswordHref = '/forgot-password',
  title = 'Sign in',
  subtitle = 'Welcome back. Sign in to continue.',
  className,
}: LoginPageProps) {
  const { signIn, signInWithGoogle } = useAuth();
  const nav = useCaspianNavigation();
  const Link = useCaspianLink();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password, rememberMe);
      nav.push(redirectTo);
    } catch (error) {
      console.error('[caspian-store] Sign-in failed:', error);
      toast({ title: 'Sign-in failed', description: 'Check your email and password.', variant: 'destructive' });
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
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>
          <Link href={forgotPasswordHref}>Forgot password?</Link>
        </div>
        <Button type="submit" size="lg" loading={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <Separator />

      <Button variant="outline" size="lg" onClick={handleGoogle} disabled={submitting} style={{ width: '100%' }}>
        Continue with Google
      </Button>

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#666' }}>
        Don't have an account? <Link href={registerHref}>Create one</Link>
      </p>
    </div>
  );
}
