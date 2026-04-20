'use client';

import { ScriptSettingsPage } from '@caspian-explorer/script-caspian-store';

export default function SettingsRoute() {
  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 24 }}>
      <ScriptSettingsPage />
    </main>
  );
}
