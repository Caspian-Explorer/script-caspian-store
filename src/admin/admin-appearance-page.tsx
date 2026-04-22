'use client';

import { useEffect, useState } from 'react';
import { useScriptSettings } from '../context/script-settings-context';
import { useT } from '../i18n/locale-context';
import { ThemePresetPicker } from '../theme/theme-preset-picker';
import type { ThemeTokens } from '../types';
import { Button } from '../ui/button';
import { Input, Label } from '../ui/input';
import { useToast } from '../ui/toast';

export interface AdminAppearancePageProps {
  className?: string;
}

/**
 * Admin appearance page — lets an admin pick a theme preset and fine-tune
 * the live theme tokens (primary, accent, radius). Writes to
 * `scriptSettings/site.theme` via `useScriptSettings().save()`.
 */
export function AdminAppearancePage({ className }: AdminAppearancePageProps) {
  const { settings, loading, saving, save } = useScriptSettings();
  const { toast } = useToast();
  const t = useT();

  const [draft, setDraft] = useState<ThemeTokens>({ ...settings.theme });

  useEffect(() => {
    setDraft({ ...settings.theme });
  }, [settings.theme]);

  const update = <K extends keyof ThemeTokens>(key: K, value: ThemeTokens[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await save({ theme: draft });
      toast({ title: t('admin.appearance.saved') });
    } catch (error) {
      console.error('[caspian-store] Failed to save theme:', error);
      toast({ title: t('admin.appearance.saveFailed'), variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          {t('admin.appearance.title')}
        </h1>
        <p style={{ color: '#666', marginTop: 4 }}>{t('admin.appearance.subtitle')}</p>
      </header>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 720 }}>
        <div>
          <h2 style={h2Style}>{t('settings.theme.presets')}</h2>
          <ThemePresetPicker />
        </div>

        <div>
          <h2 style={h2Style}>{t('admin.appearance.customize')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <ColorField
              label={t('settings.theme.primary')}
              value={draft.primary}
              onChange={(v) => update('primary', v)}
            />
            <ColorField
              label={t('settings.theme.primaryForeground')}
              value={draft.primaryForeground}
              onChange={(v) => update('primaryForeground', v)}
            />
            <ColorField
              label={t('settings.theme.accent')}
              value={draft.accent}
              onChange={(v) => update('accent', v)}
            />
            <div>
              <Label>{t('settings.theme.radius')}</Label>
              <Input
                value={draft.radius}
                onChange={(e) => update('radius', e.target.value)}
                placeholder="0.5rem"
              />
            </div>
          </div>
        </div>

        <div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? t('settings.saving') : t('settings.saveButton')}
          </Button>
        </div>
      </section>
    </div>
  );
}

const h2Style: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 600,
  marginTop: 0,
  marginBottom: 12,
};

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 40,
            height: 40,
            padding: 0,
            border: '1px solid rgba(0,0,0,0.15)',
            borderRadius: 'var(--caspian-radius, 6px)',
            background: 'transparent',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}
