'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { AdminTodo } from '../types';
import {
  createAdminTodo,
  deleteAdminTodo,
  listenAdminTodos,
  seedDefaultAdminTodos,
  updateAdminTodo,
} from '../services/admin-todo-service';
import { verifyAdminTodos } from '../services/admin-todo-detectors';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { Button } from '../ui/button';
import { CheckIcon, RefreshIcon } from '../ui/icons';
import { Input } from '../ui/input';
import { Badge, Skeleton } from '../ui/misc';
import { useToast } from '../ui/toast';

export function AdminTodoPage({ className }: { className?: string }) {
  const { db } = useCaspianFirebase();
  const { toast } = useToast();
  const [todos, setTodos] = useState<AdminTodo[] | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [hideDone, setHideDone] = useState(false);
  const autoSeededRef = useRef(false);

  useEffect(() => {
    const unsubscribe = listenAdminTodos(
      db,
      async (next) => {
        setTodos(next);
        if (next.length === 0 && !autoSeededRef.current) {
          autoSeededRef.current = true;
          try {
            await seedDefaultAdminTodos(db);
          } catch (error) {
            console.error('[caspian-store] Auto-seed failed:', error);
          }
        }
      },
      (err) => {
        console.error('[caspian-store] Todos listener error:', err);
      },
    );
    return () => unsubscribe();
  }, [db]);

  const progress = useMemo(() => {
    if (!todos || todos.length === 0) return { done: 0, total: 0, pct: 0 };
    const done = todos.filter((t) => t.done).length;
    return { done, total: todos.length, pct: Math.round((done / todos.length) * 100) };
  }, [todos]);

  const visibleTodos = useMemo(() => {
    if (!todos) return null;
    return hideDone ? todos.filter((t) => !t.done) : todos;
  }, [todos, hideDone]);

  const handleToggle = async (t: AdminTodo) => {
    try {
      await updateAdminTodo(db, t.id, { done: !t.done });
    } catch (error) {
      console.error('[caspian-store] Toggle failed:', error);
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const order = (todos?.length ?? 0) + 1;
      await createAdminTodo(db, { title: newTitle.trim(), order, isDefault: false });
      setNewTitle('');
    } catch (error) {
      console.error('[caspian-store] Add failed:', error);
      toast({ title: 'Add failed', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (t: AdminTodo) => {
    if (!confirm(`Delete "${t.title}"?`)) return;
    try {
      await deleteAdminTodo(db, t.id);
    } catch (error) {
      console.error('[caspian-store] Delete failed:', error);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const written = await seedDefaultAdminTodos(db);
      toast({
        title:
          written === 0
            ? 'Checklist already seeded'
            : `Added ${written} setup task${written === 1 ? '' : 's'}`,
      });
    } catch (error) {
      console.error('[caspian-store] Seed failed:', error);
      toast({ title: 'Seed failed', variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  };

  const handleVerify = async () => {
    if (!todos) return;
    setVerifying(true);
    try {
      const ids = await verifyAdminTodos(db, todos);
      if (ids.length === 0) {
        toast({ title: 'Nothing new to mark done' });
      } else {
        await Promise.all(
          ids.map((id) => updateAdminTodo(db, id, { done: true })),
        );
        toast({
          title: `Marked ${ids.length} item${ids.length === 1 ? '' : 's'} done`,
        });
      }
    } catch (error) {
      console.error('[caspian-store] Verify failed:', error);
      toast({ title: 'Verify failed', variant: 'destructive' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className={className}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Todo list</h1>
        <p style={{ color: '#666', marginTop: 4 }}>
          First-run setup checklist. Auto-seeded on first visit; &quot;Verify progress&quot; re-checks
          what&apos;s been done.
        </p>
      </header>

      {todos !== null && todos.length > 0 && (
        <section
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '12px 16px',
            background: '#f6f6f6',
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              {progress.done} / {progress.total} complete ({progress.pct}%)
            </div>
            <div
              style={{
                height: 6,
                background: '#e5e5e5',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress.pct}%`,
                  background: 'var(--caspian-primary, #111)',
                  transition: 'width 200ms',
                }}
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleVerify}
            loading={verifying}
            title="Re-check which items are done based on Firestore state"
          >
            <RefreshIcon size={14} />
            Verify progress
          </Button>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
            Hide completed
          </label>
        </section>
      )}

      <section
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Input
          placeholder="Add a task…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAdd();
            }
          }}
          style={{ flex: 1, minWidth: 240 }}
        />
        <Button onClick={handleAdd} loading={adding} disabled={!newTitle.trim()}>
          + Add task
        </Button>
        <Button variant="outline" onClick={handleSeedDefaults} loading={seeding}>
          Re-seed defaults
        </Button>
      </section>

      {visibleTodos === null ? (
        <Skeleton style={{ height: 200 }} />
      ) : visibleTodos.length === 0 ? (
        <div
          style={{
            padding: 32,
            textAlign: 'center',
            color: '#888',
            border: '1px dashed #ddd',
            borderRadius: 8,
          }}
        >
          {todos && todos.length > 0 && hideDone
            ? 'All tasks completed — nice.'
            : 'No tasks yet. The default checklist is seeding…'}
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visibleTodos.map((t) => (
            <li
              key={t.id}
              style={{
                display: 'flex',
                gap: 12,
                padding: 14,
                border: '1px solid #eee',
                borderRadius: 8,
                background: t.done ? '#fafafa' : '#fff',
              }}
            >
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => handleToggle(t)}
                style={{ marginTop: 4, cursor: 'pointer' }}
                aria-label={`Mark "${t.title}" as ${t.done ? 'not done' : 'done'}`}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontWeight: 600,
                    fontSize: 15,
                    textDecoration: t.done ? 'line-through' : 'none',
                    color: t.done ? '#888' : '#111',
                  }}
                >
                  {t.done && <CheckIcon size={16} />}
                  {t.title}
                  {t.isDefault && <Badge variant="secondary">Setup</Badge>}
                </div>
                {t.description && (
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: 13,
                      color: '#666',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {t.description}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={() => handleDelete(t)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
