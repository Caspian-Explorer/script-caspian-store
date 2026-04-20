'use client';

import { useState } from 'react';
import { Dialog } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Label, Textarea } from '../../ui/input';
import { useToast } from '../../ui/toast';
import { useAuth } from '../../context/auth-context';
import { useCaspianFirebase } from '../../provider/caspian-store-provider';
import {
  createReview,
  hasUserReviewedProduct,
} from '../../services/review-service';
import { StarRatingInput } from '../star-rating-input';

export function WriteReviewDialog({
  productId,
  open,
  onOpenChange,
  onSubmitted,
}: {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}) {
  const { db } = useCaspianFirebase();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setRating(0);
    setText('');
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!user || !userProfile) {
      toast({ title: 'Sign in required', variant: 'destructive' });
      return;
    }
    if (rating < 1) {
      toast({ title: 'Please select a rating', variant: 'destructive' });
      return;
    }
    if (!text.trim()) {
      toast({ title: 'Please write a review', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      if (await hasUserReviewedProduct(db, user.uid, productId)) {
        toast({ title: 'You already reviewed this product', variant: 'destructive' });
        setSubmitting(false);
        return;
      }
      await createReview(
        db,
        { productId, rating, text },
        {
          uid: user.uid,
          displayName: userProfile.displayName || user.email || 'Anonymous',
          photoURL: userProfile.photoURL,
        },
      );
      toast({ title: 'Submitted!', description: 'Your review is pending approval.' });
      reset();
      onOpenChange(false);
      onSubmitted?.();
    } catch (error) {
      console.error('Failed to submit review:', error);
      toast({ title: 'Something went wrong', variant: 'destructive' });
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title="Write a review"
      description="Share your experience — reviews are published after moderation."
      footer={
        user ? (
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {submitting ? 'Submitting…' : 'Submit'}
            </Button>
          </>
        ) : null
      }
    >
      {!user ? (
        <div style={{ padding: '8px 0' }}>
          <p style={{ color: '#666', fontSize: 14 }}>Please sign in to leave a review.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <Label>Your rating</Label>
            <StarRatingInput value={rating} onChange={setRating} />
          </div>
          <div>
            <Label htmlFor="review-text">Your review</Label>
            <Textarea
              id="review-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              maxLength={2000}
              placeholder="What did you like or dislike about this product?"
            />
            <p style={{ fontSize: 12, color: '#888', textAlign: 'right', marginTop: 4 }}>{text.length}/2000</p>
          </div>
        </div>
      )}
    </Dialog>
  );
}
