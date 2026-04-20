# @caspian-explorer/script-caspian-store

Framework-agnostic React e-commerce store. **Bring your own Firebase.** Install into any React app (Next.js, Vite, CRA).

> **Status: `v0.1.0-alpha` — Stage 0 scaffolding.** The install path, provider, framework adapters, Firestore rules/indexes, Cloud Functions for Stripe, and a site-level Script Settings page are all in place. Porting of the full storefront, cart, checkout, and admin surfaces is staged — see [Roadmap](#roadmap).

## Quickstart

```bash
npm install github:Caspian-Explorer/script-caspian-store#v0.1.0-alpha firebase
```

```tsx
// app/providers.tsx (Next.js)
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { CaspianStoreProvider } from '@caspian-explorer/script-caspian-store';
import '@caspian-explorer/script-caspian-store/styles.css';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <CaspianStoreProvider
      firebaseConfig={firebaseConfig}
      adapters={{
        Link: ({ href, children, ...rest }) => <Link href={href} {...rest}>{children}</Link>,
        Image: (props) => <Image {...(props as any)} />,
        useNavigation: () => ({
          pathname: pathname ?? '/',
          push: (href) => router.push(href),
          replace: (href) => router.replace(href),
          back: () => router.back(),
        }),
      }}
    >
      {children}
    </CaspianStoreProvider>
  );
}
```

See [INSTALL.md](./INSTALL.md) for **Vite** and **CRA** snippets, Firebase rules deployment, and Cloud Functions setup.

## What's in v0.1.0-alpha

| Surface | Status |
| --- | --- |
| `CaspianStoreProvider` + framework adapter contract (Link / Image / navigation) | ✅ |
| Firebase init (BYOF), auth context, user profile bootstrapping | ✅ |
| **Script Settings** — site-level config (theme tokens, feature flags, brand info, Stripe key) with `<ScriptSettingsPage>` | ✅ |
| Theme tokens piped to CSS custom properties (`--caspian-primary`, `--caspian-accent`, `--caspian-radius`, …) | ✅ |
| `firebase/firestore.rules` + `firebase/firestore.indexes.json` ready to deploy | ✅ |
| Cloud Functions for Stripe checkout + webhook (`firebase/functions/`) | ✅ (scaffold) |
| Proof-of-port component: `<StarRatingInput />` | ✅ |
| `getProducts`, `getProductById` services | ✅ |
| Storefront pages (PLP, PDP, cart, checkout flow) | ⏳ Stage 1–2 |
| Admin panel (`/admin`) | ⏳ Stage 3 |
| Auth pages (login/register/account) | ⏳ Stage 4 |
| i18n + theming polish | ⏳ Stage 4 |

## Package surface

```ts
// Provider + hooks
CaspianStoreProvider, useCaspianStore,
useCaspianLink, useCaspianImage, useCaspianNavigation,
useCaspianCollections, useCaspianFirebase
useAuth, useScriptSettings

// Components
StarIcon, StarRatingInput, ScriptSettingsPage

// Services
getProducts, getProductById

// Framework adapter contract
FrameworkAdapters, CaspianLinkProps, CaspianImageProps,
CaspianNavigation, UseCaspianNavigation,
DefaultCaspianLink, DefaultCaspianImage, useDefaultCaspianNavigation

// Types
Product, ProductImage, UserProfile, OrderStatus,
FirestoreReview, FirestoreQuestion, ModerationStatus,
ScriptSettings, ThemeTokens, FeatureFlags,
DEFAULT_SCRIPT_SETTINGS
```

And a sub-entrypoint for Firestore config:

```ts
import {
  CASPIAN_FIRESTORE_RULES,
  CASPIAN_FIRESTORE_INDEXES,
  caspianCollections,
} from '@caspian-explorer/script-caspian-store/firebase';
```

## Architecture

The package exports **components + hooks**. Routing is consumer-owned: you drop our pages into your own routes (Next.js app router, React Router, whatever). Host-framework integration is through a small `adapters` contract for `Link`, `Image`, and `useNavigation` — no `next/*` imports leak out of the package.

Data lives in your Firebase project (BYOF). We ship Firestore rules, indexes, and Cloud Functions. You deploy them once per install.

Stripe is handled by Firebase Cloud Functions (callable + webhook), so the package works in Next.js, Vite, and CRA without requiring a server.

## Usage notes

- **`"use client"` boundary (Next.js App Router):** the package does not emit a `"use client"` directive in its bundle. Import our components/hooks from a consumer file marked with `'use client'` at the top — e.g. a `providers.tsx` or a dedicated client wrapper. See [`examples/nextjs/app/providers.tsx`](./examples/nextjs/app/providers.tsx). A v0.1.1 release will preserve per-file directives automatically.
- **Tree-shaking:** the ESM bundle is side-effect-free except for `styles.css`, which you import once.
- **One store per page:** pass `appName="my-shop"` if you need multiple `CaspianStoreProvider` instances (e.g., a preview alongside the live storefront).

## Roadmap

- **v0.1.0-alpha (now)** — scaffolding, provider, Script Settings, one ported component.
- **v0.2.0** — storefront: PLP, PDP, Reviews & Q&A components, cart primitives.
- **v0.3.0** — cart persistence + Stripe checkout (client hook calling the callable).
- **v0.4.0** — admin panel pages.
- **v0.5.0** — auth pages (login, register, forgot password, account).
- **v0.6.0** — i18n (locale provider), theming polish, presets.
- **v1.0.0** — stable API, changelog freeze.

## License

MIT © Caspian-Explorer
