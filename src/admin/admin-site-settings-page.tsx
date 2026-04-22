'use client';

import { useEffect, useMemo, useState } from 'react';
import type { SiteSettings, SocialLink, SocialPlatform } from '../types';
import { SOCIAL_PLATFORMS } from '../types';
import { getSiteSettings, saveSiteSettings } from '../services/site-settings-service';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { SocialIcon } from '../components/social-icon';
import { Button } from '../ui/button';
import { ImageUploadField } from '../ui/image-upload-field';
import { Input, Label, Textarea } from '../ui/input';
import { Skeleton } from '../ui/misc';
import { Select } from '../ui/select';
import { useToast } from '../ui/toast';

const emptySettings: SiteSettings = {
  logoUrl: '',
  faviconUrl: '',
  brandName: '',
  brandDescription: '',
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  businessHours: '',
  currency: '',
  timezone: '',
  country: '',
  socialLinks: [],
};

/** Most-used ISO 4217 codes. Free-text fallback available via "Other". */
const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '— Select currency —' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'JPY', label: 'JPY — Japanese Yen' },
  { value: 'CAD', label: 'CAD — Canadian Dollar' },
  { value: 'AUD', label: 'AUD — Australian Dollar' },
  { value: 'CHF', label: 'CHF — Swiss Franc' },
  { value: 'CNY', label: 'CNY — Chinese Yuan' },
  { value: 'HKD', label: 'HKD — Hong Kong Dollar' },
  { value: 'SGD', label: 'SGD — Singapore Dollar' },
  { value: 'INR', label: 'INR — Indian Rupee' },
  { value: 'BRL', label: 'BRL — Brazilian Real' },
  { value: 'MXN', label: 'MXN — Mexican Peso' },
  { value: 'SEK', label: 'SEK — Swedish Krona' },
  { value: 'NOK', label: 'NOK — Norwegian Krone' },
  { value: 'DKK', label: 'DKK — Danish Krone' },
  { value: 'PLN', label: 'PLN — Polish Złoty' },
  { value: 'CZK', label: 'CZK — Czech Koruna' },
  { value: 'TRY', label: 'TRY — Turkish Lira' },
  { value: 'ZAR', label: 'ZAR — South African Rand' },
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'SAR', label: 'SAR — Saudi Riyal' },
  { value: 'NZD', label: 'NZD — New Zealand Dollar' },
  { value: 'KRW', label: 'KRW — South Korean Won' },
  { value: 'THB', label: 'THB — Thai Baht' },
  { value: 'MYR', label: 'MYR — Malaysian Ringgit' },
  { value: 'IDR', label: 'IDR — Indonesian Rupiah' },
  { value: 'PHP', label: 'PHP — Philippine Peso' },
];

/** ISO 3166-1 alpha-2 subset — the 40 most common storefront countries. */
const COUNTRY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '— Select country —' },
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'IE', label: 'Ireland' },
  { value: 'AU', label: 'Australia' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ES', label: 'Spain' },
  { value: 'IT', label: 'Italy' },
  { value: 'PT', label: 'Portugal' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'BE', label: 'Belgium' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'AT', label: 'Austria' },
  { value: 'SE', label: 'Sweden' },
  { value: 'NO', label: 'Norway' },
  { value: 'DK', label: 'Denmark' },
  { value: 'FI', label: 'Finland' },
  { value: 'PL', label: 'Poland' },
  { value: 'CZ', label: 'Czech Republic' },
  { value: 'GR', label: 'Greece' },
  { value: 'TR', label: 'Türkiye' },
  { value: 'RO', label: 'Romania' },
  { value: 'HU', label: 'Hungary' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'HK', label: 'Hong Kong SAR' },
  { value: 'KR', label: 'South Korea' },
  { value: 'SG', label: 'Singapore' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'TH', label: 'Thailand' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'PH', label: 'Philippines' },
  { value: 'IN', label: 'India' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'IL', label: 'Israel' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'AR', label: 'Argentina' },
  { value: 'CL', label: 'Chile' },
];

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  twitter: 'Twitter',
  x: 'X',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  pinterest: 'Pinterest',
};

function supportedTimezones(): string[] {
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: 'timeZone') => string[];
  };
  if (typeof intl.supportedValuesOf === 'function') {
    try {
      return intl.supportedValuesOf('timeZone');
    } catch {
      /* fall through */
    }
  }
  return [
    'UTC',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Europe/Rome',
    'Europe/Amsterdam',
    'Europe/Stockholm',
    'Europe/Warsaw',
    'Europe/Istanbul',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'America/Vancouver',
    'America/Mexico_City',
    'America/Sao_Paulo',
    'America/Buenos_Aires',
    'Asia/Dubai',
    'Asia/Tel_Aviv',
    'Asia/Kolkata',
    'Asia/Bangkok',
    'Asia/Singapore',
    'Asia/Hong_Kong',
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Australia/Sydney',
    'Pacific/Auckland',
  ];
}

