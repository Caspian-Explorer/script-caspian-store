'use client';

import type { ReactNode } from 'react';
import { Hero, type HeroProps } from './hero';
import { FeaturedCategoriesSection } from './featured-categories-section';
import { TrendingProductsSection } from './trending-products-section';
import { NewsletterSignup } from './newsletter-signup';

export interface HomePageProps {
  /** Override hero content (otherwise read from script settings). */
  hero?: HeroProps['hero'];
  /** Hide individual sections if you want to compose differently. */
  hideFeaturedCategories?: boolean;
  hideTrendingProducts?: boolean;
  hideNewsletter?: boolean;
  /** Slots to inject custom blocks between built-in sections. */
  afterHero?: ReactNode;
  afterFeaturedCategories?: ReactNode;
  afterTrendingProducts?: ReactNode;
  afterNewsletter?: ReactNode;
  /** Passed through to the product grid. */
  getProductHref?: (productId: string) => string;
  formatPrice?: (price: number) => string;
  className?: string;
}

/**
 * Drop-in homepage. Composes the four built-in sections (Hero,
 * FeaturedCategoriesSection, TrendingProductsSection, NewsletterSignup)
 * and respects hide-flags for consumers who want to swap sections for
 * their own.
 */
export function HomePage({
  hero,
  hideFeaturedCategories,
  hideTrendingProducts,
  hideNewsletter,
  afterHero,
  afterFeaturedCategories,
  afterTrendingProducts,
  afterNewsletter,
  getProductHref,
  formatPrice,
  className,
}: HomePageProps) {
  return (
    <main className={className}>
      <Hero hero={hero} />
      {afterHero}
      {!hideFeaturedCategories && <FeaturedCategoriesSection />}
      {afterFeaturedCategories}
      {!hideTrendingProducts && (
        <TrendingProductsSection getProductHref={getProductHref} formatPrice={formatPrice} />
      )}
      {afterTrendingProducts}
      {!hideNewsletter && <NewsletterSignup />}
      {afterNewsletter}
    </main>
  );
}
