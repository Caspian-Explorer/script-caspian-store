# Caspian Store — Next.js consumer example

Minimal Next.js 15 app that mounts `@caspian-explorer/script-caspian-store`.

## Run

```bash
cd examples/nextjs
cp .env.local.example .env.local   # fill in Firebase config
npm install
npm run dev
```

## What's wired up

- [`app/providers.tsx`](app/providers.tsx) — mounts `CaspianStoreProvider` and supplies Next.js-specific adapters for `Link`, `Image`, and `useNavigation`.
- [`app/page.tsx`](app/page.tsx) — reads `useAuth()`, `useScriptSettings()`, and renders the `StarRatingInput` component.
- [`app/settings/page.tsx`](app/settings/page.tsx) — mounts `<ScriptSettingsPage />` at `/settings`.
