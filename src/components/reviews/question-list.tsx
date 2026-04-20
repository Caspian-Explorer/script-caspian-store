'use client';

import type { FirestoreQuestion } from '../../types';
import { Button } from '../../ui/button';
import { useT } from '../../i18n/locale-context';
import { QuestionItem } from './question-item';

export function QuestionList({
  questions,
  onAskQuestion,
}: {
  questions: FirestoreQuestion[];
  onAskQuestion: () => void;
}) {
  const t = useT();
  if (questions.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0' }}>
        <p style={{ color: '#888', fontSize: 14 }}>{t('reviews.questions.empty')}</p>
        <Button onClick={onAskQuestion}>{t('reviews.beFirstQuestion')}</Button>
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
