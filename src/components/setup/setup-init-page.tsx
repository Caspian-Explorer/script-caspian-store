'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { useT } from '../../i18n';
import { SetupField, SetupButton } from './setup-ui';

export interface SetupInitPageProps {
  /**
   * API route that accepts a POST with the Firebase web config and writes
   * `.env.local`. Scaffolded sites ship `/api/setup/write-env`.
   */
  writeEnvEndpoint?: string;
}

interface ConfigDraft {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const FIELD_META: Array<{
  key: keyof ConfigDraft;
  labelKey: string;
  placeholder: string;
}> = [
  { key: 'apiKey', labelKey: 'setup.init.fields.apiKey', placeholder: 'AIzaSy…' },
  { key: 'authDomain', labelKey: 'setup.init.fields.authDomain', placeholder: 'my-store.firebaseapp.com' },
  { key: 'projectId', labelKey: 'setup.init.fields.projectId', placeholder: 'my-store' },
  { key: 'storageBucket', labelKey: 'setup.init.fields.storageBucket', placeholder: 'my-store.firebasestorage.app' },
  { key: 'messagingSenderId', labelKey: 'setup.init.fields.messagingSenderId', placeholder: '1234567890' },
  { key: 'appId', labelKey: 'setup.init.fields.appId', placeholder: '1:1234567890:web:abc123' },
];

type Status =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'ok' }
  | { kind: 'error'; message: string };

export function SetupInitPage({ writeEnvEndpoint = '/api/setup/write-env' }: SetupInitPageProps) {
  const t = useT();
  const [draft, setDraft] = useState<ConfigDraft>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (Object.values(draft).some((v) => !v.trim())) {
      setStatus({ kind: 'error', message: t('setup.init.errorMissing') });
      return;
    }
    setStatus({ kind: 'submitting' });
    try {
      const res = await fetch(writeEnvEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      setStatus({ kind: 'ok' });
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : t('setup.init.errorGeneric');
      setStatus({ kind: 'error', message });
    }
  };

  return (
    <div style={page}>
      <div style={card}>
        <h1 style={heading}>{t('setup.init.heading')}</h1>
        <p style={subhead}>{t('setup.init.subhead')}</p>

        <div style={devBadge}>
          <strong>{t('setup.init.devOnlyTitle')}</strong>{' '}
          <span style={{ color: '#6A7A8A' }}>{t('setup.init.devOnlyBody')}</span>
        </div>

        <form onSubmit={submit}>
          {FIELD_META.map(({ key, labelKey, placeholder }) => (
            <SetupField
              key={key}
              label={t(labelKey)}
              placeholder={placeholder}
              value={draft[key]}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
              autoComplete="off"
            />
          ))}
          <div style={{ marginTop: 8 }}>
            <SetupButton type="submit" disabled={status.kind === 'submitting'}>
              {status.kind === 'submitting' ? t('setup.init.submitting') : t('setup.init.submit')}
            </SetupButton>
          </div>
        </form>

        {status.kind === 'error' && (
          <p style={errorText}>{status.message}</p>
        )}
        {status.kind === 'ok' && (
          <div style={successCard}>
            <strong style={{ color: '#1F7A3D' }}>{t('setup.init.successTitle')}</strong>
            <p style={{ margin: '6px 0 0 0', color: '#334' }}>{t('setup.init.successBody')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const page: CSSProperties = {
  minHeight: '100vh',
  background: '#EFF5FF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  fontFamily: 'inherit',
};

const card: CSSProperties = {
  width: '100%',
  maxWidth: 520,
  background: '#FFFFFF',
  borderRadius: 16,
  padding: 32,
  boxShadow: '0 12px 40px rgba(22, 36, 64, 0.08)',
};

const heading: CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  color: '#022959',
  margin: 0,
  lineHeight: 1.2,
};

const subhead: CSSProperties = {
  fontSize: 15,
  color: '#6A7A8A',
  margin: '10px 0 16px 0',
  lineHeight: 1.5,
};

const devBadge: CSSProperties = {
  fontSize: 13,
  padding: 12,
  borderRadius: 8,
  background: '#FFF5E6',
  border: '1px solid #F0C274',
  marginBottom: 20,
  color: '#022959',
  lineHeight: 1.5,
};

const errorText: CSSProperties = {
  color: '#DF4747',
  fontSize: 13,
  marginTop: 12,
};

const successCard: CSSProperties = {
  marginTop: 16,
  padding: 12,
  borderRadius: 8,
  background: '#E6F7ED',
  border: '1px solid #7BC995',
};
