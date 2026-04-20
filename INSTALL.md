# Install guide

This document covers installing `@caspian-explorer/script-caspian-store` into a consumer app, deploying Firestore rules/indexes, and wiring up Stripe via Firebase Cloud Functions.

## 1. Install the package

The package ships from the private GitHub repo. Consumers must have read access.

```bash
npm install github:Caspian-Explorer/script-caspian-store#v0.1.0-alpha firebase
# or pin to a commit:
# npm install github:Caspian-Explorer/script-caspian-store#<sha>
```

For private-repo access, GitHub's [`git` over HTTPS](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) or SSH works — same credentials you use for `git clone`.

## 2. Provide Firebase config

Create a Firebase project at <https://console.firebase.google.com>. Enable **Firestore**, **Authentication** (Email/Password + Google), and **Functions**.

Copy the config object into your app's env vars.

## 3. Mount the provider

### Next.js (App Router)

```tsx
// app/providers.tsx
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  CaspianStoreProvider,
  type CaspianLinkProps,
  type CaspianImageProps,
} from '@caspian-explorer/script-caspian-store';
import '@caspian-explorer/script-caspian-store/styles.css';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

function CaspianNextLink({ href, children, ...rest }: CaspianLinkProps) {
  return <Link href={href} {...rest}>{children}</Link>;
}

function CaspianNextImage({ src, alt, width, height, fill, priority, className, sizes }: CaspianImageProps) {
  if (fill) return <Image src={src} alt={alt} fill priority={priority} className={className} sizes={sizes} />;
  return <Image src={src} alt={alt} width={width ?? 600} height={height ?? 400} priority={priority} className={className} sizes={sizes} />;
}

function useCaspianNextNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  return {
    pathname: pathname ?? '/',
    push: (href: string) => router.push(href),
    replace: (href: string) => router.replace(href),
    back: () => router.back(),
  };
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CaspianStoreProvider
      firebaseConfig={firebaseConfig}
      adapters={{
        Link: CaspianNextLink,
        Image: CaspianNextImage,
        useNavigation: useCaspianNextNavigation,
      }}
    >
      {children}
    </CaspianStoreProvider>
  );
}
```

Wrap your root layout with `<Providers>` in `app/layout.tsx`. See [`examples/nextjs/`](./examples/nextjs) for a runnable version.

### Vite / React Router

```tsx
// src/providers.tsx
import { CaspianStoreProvider } from '@caspian-explorer/script-caspian-store';
import '@caspian-explorer/script-caspian-store/styles.css';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function useCaspianRouterNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  return {
    pathname: location.pathname,
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CaspianStoreProvider
      firebaseConfig={firebaseConfig}
      adapters={{
        Link: ({ href, children, ...rest }) => <Link to={href} {...rest}>{children}</Link>,
        useNavigation: useCaspianRouterNavigation,
      }}
    >
      {children}
    </CaspianStoreProvider>
  );
}
```

### Create React App

Same as Vite, but read env vars with `process.env.REACT_APP_*`.

## 4. Deploy Firestore rules and indexes

The package ships deployable files at `firebase/firestore.rules` and `firebase/firestore.indexes.json`.

```bash
# From the consumer app
mkdir -p firestore
cp node_modules/@caspian-explorer/script-caspian-store/firebase/firestore.rules firestore.rules
cp node_modules/@caspian-explorer/script-caspian-store/firebase/firestore.indexes.json firestore.indexes.json

firebase init firestore        # accept the copied files
firebase deploy --only firestore:rules,firestore:indexes
```

If you already have a `firestore.rules` file, merge the `match /<collection>/{id} { ... }` blocks into yours.

## 5. Deploy Cloud Functions (Stripe)

```bash
# Copy the functions folder once into your Firebase project root.
cp -R node_modules/@caspian-explorer/script-caspian-store/firebase/functions ./functions
cp node_modules/@caspian-explorer/script-caspian-store/firebase/firebase.json ./firebase.json  # merge if you have one

cd functions
npm install
cd ..

firebase functions:secrets:set STRIPE_SECRET_KEY       # paste sk_live_... or sk_test_...
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET   # paste whsec_...

firebase deploy --only functions:caspian-store
```

Configure your Stripe webhook endpoint to point at the deployed `stripeWebhook` URL and subscribe to `checkout.session.completed`.

## 6. Grant yourself admin role

After signing in with Firebase Auth once, open Firestore and set your user doc to:

```
users/{yourUid}
  role: "admin"
```

Admin role gates `<ScriptSettingsPage />` and future admin surfaces.

## 7. Visit `/settings` (or whatever route you mount)

Mount the Script Settings page on any protected route in your app:

```tsx
import { ScriptSettingsPage } from '@caspian-explorer/script-caspian-store';

export default function Page() {
  return <ScriptSettingsPage />;
}
```

Set brand info, currency, theme colors, and feature flags. Changes are live — the provider subscribes to Firestore and pushes theme tokens into CSS custom properties on `:root`.

## Upgrading

Pin to a tag and bump when ready:

```bash
npm install github:Caspian-Explorer/script-caspian-store#v0.2.0
```

See [CHANGELOG.md](./CHANGELOG.md) for release notes.
