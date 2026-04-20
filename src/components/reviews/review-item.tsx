'use client';

import type { FirestoreReview } from '../../types';
import { Avatar, Badge } from '../../ui/misc';
import { StarIcon } from '../star-icon';

export function ReviewItem({ review }: { review: FirestoreReview }) {
  const date = review.createdAt?.toDate ? review.createdAt.toDate() : new Date();
  return (
    <div style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid #eee' }}>
      <Avatar src={review.photoURL} fallback={review.author} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <p style={{ fontWeight: 600, margin: 0 }}>{review.author}</p>
          {review.isVerifiedPurchase && <Badge variant="secondary">Verified Purchase</Badge>}
          <p style={{ marginLeft: 'auto', fontSize: 13, color: '#888' }}>{date.toLocaleDateString()}</p>
        </div>
        <div style={{ display: 'flex', gap: 2, margin: '6px 0' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <StarIcon
              key={i}
              width={14}
              height={14}
              fill={i < review.rating ? '#f59e0b' : 'none'}
              stroke={i < review.rating ? '#f59e0b' : 'rgba(0,0,0,0.3)'}
            />
          ))}
        </div>
        <p style={{ color: '#555', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.5 }}>{review.text}</p>
      </div>
    </div>
  );
}