export function AdminSiteSettingsPage({ className }: { className?: string }) {
  const { db } = useCaspianFirebase();
  const { toast } = useToast();
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

  const timezoneOptions = useMemo(
    () => [
      { value: '', label: '— Select timezone —' },
      ...supportedTimezones().map((tz) => ({ value: tz, label: tz })),
    ],
    [],
  );

  useEffect(() => {
    (async () => {
      try {
        const existing = await getSiteSettings(db);
        setDraft(existing ?? emptySettings);
      } catch (error) {
        console.error('[caspian-store] Failed to load site settings:', error);
        setDraft(emptySettings);
      }
    })();
  }, [db]);

  const patch = (p: Partial<SiteSettings>) =>
    setDraft((d) => (d ? { ...d, ...p } : d));

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.brandName.trim()) {
      toast({ title: 'Brand name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await saveSiteSettings(db, draft);
      toast({ title: 'Site settings saved' });
    } catch (error) {
      console.error('[caspian-store] Save failed:', error);
      toast({ title: 'Save failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateSocial = (idx: number, updated: SocialLink) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            socialLinks: d.socialLinks.map((s, i) => (i === idx ? updated : s)),
          }
        : d,
    );
  };

  const addSocial = () => {
    setDraft((d) =>
      d
        ? { ...d, socialLinks: [...d.socialLinks, { platform: 'instagram', url: '' }] }
        : d,
    );
  };

  const removeSocial = (idx: number) => {
    setDraft((d) =>
      d ? { ...d, socialLinks: d.socialLinks.filter((_, i) => i !== idx) } : d,
    );
  };

  if (!draft) {
    return (
      <div className={className}>
        <Skeleton style={{ height: 240 }} />
      </div>
    );
  }

  return (
    <div className={className}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Site settings</h1>
        <p style={{ color: '#666', marginTop: 4 }}>
          Brand, contact, localization, and social links. Rendered by the header and footer.
        </p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Brand</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <Label>Brand name</Label>
              <Input
                value={draft.brandName}
                onChange={(e) => patch({ brandName: e.target.value })}
              />
            </div>
            <div>
              <Label>Brand description</Label>
              <Textarea
                rows={2}
                value={draft.brandDescription}
                onChange={(e) => patch({ brandDescription: e.target.value })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <ImageUploadField
                label="Logo"
                value={draft.logoUrl}
                onChange={(url) => patch({ logoUrl: url })}
                storagePath="siteSettings/logo"
                aspectRatio="3 / 1"
                previewMaxWidth={280}
                allowUrlFallback
              />
              <ImageUploadField
                label="Favicon"
                value={draft.faviconUrl ?? ''}
                onChange={(url) => patch({ faviconUrl: url })}
                storagePath="siteSettings/favicon"
                aspectRatio="1 / 1"
                previewMaxWidth={120}
                allowUrlFallback
              />
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Localization</h2>
          <p style={{ color: '#666', fontSize: 13, marginTop: 0, marginBottom: 12 }}>
            Used by the storefront for price formatting and checkout defaults. Safe to change
            later — existing orders retain the currency they were placed in.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <Label>Currency</Label>
              <Select
                value={draft.currency ?? ''}
                onChange={(e) => patch({ currency: e.target.value })}
                options={CURRENCY_OPTIONS}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <Label>Timezone</Label>
              <Select
                value={draft.timezone ?? ''}
                onChange={(e) => patch({ timezone: e.target.value })}
                options={timezoneOptions}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <Label>Country</Label>
              <Select
                value={draft.country ?? ''}
                onChange={(e) => patch({ country: e.target.value })}
                options={COUNTRY_OPTIONS}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Contact</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={draft.contactEmail}
                  onChange={(e) => patch({ contactEmail: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={draft.contactPhone}
                  onChange={(e) => patch({ contactPhone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                rows={2}
                value={draft.contactAddress}
                onChange={(e) => patch({ contactAddress: e.target.value })}
              />
            </div>
            <div>
              <Label>Business hours</Label>
              <Textarea
                rows={2}
                value={draft.businessHours}
                onChange={(e) => patch({ businessHours: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Social links</h2>
            <Button variant="outline" size="sm" onClick={addSocial}>
              + Add link
            </Button>
          </div>
          {draft.socialLinks.length === 0 ? (
            <p style={{ color: '#888', fontSize: 14 }}>No social links configured.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {draft.socialLinks.map((s, idx) => {
                const platformOptions = SOCIAL_PLATFORMS.map((p) => ({
                  value: p,
                  label: PLATFORM_LABELS[p],
                }));
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '32px 200px 1fr auto',
                      gap: 8,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      aria-hidden
                      title={PLATFORM_LABELS[s.platform]}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--caspian-radius, 6px)',
                        background: '#f3f4f6',
                        color: '#444',
                      }}
                    >
                      <SocialIcon platform={s.platform} />
                    </span>
                    <Select
                      value={s.platform}
                      onChange={(e) =>
                        updateSocial(idx, {
                          ...s,
                          platform: e.target.value as SocialPlatform,
                        })
                      }
                      options={platformOptions}
                    />
                    <Input
                      placeholder="https://…"
                      value={s.url}
                      onChange={(e) => updateSocial(idx, { ...s, url: e.target.value })}
                    />
                    <Button variant="destructive" size="sm" onClick={() => removeSocial(idx)}>
                      ✕
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleSave} loading={saving}>
            Save settings
          </Button>
        </div>
      </section>
    </div>
  );
}
