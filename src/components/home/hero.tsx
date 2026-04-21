'use client';

import { useScriptSettings } from '../../context/script-settings-context';
import { useCaspianImage, useCaspianLink } from '../../provider/caspian-store-provider';
import { Button } from '../../ui/button';
import { cn } from '../../utils/cn';
import type { HeroTokens } from '../../types';

export interface HeroProps {
  /** Overrides script settings if provided. Otherwise pulls from `scriptSettings.hero`. */
  hero?: Partial<HeroTokens>;
  /** Full-bleed hero height. Default: 60vh desktop / 50vh mobile. */
  minHeightClass?: string;
  className?: string;
}

/**
 * Full-bleed homepage hero. Title / subtitle / CTA / background image all
 * read from `scriptSettings.hero` by default — admins edit the content
 * inside `<ScriptSettingsPage />`. Consumers who want a different layout
 * can either override individual fields via the `hero` prop or compose
 * their own hero using `useScriptSettings()`.
 */
export function Hero({ hero: override, minHeightClass, className }: HeroProps) {
  const { settings } = useScriptSettings();
  const Image = useCaspianImage();
  const Link = useCaspianLink();
  const hero: HeroTokens = {
    title: override?.title ?? settings.hero?.title ?? 'Shop our latest collection',
    subtitle:
      override?.subtitle ?? settings.hero?.subtitle ?? 'Curated essentials delivered to your door.',
    cta: override?.cta ?? settings.hero?.cta ?? 'Shop now',
    ctaHref: override?.ctaHref ?? settings.hero?.ctaHref ?? '/products',
    imageUrl: override?.imageUrl ?? settings.hero?.imageUrl,
  };

  return (
    <section
      className={cn('caspian-hero', className)}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textAlign: 'center',
        overflow: 'hidden',
      }}
      data-min-height-class={minHeightClass}
    >
      {hero.imageUrl ? (
        <Image src={hero.imageUrl} alt="" fill priority />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, var(--caspian-primary, #111) 0%, var(--caspian-accent, #f5a8b8) 100%)',
          }}
        />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
      <div style={{ position: 'relative', maxWidth: 720, padding: '0 24px' }}>
        <h1
          style={{
            fontFamily: 'var(--caspian-font-headline, inherit)',
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            margin: 0,
          }}
        >
          {hero.title}
        </h1>
        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.125rem)',
            marginTop: 16,
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          {hero.subtitle}
        </p>
        {hero.cta && hero.ctaHref && (
          <div style={{ marginTop: 32 }}>
            <Link href={hero.ctaHref}>
              <Button size="lg">{hero.cta}</Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
