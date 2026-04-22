'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useScriptSettings } from '../../context/script-settings-context';
import { useT } from '../../i18n';
import { useCaspianFirebase, useCaspianNavigation } from '../../provider/caspian-store-provider';
import { getSiteSettings, saveSiteSettings } from '../../services/site-settings-service';
import { DEFAULT_SCRIPT_SETTINGS, type SiteSettings } from '../../types';
import { SetupShell } from './setup-shell';
import type { SetupStep } from './setup-stepper';
import { SetupButton } from './setup-ui';
import { SiteInfoStep } from './steps/site-info-step';
import { BrandingStep } from './steps/branding-step';
import { FeaturesStep } from './steps/features-step';
import { SummaryStep } from './steps/summary-step';
import type { BrandingDraft, WizardDraft } from './setup-types';

export interface SetupWizardProps {
  /** Destination after the user clicks "Open my store" on the summary step. */
  finishHref?: string;
}

type FieldErrors = { brandName?: string; contactEmail?: string };

const emptyDraft = (): WizardDraft => ({
  siteInfo: {
    brandName: '',
    brandDescription: '',
    contactEmail: '',
    currency: DEFAULT_SCRIPT_SETTINGS.defaultCurrency,
  },
  branding: {
    themePreset: '',
    theme: { ...DEFAULT_SCRIPT_SETTINGS.theme },
    heroTitle: DEFAULT_SCRIPT_SETTINGS.hero?.title ?? '',
    heroSubtitle: DEFAULT_SCRIPT_SETTINGS.hero?.subtitle ?? '',
    heroCta: DEFAULT_SCRIPT_SETTINGS.hero?.cta ?? '',
  },
  features: { ...DEFAULT_SCRIPT_SETTINGS.features },
});

