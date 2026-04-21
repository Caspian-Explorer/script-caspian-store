'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useT } from '../i18n/locale-context';
import { useCaspianFirebase, useCaspianLink } from '../provider/caspian-store-provider';
import { getSiteSettings } from '../services/site-settings-service';
import { subscribeEmail } from '../services/subscriber-service';
import type { SiteSettings, SocialLink } from '../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useToast } from '../ui/toast';
import { SocialIcon } from './social-icon';

export interface SiteFooterLink {
  href: string;
  label: ReactNode;
}

export interface SiteFooterProps {
  /** Brand name fallback when `settings/site.brandName` is empty. */
  brandFallback?: string;
  aboutLinks?: SiteFooterLink[];
  customerCareLinks?: SiteFooterLink[];
  /** When true (default), shows the newsletter signup column. */
  showNewsletter?: boolean;
  /** Override the default social-icon renderer (e.g. swap in lucide icons). */
  renderSocialIcon?: (platform: string) => ReactNode;
  className?: string;
}

const DEFAULT_ABOUT: SiteFooterLink[] = [
  { href: '/about', label: 'About us' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/terms', label: 'Terms' },
];

const DEFAULT_CUSTOMER_CARE: SiteFooterLink[] = [
  { href: '/contact', label: 'Contact' },
  { href: '/shipping-returns', label: 'Shipping & returns' },
  { href: '/size-guide', label: 'Size guide' },
  { href: '/faqs', label: 'FAQs' },
];

export function SiteFooter({
  brandFallback = 'STORE',
  aboutLinks = DEFAULT_ABOUT,
  customerCareLinks = DEFAULT_CUSTOMER_CARE,
  showNewsletter = true,
  renderSocialIcon,
  className,
}: SiteFooterProps) {
  const t = useT();
  const Link = useCaspianLink();
  const { db } = useCaspianFirebase();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getSiteSettings(db)
      .then((s) => {
        if (!cancelled) setSettings(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [db]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      const result = await subscribeEmail(db, email.trim());
      toast({
        title: result === 'subscribed' ? t('footer.newsletter.success') : t('footer.newsletter.alreadySubscribed'),
      });
      setEmail('');
    } catch (error) {
      console.error('[caspian-store] Subscribe failed:', error);
      toast({ title: t('footer.newsletter.error'), variant: 'destructive' });
    } finally {
      setSubscribing(false);
    }
  };

  const brand = settings?.brandName?.trim() || brandFallback;
  const description = settings?.brandDescription?.trim() ?? '';
  const socialLinks: SocialLink[] = settings?.socialLinks ?? [];
  const renderIcon = renderSocialIcon ?? ((platform: string) => <SocialIcon platform={platform} />);

  return (
    <footer
      className={className}
      style={{
        background: 'var(--caspian-background, #fff)',
        borderTop: '1px solid #eee',
        color: 'inherit',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '64px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 40,
        }}
      >
        <div>
          <Link
            href="/"
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            {brand}
          </Link>
          {description && (
            <p style={{ marginTop: 16, fontSize: 14, color: '#666', maxWidth: 320 }}>
              {description}
            </p>
          )}
          {socialLinks.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
              {socialLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label || link.platform}
                  title={link.label || link.platform}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    border: '1px solid rgba(0,0,0,0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  {renderIcon(link.platform)}
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            {t('footer.about.title')}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {aboutLinks.map((item, i) => (
              <li key={i}>
                <Link
                  href={item.href}
                  style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
            {t('footer.customerCare.title')}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {customerCareLinks.map((item, i) => (
              <li key={i}>
                <Link
                  href={item.href}
                  style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {showNewsletter && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
              {t('footer.newsletter.title')}
            </p>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
              {t('footer.newsletter.description')}
            </p>
            <form onSubmit={handleSubscribe} style={{ display: 'flex', maxWidth: 320 }}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('footer.newsletter.placeholder')}
                required
                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
              />
              <Button
                type="submit"
                variant="outline"
                disabled={subscribing}
                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: 'none' }}
              >
                {subscribing ? '…' : '→'}
              </Button>
            </form>
          </div>
        )}
      </div>
    </footer>
  );
}
