'use client';

import { useState } from 'react';
import { Dialog } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Label, Textarea } from '../../ui/input';
import { useToast } from '../../ui/toast';
import { useAuth } from '../../context/auth-context';
import { useCaspianFirebase } from '../../provider/caspian-store-provider';
import { createQuestion } from '../../services/question-service';

export function AskQuestionDialog({
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
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !userProfile) {
      toast({ title: 'Sign in required', variant: 'destructive' });
      return;
    }
    if (!text.trim()) {
      toast({ title: 'Please type your question', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await createQuestion(
        db,
        { productId, text },
        {
          uid: user.uid,
          displayName: userProfile.displayName || user.email || 'Anonymous',
          photoURL: userProfile.photoURL,
        },
      );
      toast({ title: 'Submitted!', description: 'Your question is pending approval.' });
      setText('');
      onOpenChange(false);
      onSubmitted?.();
    } catch (error) {
      console.error('Failed to submit question:', error);
      toast({ title: 'Something went wrong', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setText('');
          setSubmitting(false);
        }
        onOpenChange(o);
      }}
      title="Ask a question"
      description="We'll reply as soon as possible."
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
        <p style={{ color: '#666', fontSize: 14 }}>Please sign in to ask a question.</p>
      ) : (
        <div>
          <Label htmlFor="question-text">Your question</Label>
          <Textarea
            id="question-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Type your question here..."
          />
          <p style={{ fontSize: 12, color: '#888', textAlign: 'right', marginTop: 4 }}>{text.length}/1000</p>
        </div>
      )}
    </Dialog>
  );
}