export function SetupWizard({ finishHref = '/admin' }: SetupWizardProps) {
  const t = useT();
  const { db } = useCaspianFirebase();
  const navigation = useCaspianNavigation();
  const scriptSettings = useScriptSettings();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [draft, setDraft] = useState<WizardDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Seed draft with any existing settings/site on mount.
  useEffect(() => {
    let cancelled = false;
    getSiteSettings(db)
      .then((existing) => {
        if (cancelled || !existing) return;
        setDraft((d) => ({
          ...d,
          siteInfo: {
            brandName: existing.brandName || d.siteInfo.brandName,
            brandDescription: existing.brandDescription || d.siteInfo.brandDescription,
            contactEmail: existing.contactEmail || d.siteInfo.contactEmail,
            currency: existing.currency || d.siteInfo.currency,
          },
        }));
      })
      .catch(() => {
        // Swallow — wizard stays with defaults.
      });
    return () => {
      cancelled = true;
    };
  }, [db]);

  // Seed draft from scriptSettings once they load.
  useEffect(() => {
    if (scriptSettings.loading) return;
    setDraft((d) => ({
      ...d,
      branding: {
        themePreset: d.branding.themePreset,
        theme: scriptSettings.settings.theme,
        heroTitle: scriptSettings.settings.hero?.title ?? d.branding.heroTitle,
        heroSubtitle: scriptSettings.settings.hero?.subtitle ?? d.branding.heroSubtitle,
        heroCta: scriptSettings.settings.hero?.cta ?? d.branding.heroCta,
      },
      features: scriptSettings.settings.features,
    }));
  }, [scriptSettings.loading, scriptSettings.settings]);

  const steps: SetupStep[] = useMemo(
    () => [
      { key: 'site-info', label: t('setup.steps.siteInfo') },
      { key: 'branding', label: t('setup.steps.branding') },
      { key: 'features', label: t('setup.steps.features') },
      { key: 'summary', label: t('setup.steps.summary') },
    ],
    [t],
  );

  const validateSiteInfo = useCallback((): FieldErrors => {
    const errors: FieldErrors = {};
    if (!draft.siteInfo.brandName.trim()) {
      errors.brandName = t('setup.errors.brandNameRequired');
    }
    const email = draft.siteInfo.contactEmail.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.contactEmail = t('setup.errors.contactEmailInvalid');
    }
    return errors;
  }, [draft.siteInfo.brandName, draft.siteInfo.contactEmail, t]);

  const commitStep = useCallback(async () => {
    if (currentIndex === 0) {
      const errors = validateSiteInfo();
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        throw new Error('validation');
      }
      const existing = await getSiteSettings(db);
      const merged: SiteSettings = {
        logoUrl: existing?.logoUrl ?? '',
        faviconUrl: existing?.faviconUrl,
        brandName: draft.siteInfo.brandName.trim(),
        brandDescription: draft.siteInfo.brandDescription.trim(),
        contactEmail: draft.siteInfo.contactEmail.trim(),
        contactPhone: existing?.contactPhone ?? '',
        contactAddress: existing?.contactAddress ?? '',
        businessHours: existing?.businessHours ?? '',
        currency: draft.siteInfo.currency.trim() || undefined,
        timezone: existing?.timezone,
        country: existing?.country,
        socialLinks: existing?.socialLinks ?? [],
      };
      await saveSiteSettings(db, merged);
      return;
    }
    if (currentIndex === 1) {
      await scriptSettings.save({
        brandName: draft.siteInfo.brandName.trim() || scriptSettings.settings.brandName,
        defaultCurrency:
          draft.siteInfo.currency.trim() || scriptSettings.settings.defaultCurrency,
        theme: draft.branding.theme,
        hero: {
          title: draft.branding.heroTitle,
          subtitle: draft.branding.heroSubtitle,
          cta: draft.branding.heroCta,
          ctaHref: scriptSettings.settings.hero?.ctaHref ?? '/collections',
          imageUrl: scriptSettings.settings.hero?.imageUrl,
        },
      });
      return;
    }
    if (currentIndex === 2) {
      await scriptSettings.save({ features: draft.features });
      return;
    }
  }, [currentIndex, draft, db, scriptSettings, validateSiteInfo]);

  const next = useCallback(async () => {
    setSaving(true);
    setSubmitError(null);
    setFieldErrors({});
    try {
      await commitStep();
      setCurrentIndex((i) => Math.min(steps.length - 1, i + 1));
    } catch (err) {
      if (err instanceof Error && err.message === 'validation') {
        // Field errors already set; no submit-level message.
        return;
      }
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : t('setup.errors.saveFailed');
      setSubmitError(message);
    } finally {
      setSaving(false);
    }
  }, [commitStep, steps.length, t]);

  const back = useCallback(() => {
    setSubmitError(null);
    setFieldErrors({});
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const finish = useCallback(() => {
    navigation.push(finishHref);
  }, [navigation, finishHref]);

  const isLast = currentIndex === steps.length - 1;
  const headings = useMemo(
    () => [
      { heading: t('setup.siteInfo.heading'), subhead: t('setup.siteInfo.subhead') },
      { heading: t('setup.branding.heading'), subhead: t('setup.branding.subhead') },
      { heading: t('setup.features.heading'), subhead: t('setup.features.subhead') },
      { heading: t('setup.summary.heading'), subhead: t('setup.summary.subhead') },
    ],
    [t],
  );

  const content = (() => {
    switch (currentIndex) {
      case 0:
        return (
          <SiteInfoStep
            draft={draft.siteInfo}
            onChange={(patch) =>
              setDraft((d) => ({ ...d, siteInfo: { ...d.siteInfo, ...patch } }))
            }
            errors={fieldErrors}
          />
        );
      case 1:
        return (
          <BrandingStep
            draft={draft.branding}
            onChange={(patch: Partial<BrandingDraft>) =>
              setDraft((d) => ({ ...d, branding: { ...d.branding, ...patch } }))
            }
          />
        );
      case 2:
        return (
          <FeaturesStep
            draft={draft.features}
            onChange={(patch) =>
              setDraft((d) => ({ ...d, features: { ...d.features, ...patch } }))
            }
          />
        );
      case 3:
        return <SummaryStep draft={draft} onEdit={(i) => setCurrentIndex(i)} />;
      default:
        return null;
    }
  })();

  const completed = Array.from({ length: currentIndex }, (_, i) => i);

  return (
    <SetupShell
      steps={steps}
      currentIndex={currentIndex}
      completedIndices={completed}
      heading={headings[currentIndex]?.heading ?? ''}
      subhead={headings[currentIndex]?.subhead}
      footer={
        <>
          {currentIndex > 0 ? (
            <SetupButton variant="ghost" onClick={back} disabled={saving}>
              {t('setup.back')}
            </SetupButton>
          ) : (
            <span />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            {submitError && (
              <span style={{ fontSize: 12, color: '#DF4747' }}>{submitError}</span>
            )}
            {isLast ? (
              <SetupButton onClick={finish} disabled={saving}>
                {t('setup.summary.confirm')}
              </SetupButton>
            ) : (
              <SetupButton onClick={next} disabled={saving}>
                {saving ? t('setup.saving') : t('setup.next')}
              </SetupButton>
            )}
          </div>
        </>
      }
    >
      {content}
    </SetupShell>
  );
}
