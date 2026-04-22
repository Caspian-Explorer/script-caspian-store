# Install guide

Install `@caspian-explorer/script-caspian-store` into a React app and get a full e-commerce storefront + admin in ~15 minutes. Works with Next.js (App Router), Vite + React Router, or Create React App. Bring your own Firebase project + Stripe account.

The fastest path is the [one-command scaffolder](#zero-one-command-scaffold). Prefer a manual install? Skip to [§1](#1-install-the-package).

---

## 0. One-command scaffold

```bash
npm create caspian-store@latest my-store
cd my-store
npm install
cp .env.example .env.local   # fill in Firebase web config
npm run dev                  # http://localhost:3000
```

This generates a Next.js 14 App Router project with every storefront / admin / content route pre-mounted, Next.js adapter code (Link/Image/useNavigation), real deployable `firestore.rules` / `firestore.indexes.json` / `storage.rules`, and a `.env.example` with Firebase + Stripe placeholders.

Flags:

- `--package-tag vX.Y.Z` — pin the generated project to a specific release (default: latest)
- `--with-stripe` — also scaffold the Stripe Cloud Functions tree into `functions-stripe/` (and add the matching `caspian-stripe` codebase to `firebase.json`). The admin codebase (`functions-admin/`, auto-promote trigger) is always scaffolded — it has no secrets and is deployable immediately.
- `--with-functions` — deprecated alias for `--with-stripe`, kept for back-compat
- `--force` — scaffold into a non-empty directory (`.git`, `.gitignore`, `README.md`, `LICENSE` are preserved automatically)

**If you used the scaffolder, stop here and follow the generated `my-store/README.md`** for Firebase + Stripe + seeding. The remainder of this document (§1–§12) is the manual-install path for people embedding the package into an existing React app; you don't need it after scaffolding.

If you can't use `npm create` (e.g. offline mirror, locked-down network), the same scaffolder can be invoked directly from a clone:

```bash
git clone https://github.com/Caspian-Explorer/script-caspian-store /tmp/scs
node /tmp/scs/scaffold/create.mjs my-store --package-tag v1.11.0
```

---

## Manual install

## 1. Install the package

```bash
npm install github:Caspian-Explorer/script-caspian-store#v1.18.2 firebase
# Replace v1.18.2 with the latest tag — see:
#   https://github.com/Caspian-Explorer/script-caspian-store/releases
# Pinning to a specific sha is also fine:
# npm install github:Caspian-Explorer/script-caspian-store#<sha>
```

For private-repo access, GitHub's `git` over HTTPS or SSH works — same credentials you use for `git clone`.

Peer deps: React 18/19, `firebase` 10 or 11. Next.js consumers: install `next@14` or `next@16` separately.

---

## 2. Create a Firebase project

At <https://console.firebase.google.com>:

1. Create a new project.
2. **Authentication** → Sign-in method → enable Email/Password and Google.
3. **Firestore Database** → Create database (production mode).
4. **Storage** → Get started.
5. **Functions** → Upgrade to Blaze plan (required for outbound HTTP to Stripe).

Copy the web-app config object (Project settings → Your apps → Web) into `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=…
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=…
NEXT_PUBLIC_FIREBASE_PROJECT_ID=…
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=…
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=…
NEXT_PUBLIC_FIREBASE_APP_ID=…
```

---

## 3. Mount the provider

### Next.js (App Router)

```tsx
// src/lib/caspian-adapters.tsx
'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import type { CaspianLinkProps, CaspianImageProps } from '@caspian-explorer/script-caspian-store';

export const caspianFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export function CaspianNextLink({ href, children, ...rest }: CaspianLinkProps) {
  return <Link href={href as any} {...rest}>{children}</Link>;
}

export function CaspianNextImage({ src, alt, width, height, fill, priority, className, sizes }: CaspianImageProps) {
  if (fill) return <Image src={src} alt={alt} fill priority={priority} className={className} sizes={sizes} />;
  return <Image src={src} alt={alt} width={width ?? 600} height={height ?? 400} priority={priority} className={className} sizes={sizes} />;
}

export function useCaspianNextNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  return {
    pathname: pathname ?? '/',
    push: (href: string) => router.push(href as any),
    replace: (href: string) => router.replace(href as any),
    back: () => router.back(),
  };
}
```

```tsx
// src/app/providers.tsx
'use client';
import type { ReactNode } from 'react';
import { CaspianStoreProvider } from '@caspian-explorer/script-caspian-store';
import { CaspianNextLink, CaspianNextImage, useCaspianNextNavigation, caspianFirebaseConfig } from '@/lib/caspian-adapters';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CaspianStoreProvider
      firebaseConfig={caspianFirebaseConfig}
      adapters={{ Link: CaspianNextLink, Image: CaspianNextImage, useNavigation: useCaspianNextNavigation }}
    >
      {children}
    </CaspianStoreProvider>
  );
}
```

```tsx
// src/app/layout.tsx
import { LayoutShell, DynamicFavicon } from '@caspian-explorer/script-caspian-store';
import '@caspian-explorer/script-caspian-store/styles.css';
import { Providers } from './providers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <LayoutShell>{children}</LayoutShell>
          <DynamicFavicon />
        </Providers>
      </body>
    </html>
  );
}
```

#### Configure `next/image` hosts

`next/image` rejects any hostname not listed under `images.remotePatterns` in `next.config.mjs` with a runtime error ([Invalid src prop](https://nextjs.org/docs/messages/next-image-unconfigured-host)). Storefront catalogs routinely contain images from arbitrary hosts (seeded demo data, Unsplash, Wikimedia, third-party CDNs), so the scaffolder ships a permissive default — match it in a manual install:

```js
// next.config.mjs
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
};
export default nextConfig;
```

To tighten it for production, replace the wildcard with explicit per-host rules:

```js
remotePatterns: [
  { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
  { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
  { protocol: 'https', hostname: 'cdn.example.com' },
],
```

### Vite / React Router

```tsx
import { CaspianStoreProvider } from '@caspian-explorer/script-caspian-store';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '@caspian-explorer/script-caspian-store/styles.css';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function useCaspianRouterNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return {
    pathname,
    push: (h: string) => navigate(h),
    replace: (h: string) => navigate(h, { replace: true }),
    back: () => navigate(-1),
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CaspianStoreProvider
      firebaseConfig={firebaseConfig}
      adapters={{
        Link: ({ href, children, ...rest }) => <Link to={href} {...rest}>{children}</Link>,
        useNavigation: useCaspianRouterNav,
      }}
    >
      {children}
    </CaspianStoreProvider>
  );
}
```

### Create React App

Same as Vite, but read env vars with `process.env.REACT_APP_*`.

---

## 4. Deploy Firestore rules + indexes + Storage rules

The package ships deployable files under `firebase/`.

```bash
cp node_modules/@caspian-explorer/script-caspian-store/firebase/firestore.rules .
cp node_modules/@caspian-explorer/script-caspian-store/firebase/firestore.indexes.json .
cp node_modules/@caspian-explorer/script-caspian-store/firebase/storage.rules .
cp node_modules/@caspian-explorer/script-caspian-store/firebase/firebase.json .   # or merge if you have one

firebase login
firebase use --add           # select your project
firebase deploy --only firestore:rules,firestore:indexes,storage
```

If you already have a `firestore.rules`, merge the `match /<collection>/{id} { ... }` blocks into yours.

---

## 5. Deploy Cloud Functions

v1.16.0+ ships **two codebases** so you can deploy admin triggers without having Stripe configured:

- `caspian-admin` — just `onUserCreate` (auto-promote first user to admin). No secrets, no Stripe dep. Always deployable.
- `caspian-stripe` — `createStripeCheckoutSession`, `stripeWebhook`, `getStripeSession`. Requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.

Copy both codebases from `node_modules` into your project root, merge the `functions` entries into your `firebase.json`, then deploy them separately:

```bash
cp -R node_modules/@caspian-explorer/script-caspian-store/firebase/functions-admin ./functions-admin
cp -R node_modules/@caspian-explorer/script-caspian-store/firebase/functions-stripe ./functions-stripe  # skip if no Stripe
cp node_modules/@caspian-explorer/script-caspian-store/firebase/firebase.json .                          # or merge manually
```

**Admin codebase (always deploy this, before anyone registers):**

```bash
cd functions-admin && npm install && cd ..
npm run deploy:admin     # v1.19.0+ helper — wraps `firebase deploy` with Eventarc retry
                         # If you're on ≤v1.18.x, use `firebase deploy --only functions:caspian-admin`
```

The `deploy:admin` helper (shipped with the scaffolded `package.json` in v1.19.0+) wraps `firebase deploy` and handles two first-deploy papercuts automatically:

1. **Eventarc propagation.** First 2nd-gen deploys on a brand-new Firebase project often fail with `Permission denied while using the Eventarc Service Agent`. The helper detects this and retries after a 60s countdown — no more panic at the `Error:` line.
2. **Artifact Registry cleanup policy.** After a successful deploy, `firebase deploy` often emits `Error: could not set up cleanup policy`. The functions themselves are live — that message is about old container-image retention. The helper runs `firebase functions:artifacts:setpolicy --force` afterwards and reframes the output so you don't see red `Error:` for a non-problem.

Raw `firebase deploy --only functions:caspian-admin` still works if you prefer it (or if you're not using the scaffolded `package.json`).

**Stripe codebase (only when you have Stripe keys):**

```bash
cd functions-stripe && npm install && cd ..
firebase functions:secrets:set STRIPE_SECRET_KEY       # sk_test_… or sk_live_…
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET   # whsec_…
npm run deploy:stripe    # v1.19.0+ helper
```

In Stripe dashboard → Webhooks → add endpoint:

```
https://<region>-<project-id>.cloudfunctions.net/stripeWebhook
```

Subscribe to `checkout.session.completed`. Paste the resulting `whsec_…` into the `STRIPE_WEBHOOK_SECRET` secret and redeploy.

---

## 6. Seed Firestore

Before the admin pages can render anything useful, seed the defaults:

```bash
npm install --no-save firebase-admin

# Download service account JSON: Firebase console → Project settings → Service accounts
node node_modules/@caspian-explorer/script-caspian-store/firebase/seed/seed.mjs \
  --project <your-project-id> \
  --credentials ./service-account.json
```

That writes:

- `languages` collection (en/ar/de/es/fr — en = default + active)
- `settings/site` (brand placeholders + empty social links)
- `scriptSettings/site` (theme + features + hero + fonts defaults)
- `shippingMethods` (standard + express)

Idempotent — existing docs are skipped unless `--force` is passed. See [`firebase/seed/README.md`](./firebase/seed/README.md) for full options.

---

## 7. Grant yourself admin

Pick one of three paths (in order of preference):

**Auto-promote (easiest).** The package ships an `onUserCreate` Firestore trigger in the `caspian-admin` codebase that promotes whoever creates the first `users/{uid}` doc — and permanently stops the moment any admin exists, so it's only ever a first-install helper. Deploy the admin codebase (§5 — no Stripe secrets needed), *then* sign up at `/auth/register`. Registering before the trigger is deployed means auto-promote can't fire retroactively — use the CLI path below instead.

**CLI (explicit, works any time).**

```bash
# by email (preferred):
node node_modules/@caspian-explorer/script-caspian-store/firebase/seed/grant-admin.mjs \
  --project <projectId> \
  --credentials ./service-account.json \
  --email you@example.com

# or by uid — open /admin while signed in; the AdminGuard access-denied
# screen renders your uid with a Copy button:
node node_modules/@caspian-explorer/script-caspian-store/firebase/seed/grant-admin.mjs \
  --project <projectId> \
  --credentials ./service-account.json \
  --uid <your-uid>
```

Scaffolded projects have this wired to `npm run grant-admin -- --email ...`.

**Firestore console (fallback).** Set `users/{uid}.role = 'admin'` by hand.

Admin pages gate on `role === 'admin'`; without it `<AdminGuard>` renders an access-denied screen with your uid pre-filled for copy-paste.

---

## 8. Mount routes

Every route is a one-liner re-export of the matching package component.

### Storefront

```tsx
// src/app/page.tsx
import { HomePage } from '@caspian-explorer/script-caspian-store';
export default function Home() { return <HomePage />; }

// src/app/product/[id]/page.tsx
'use client';
import { useParams } from 'next/navigation';
import { ProductDetailPage } from '@caspian-explorer/script-caspian-store';
export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <ProductDetailPage productId={id} />;
}

// src/app/collections/page.tsx
import { ProductListPage } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <ProductListPage title="Shop" />; }

// src/app/cart/page.tsx — full-page cart (<SiteHeader> already shows a cart drawer too)
import { useState } from 'react';
import { CartSheet } from '@caspian-explorer/script-caspian-store';
export default function Page() {
  const [open, setOpen] = useState(true);
  return <CartSheet open={open} onOpenChange={setOpen} />;
}

// src/app/checkout/page.tsx
'use client';
import { CheckoutPage } from '@caspian-explorer/script-caspian-store';
export default function Page() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return (
    <CheckoutPage
      successUrl={`${origin}/orders/success?session_id={CHECKOUT_SESSION_ID}`}
      cancelUrl={`${origin}/checkout`}
    />
  );
}

// src/app/orders/success/page.tsx
'use client';
import { useSearchParams } from 'next/navigation';
import { OrderConfirmationPage } from '@caspian-explorer/script-caspian-store';
export default function Page() {
  const sessionId = useSearchParams().get('session_id');
  return sessionId ? <OrderConfirmationPage orderId={sessionId} /> : null;
}
```

### Auth + account

```tsx
// src/app/auth/login/page.tsx, register/page.tsx, forgot-password/page.tsx
import { LoginPage, RegisterPage, ForgotPasswordPage } from '@caspian-explorer/script-caspian-store';
// (one file per route, export default the matching component)

// src/app/account/page.tsx
import { AccountPage } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <AccountPage />; }
```

`<AccountPage>` is a composed view; swap for individual cards if you want a custom layout:

```tsx
import { ProfileCard, AddressBook, ChangePasswordCard, OrderHistoryList, ProfilePhotoCard, DeleteAccountCard } from '@caspian-explorer/script-caspian-store';
```

### Editorial / content

```tsx
// journal + detail
import { JournalListPage, JournalDetailPage } from '@caspian-explorer/script-caspian-store';

// any /about, /contact, /privacy, /terms, /sustainability, etc.
import { PageContentView } from '@caspian-explorer/script-caspian-store';
export default function About() {
  return <PageContentView pageKey="about" fallback={{ title: 'About', content: 'Edit in /admin/pages.' }} />;
}

// FAQ + shipping + size
import { FaqsPage, ShippingReturnsPage, SizeGuidePage } from '@caspian-explorer/script-caspian-store';
```

### Admin (gate on role = 'admin')

```tsx
// src/app/admin/layout.tsx
'use client';
import { AdminGuard, AdminShell } from '@caspian-explorer/script-caspian-store';
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGuard><AdminShell>{children}</AdminShell></AdminGuard>;
}

// One file per route, each exporting the matching package component:
import {
  AdminDashboard,
  AdminProductsList, AdminProductEditor,
  AdminOrdersList, AdminOrderDetail,
  AdminReviewsModeration,
  AdminJournalPage,
  AdminPagesPage,
  AdminFaqsPage,
  AdminShippingPage,
  AdminPromoCodesPage,
  AdminSubscribersPage,
  AdminProductCategoriesPage,
  AdminProductCollectionsPage,
  AdminLanguagesPage,
  AdminSiteSettingsPage,
} from '@caspian-explorer/script-caspian-store';
```

See [`scaffold/create.mjs`](./scaffold/create.mjs) for the full 48-file mount list.

---

## 9. i18n (optional)

### Single locale with overrides

```tsx
import { CaspianStoreProvider, DEFAULT_MESSAGES } from '@caspian-explorer/script-caspian-store';

const messages = {
  ...DEFAULT_MESSAGES,
  'navigation.brand': 'My Store',
  'footer.newsletter.title': 'Join the list',
};

<CaspianStoreProvider firebaseConfig={...} locale="en" messages={messages}>{...}</CaspianStoreProvider>
```

### Multiple locales

```tsx
<CaspianStoreProvider
  firebaseConfig={...}
  locale={currentLocale}
  messagesByLocale={{
    en: { ...DEFAULT_MESSAGES, 'navigation.brand': 'STORE' },
    ar: { ...DEFAULT_MESSAGES, 'navigation.brand': 'المتجر' },
    // … de, es, fr …
  }}
>
  {children}
</CaspianStoreProvider>
```

RTL locales (ar, he, fa, ur) automatically set `--caspian-direction: rtl` on the document — point your CSS at it. See the package's [i18n README](./src/i18n) for ICU-subset plural syntax.

---

## 10. Theming + fonts + hero

Visit `/admin/settings` (site settings) and `/` → "Script settings" (or mount `<ScriptSettingsPage>`) to edit:

- **Brand name / currency** → flows into header / footer / cart totals.
- **Theme tokens** (`primaryColor`, `accentColor`, `radius`) → pushed to `:root` CSS custom properties.
- **Hero** (title, subtitle, CTA label, CTA href, image) → rendered on the homepage.
- **Fonts** (body, headline) → auto-loaded via Google Fonts `<link>` tags.
- **Feature flags** (reviews, questions, wishlist, newsletter, promo codes) → toggle surfaces on/off.

---

## 11. Deploy the Next.js frontend

Two supported hosts. Both need the same `NEXT_PUBLIC_*` env vars from [§3](#3-mount-the-provider) re-entered on the host side (Next.js inlines them into the client bundle at build time, so they must be set before the host runs `next build`). The Stripe webhook keeps pointing at the Cloud Function deployed in [§5](#5-deploy-stripe-cloud-functions) regardless of which host you pick — you don't reconfigure it when switching.

### Vercel

Zero-config native Next.js host. Splits hosting (Vercel) from backend (Firebase).

```bash
# Option A: push to GitHub, then import the repo at https://vercel.com/new
# Option B: install the CLI and deploy directly:
npx vercel@latest        # first run: links the project
npx vercel@latest --prod # subsequent deploys
```

After the first deploy, paste every variable from your local `.env.local` into **Project Settings → Environment Variables** in the Vercel dashboard, then redeploy. Apply them to Production / Preview / Development as needed.

### Firebase App Hosting

Firebase's current Next.js-native target (git-based, Cloud Build → Cloud Run). Keeps everything on Firebase.

```bash
firebase init apphosting       # creates a backend, links your GitHub repo
firebase deploy --only apphosting
```

Create an `apphosting.yaml` at the project root listing the `NEXT_PUBLIC_*` vars with `availability: [BUILD, RUNTIME]` (BUILD is required — `NEXT_PUBLIC_*` must be inlined at build time):

```yaml
runConfig:
  minInstances: 0
  maxInstances: 1
env:
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    value: ""
    availability: [BUILD, RUNTIME]
  # … repeat for the other NEXT_PUBLIC_FIREBASE_* vars + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

Fill the values in **Firebase console → App Hosting → your backend → Environment variables**, or commit them to `apphosting.yaml` (they're already public — bundled into the client). For anything sensitive, use `firebase apphosting:secrets:set <NAME>` and switch the entry from `value:` to `secret: <NAME>`.

Consumers who used the [one-command scaffolder](#0-one-command-scaffold) already get an `apphosting.yaml` with the seven vars pre-declared.

---

## 12. Upgrade

Pin to a tag; bump when ready:

```bash
npm install github:Caspian-Explorer/script-caspian-store#vX.Y.Z
```

See [CHANGELOG.md](./CHANGELOG.md) for release notes and migration guidance per version.

---

## Troubleshooting

**"auth/invalid-api-key"** — your `.env.local` values didn't load. Next.js reads `.env.local` at build time; restart `npm run dev`.

**Admin pages say "access denied"** — you haven't set `users/{yourUid}.role = 'admin'`. See [§7](#7-grant-yourself-admin).

**Cart doesn't persist across refreshes** — when signed out, cart lives in `localStorage`. When signed in, it syncs to `carts/{uid}`. Check that Firestore rules from [§4](#4-deploy-firestore-rules--indexes--storage-rules) are deployed.

**Stripe Checkout redirects to a 404** — confirm your `successUrl` matches an actual route and includes `{CHECKOUT_SESSION_ID}` (Stripe substitutes it server-side).

**Webhook order never writes** — check the Stripe dashboard event log for `checkout.session.completed` failures; usually the `STRIPE_WEBHOOK_SECRET` is wrong. Re-run `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET` after rotating in Stripe.

**`font-family: Lato / Montserrat` not applying** — the `<FontLoader>` inside `<CaspianStoreProvider>` injects `<link>` tags at mount. If you use a strict CSP, allow `https://fonts.googleapis.com` and `https://fonts.gstatic.com`.
