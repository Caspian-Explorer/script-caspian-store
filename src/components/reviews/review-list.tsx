'use client';

import type { FirestoreReview } from '../../types';
import { Button } from '../../ui/button';
import { useT } from '../../i18n/locale-context';
import { ReviewItem } from './review-item';

export interface ReviewListProps {
  reviews: FirestoreReview[];
  onWriteReview: () => void;
  /**
   * When false, the "verified purchase" badge is hidden on every card. Wire
   * to `SiteSettings.reviewPolicy.showVerifiedBadge`. Default true. Added in v2.7.
   */
  showVerifiedBadge?: boolean;
}

export function ReviewList({ reviews, onWriteReview, showVerifiedBadge = true }: ReviewListProps) {
  const t = useT();
  if (reviews.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0' }}>
        <p style={{ color: '#888', fontSize: 14 }}>{t('reviews.empty')}</p>
        <Button onClick={onWriteReview}>{t('reviews.beFirstReview')}</Button>
      </div>
    );
  }
  return (
    <div>
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} showVerifiedBadge={showVerifiedBadge} />
      ))}
    </div>
  );
}
