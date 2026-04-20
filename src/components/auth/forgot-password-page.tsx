'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/auth-context';
import { useCaspianLink } from '../../provider/caspian-store-provider';
import { Button } from '../../ui/button';
import { Input, Label } from '../../ui/input';
import { useToast } from '../../ui/toast';

export interface ForgotPasswordPageProps {
  loginHref?: string;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function ForgotPasswordPage({
  loginHref = '/login',
  title = 'Reset your password',
  subtitle = 'Enter your email and we\'ll send a reset link.',
  className,
}: ForgotPasswordPageProps) {
  const { resetPassword } = useAuth();
  const Link = useCaspianLink();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (error) {
      console.error('[caspian-store] Password reset failed:', error);
      toast({ title: 'Reset failed', description: 'Please check the email address.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={className} style={{ maxWidth: 420, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{title}</h1>
        <p style={{ color: '#666', marginTop: 4 }}>{subtitle}</p>
      </header>

      {sent ? (
        <div
          style={{
            padding: 16,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 'var(--caspian-radius, 6px)',
          }}
        >
          <p style={{ margin: 0, fontWeight: 600, color: '#166534' }}>Check your inbox</p>
          <p style={{ margin: '4px 0 0', color: '#166534', fontSize: 14 }}>
            We sent a password reset link to {email}.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <Label htmlFor="fp-email">Email address</Label>
            <Input
              id="fp-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" loading={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}

      <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
        <Link href={loginHref}>Back to sign in</Link>
      </p>
    </div>
  );
}
