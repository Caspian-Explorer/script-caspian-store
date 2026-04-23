'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AdminTodo } from '../types';
import { useCaspianFirebase, useCaspianLink } from '../provider/caspian-store-provider';
import { listenAdminTodos } from '../services/admin-todo-service';

export interface AdminOnboardingProgressProps {
  /** Where clicking the ring navigates. Default `/admin#todos` (v3.0.0+). */
  href?: string;
  /** Ring diameter in pixels. Default 32. */
  size?: number;
  /** Hide the ring once all default tasks are complete. Default true. */
  hideWhenDone?: boolean;
}

/**
 * Compact circular progress ring shown in the admin header that surfaces the
 * percentage of first-run "default" todo items the merchant has completed
 * (seeded tasks with `isDefault: true`). Disappears at 100% to avoid visual
 * noise on established stores.
 */
export function AdminOnboardingProgress({
  href = '/admin#todos',
  size = 32,
  hideWhenDone = true,
}: AdminOnboardingProgressProps) {
  const { db } = useCaspianFirebase();
  const Link = useCaspianLink();
  const [todos, setTodos] = useState<AdminTodo[] | null>(null);

  useEffect(() => {
    const unsub = listenAdminTodos(
      db,
      (next) => setTodos(next),
      (err) => {
        console.warn('[caspian-store] Onboarding progress listener error:', err);
        setTodos([]);
      },
    );
    return () => unsub();
  }, [db]);

  const { done, total, pct } = useMemo(() => {
    if (!todos) return { done: 0, total: 0, pct: 0 };
    const defaults = todos.filter((t) => t.isDefault);
    if (defaults.length === 0) return { done: 0, total: 0, pct: 0 };
    const completed = defaults.filter((t) => t.done).length;
    return {
      done: completed,
      total: defaults.length,
      pct: Math.round((completed / defaults.length) * 100),
    };
  }, [todos]);

  if (todos === null) return null;
  if (total === 0) return null;
  if (hideWhenDone && pct >= 100) return null;

  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <Link href={href}>
      <span
        title={`Setup progress: ${done}/${total} tasks done`}
        aria-label={`Setup progress: ${done} of ${total} tasks done`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--caspian-primary, #111)"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 300ms ease' }}
          />
        </svg>
        <span
          style={{
            position: 'absolute',
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--caspian-primary, #111)',
            lineHeight: 1,
          }}
        >
          {pct}%
        </span>
      </span>
    </Link>
  );
}
