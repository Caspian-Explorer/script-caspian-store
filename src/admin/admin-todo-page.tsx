'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AdminTodo } from '../types';
import {
  createAdminTodo,
  deleteAdminTodo,
  listAdminTodos,
  seedDefaultAdminTodos,
  updateAdminTodo,
} from '../services/admin-todo-service';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { Button } from '../ui/button';
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
  const [hideDone, setHideDone] = useState(false);

  const load = async () => {
    try {
      setTodos(await listAdminTodos(db));
    } catch (error) {
      console.error('[caspian-store] Failed to list todos:', error);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const next = !t.done;
    setTodos((prev) => (prev ? prev.map((x) => (x.id === t.id ? { ...x, done: next } : x)) : prev));
    try {
      await updateAdminTodo(db, t.id, { done: next });
    } catch (error) {
      console.error('[caspian-store] Toggle failed:', error);
      toast({ title: 'Update failed', variant: 'destructive' });
      setTodos((prev) => (prev ? prev.map((x) => (x.id === t.id ? { ...x, done: !next } : x)) : prev));
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const order = (todos?.length ?? 0) + 1;
      await createAdminTodo(db, { title: newTitle.trim(), order, isDefault: false });
      setNewTitle('');
      await load();
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
      setTodos((prev) => (prev ? prev.filter((x) => x.id !== t.id) : prev));
    } catch (error) {
      console.error('[caspian-store] Delete failed:', error);
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
  };

  const handleSeedDefaults = async () => {
    setSeeding(true);
    try {
      const written = await seedDefaultAdminTodos(db);
      await load();
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

  return (
    <div className={className}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Todo list</h1>
        <p style={{ color: '#666', marginTop: 4 }}>
          Track setup actions and operational tasks. Seed the default first-run checklist if this
          is a fresh install.
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
        {todos !== null && todos.length === 0 && (
          <Button variant="outline" onClick={handleSeedDefaults} loading={seeding}>
            Seed setup checklist
          </Button>
        )}
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
            : 'No tasks yet. Click "Seed setup checklist" to load the first-run actions.'}
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
