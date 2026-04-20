'use client';

import type { FirestoreQuestion } from '../../types';
import { Button } from '../../ui/button';
import { QuestionItem } from './question-item';

export function QuestionList({
  questions,
  onAskQuestion,
}: {
  questions: FirestoreQuestion[];
  onAskQuestion: () => void;
}) {
  if (questions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0' }}>
        <p style={{ color: '#888', fontSize: 14 }}>No questions yet.</p>
        <Button onClick={onAskQuestion}>Be the first to ask a question</Button>
      </div>
    );
  }
  return (
    <div>
      {questions.map((q) => (
        <QuestionItem key={q.id} question={q} />
      ))}
    </div>
  );
}
