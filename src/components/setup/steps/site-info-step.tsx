'use client';

import { useT } from '../../../i18n';
import { SetupField } from '../setup-ui';
import type { SiteInfoDraft } from '../setup-types';

export interface SiteInfoStepProps {
  draft: SiteInfoDraft;
  onChange: (patch: Partial<SiteInfoDraft>) => void;
  errors?: Partial<Record<keyof SiteInfoDraft, string>>;
}

export function SiteInfoStep({ draft, onChange, errors }: SiteInfoStepProps) {
  const t = useT();
  return (
    <div>
      <SetupField
        label={t('setup.siteInfo.brandName')}
        placeholder="e.g. Luivante"
        value={draft.brandName}
        onChange={(e) => onChange({ brandName: e.target.value })}
        error={errors?.brandName}
        autoComplete="organization"
      />
      <SetupField
        label={t('setup.siteInfo.brandDescription')}
        placeholder={t('setup.siteInfo.brandDescriptionHint')}
        value={draft.brandDescription}
        onChange={(e) => onChange({ brandDescription: e.target.value })}
      />
      <SetupField
        label={t('setup.siteInfo.contactEmail')}
        placeholder="hello@yourbrand.com"
        type="email"
        value={draft.contactEmail}
        onChange={(e) => onChange({ contactEmail: e.target.value })}
        error={errors?.contactEmail}
        autoComplete="email"
      />
      <SetupField
        label={t('setup.siteInfo.currency')}
        placeholder="USD"
        value={draft.currency}
        onChange={(e) => onChange({ currency: e.target.value.toUpperCase() })}
        hint={t('setup.siteInfo.currencyHint')}
        maxLength={3}
      />
    </div>
  );
}
