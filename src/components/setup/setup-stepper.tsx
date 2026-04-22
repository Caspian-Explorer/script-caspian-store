'use client';

import type { CSSProperties } from 'react';

export interface SetupStep {
  /** Stable key, used for React list diffing. */
  key: string;
  /** Short label shown in the stepper sidebar, e.g. "YOUR INFO". */
  label: string;
}

export interface SetupStepperProps {
  steps: SetupStep[];
  currentIndex: number;
  completedIndices?: number[];
}

export function SetupStepper({ steps, currentIndex, completedIndices = [] }: SetupStepperProps) {
  return (
    <aside style={sidebar}>
      <ol style={list}>
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isDone = completedIndices.includes(index);
          return (
            <li key={step.key} style={listItem}>
              <span
                style={{
                  ...circle,
                  ...(isActive ? circleActive : isDone ? circleDone : circleIdle),
                }}
                aria-current={isActive ? 'step' : undefined}
              >
                {index + 1}
              </span>
              <span style={labels}>
                <span style={stepNumber}>{`STEP ${index + 1}`}</span>
                <span style={stepLabel}>{step.label}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

const sidebar: CSSProperties = {
  background: 'linear-gradient(170deg, #4F54CF 0%, #453BD0 60%, #2E2781 100%)',
  color: '#FFFFFF',
  padding: '40px 32px',
  borderRadius: 12,
  minHeight: 560,
};

const list: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

const listItem: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
};

const circle: CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: 14,
  fontFamily: 'inherit',
  flexShrink: 0,
  transition: 'background-color 160ms ease, color 160ms ease',
};

const circleIdle: CSSProperties = {
  background: 'transparent',
  color: '#FFFFFF',
  border: '1.5px solid rgba(255,255,255,0.7)',
};

const circleActive: CSSProperties = {
  background: '#BEE2FD',
  color: '#022959',
  border: '1.5px solid #BEE2FD',
};

const circleDone: CSSProperties = {
  background: 'rgba(190,226,253,0.18)',
  color: '#FFFFFF',
  border: '1.5px solid rgba(190,226,253,0.5)',
};

const labels: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  lineHeight: 1.2,
};

const stepNumber: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '1px',
  color: 'rgba(255,255,255,0.72)',
};

const stepLabel: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  letterSpacing: '1.2px',
  color: '#FFFFFF',
  marginTop: 4,
};
