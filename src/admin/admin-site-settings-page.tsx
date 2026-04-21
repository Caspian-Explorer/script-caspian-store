'use client';

import { useEffect, useState } from 'react';
import type { SiteSettings, SocialLink } from '../types';
import { getSiteSettings, saveSiteSettings } from '../services/site-settings-service';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { Button } from '../ui/button';
import { Input, Label, Textarea } from '../ui/input';
import { Skeleton } from '../ui/misc';
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
  socialLinks: [],
};

export function AdminSiteSettingsPage({ className }: { className?: string }) {
  const { db } = useCaspianFirebase();
  const { toast } = useToast();
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);

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

  const updateSocial = (idx: number, patch: Partial<SocialLink>) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            socialLinks: d.socialLinks.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
          }
        : d,
    );
  };

  const addSocial = () => {
    setDraft((d) =>
      d
        ? { ...d, socialLinks: [...d.socialLinks, { platform: '', url: '', label: '' }] }
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
          Brand, contact, and social links. Rendered by the header and footer.
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
                onChange={(e) => setDraft((d) => (d ? { ...d, brandName: e.target.value } : d))}
              />
            </div>
            <div>
              <Label>Brand description</Label>
              <Textarea
                rows={2}
                value={draft.brandDescription}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, brandDescription: e.target.value } : d))
                }
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <Label>Logo URL</Label>
                <Input
                  value={draft.logoUrl}
                  onChange={(e) => setDraft((d) => (d ? { ...d, logoUrl: e.target.value } : d))}
                />
              </div>
              <div>
                <Label>Favicon URL</Label>
                <Input
                  value={draft.faviconUrl ?? ''}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, faviconUrl: e.target.value } : d))
                  }
                />
              </div>
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
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, contactEmail: e.target.value } : d))
                  }
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={draft.contactPhone}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, contactPhone: e.target.value } : d))
                  }
                />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                rows={2}
                value={draft.contactAddress}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, contactAddress: e.target.value } : d))
                }
              />
            </div>
            <div>
              <Label>Business hours</Label>
              <Textarea
                rows={2}
                value={draft.businessHours}
                onChange={(e) =>
                  setDraft((d) => (d ? { ...d, businessHours: e.target.value } : d))
                }
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
              {draft.socialLinks.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr 1fr auto',
                    gap: 8,
                    alignItems: 'center',
                  }}
                >
                  <Input
                    placeholder="Platform (e.g. instagram)"
                    value={s.platform}
                    onChange={(e) => updateSocial(idx, { platform: e.target.value })}
                  />
                  <Input
                    placeholder="https://…"
                    value={s.url}
                    onChange={(e) => updateSocial(idx, { url: e.target.value })}
                  />
                  <Input
                    placeholder="Label (optional)"
                    value={s.label ?? ''}
                    onChange={(e) => updateSocial(idx, { label: e.target.value })}
                  />
                  <Button variant="destructive" size="sm" onClick={() => removeSocial(idx)}>
                    ✕
                  </Button>
                </div>
              ))}
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
