'use client';

import type { FirestoreReview } from '../../types';
import { Button } from '../../ui/button';
import { ReviewItem } from './review-item';

export function ReviewList({
  reviews,
  onWriteReview,
}: {
  reviews: FirestoreReview[];
  onWriteReview: () => void;
}) {
  if (reviews.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0' }}>
        <p style={{ color: '#888', fontSize: 14 }}>No reviews yet.</p>
        <Button onClick={onWriteReview}>Be the first to write a review</Button>
      </div>
    );
  }
  return (
    <div>
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}
    </div>
  );
}
