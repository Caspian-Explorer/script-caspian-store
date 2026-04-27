'use client';

import { useEffect, useMemo, useState } from 'react';
import type { UserProfile } from '../types';
import { listUsers } from '../services/user-service';
import { reportServiceError } from '../services/error-log-service';
import { useCaspianFirebase } from '../provider/caspian-store-provider';
import { useT } from '../i18n/locale-context';
import { Badge, Skeleton } from '../ui/misc';
import { Input } from '../ui/input';
import { Table, TBody, TD, TH, THead, TR } from '../ui/table';

export interface AdminUsersPageProps {
  className?: string;
}

export function AdminUsersPage({ className }: AdminUsersPageProps) {
  const { db } = useCaspianFirebase();
  const t = useT();
  const [users, setUsers] = useState<UserProfile[] | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;
    setUsers(null);
    listUsers(db)
      .then((list) => {
        if (alive) setUsers(list);
      })
      .catch((error) => {
        reportServiceError(db, 'admin-users-page.load', error);
        if (alive) setUsers([]);
      });
    return () => {
      alive = false;
    };
  }, [db]);

  const filtered = useMemo(() => {
    if (!users) return [];
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q),
    );
  }, [users, search]);

  return (
    <div className={className}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{t('admin.users.title')}</h1>
        <p style={{ color: '#666', marginTop: 4 }}>
          {users === null ? t('admin.users.subtitle') : `${users.length} total`}
        </p>
      </header>

      <div style={{ marginBottom: 12, maxWidth: 320 }}>
        <Input
          placeholder={t('admin.users.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {users === null ? (
        <Skeleton style={{ height: 120 }} />
      ) : filtered.length === 0 ? (
        <p style={{ color: '#888', padding: 32, textAlign: 'center' }}>{t('admin.users.empty')}</p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>{t('admin.users.col.name')}</TH>
              <TH>{t('admin.users.col.email')}</TH>
              <TH>{t('admin.users.col.role')}</TH>
              <TH>{t('admin.users.col.joined')}</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.map((u) => (
              <TR key={u.uid}>
                <TD style={{ fontWeight: 500 }}>
                  {u.displayName || <span style={{ color: '#bbb' }}>—</span>}
                </TD>
                <TD style={{ fontSize: 13, color: '#333' }}>{u.email}</TD>
                <TD>
                  <Badge variant={u.role === 'admin' ? 'secondary' : 'default'}>
                    {u.role ?? 'customer'}
                  </Badge>
                </TD>
                <TD style={{ color: '#888', fontSize: 13 }}>
                  {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleString() : '—'}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
