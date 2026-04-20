'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { cn } from '../utils/cn';

interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
}
const TabsCtx = createContext<TabsContextValue | null>(null);

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;
  const setCurrent = (v: string) => {
    if (value === undefined) setInternal(v);
    onValueChange?.(v);
  };
  return (
    <TabsCtx.Provider value={{ value: current, setValue: setCurrent }}>
      <div className={cn('caspian-tabs', className)}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={cn('caspian-tabs-list', className)}
      style={{ display: 'inline-flex', gap: 2, borderBottom: '1px solid rgba(0,0,0,0.1)' }}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsCtx)!;
  const active = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn('caspian-tabs-trigger', className)}
      style={{
        padding: '8px 16px',
        background: active ? 'var(--caspian-primary, #111)' : 'transparent',
        color: active ? 'var(--caspian-primary-foreground, #fff)' : 'inherit',
        border: 0,
        borderRadius: 'var(--caspian-radius, 6px) var(--caspian-radius, 6px) 0 0',
        cursor: 'pointer',
        fontWeight: active ? 600 : 400,
        fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsCtx)!;
  if (ctx.value !== value) return null;
  return (
    <div role="tabpanel" className={cn('caspian-tabs-content', className)} style={{ paddingTop: 16 }}>
      {children}
    </div>
  );
}
