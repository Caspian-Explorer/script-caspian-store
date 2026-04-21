# Install guide

This document covers installing `@caspian-explorer/script-caspian-store` into a consumer app, deploying Firestore rules/indexes, and wiring up Stripe via Firebase Cloud Functions.

## 1. Install the package

The package ships from the private GitHub repo. Consumers must have read access.

```bash
npm install github:Caspian-Explorer/script-caspian-store#v1.4.0 firebase
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

## 7. Mount storefront pages (v0.2.0)

```tsx
// app/shop/page.tsx
'use client';
import { ProductListPage } from '@caspian-explorer/script-caspian-store';
export default function Shop() {
  return <ProductListPage title="Shop" />;
}

// app/product/[id]/page.tsx
'use client';
import { useParams } from 'next/navigation';
import { ProductDetailPage } from '@caspian-explorer/script-caspian-store';
export default function Product() {
  const { id } = useParams<{ id: string }>();
  return <ProductDetailPage productId={id} />;
}
```

A floating cart drawer can live anywhere:

```tsx
'use client';
import { useState } from 'react';
import { CartSheet, useCart, Button } from '@caspian-explorer/script-caspian-store';
export function CartButton() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>Cart ({count})</Button>
      <CartSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
```

## 8. Mount checkout + order confirmation (v0.3.0)

```tsx
// app/checkout/page.tsx
'use client';
import { CheckoutPage } from '@caspian-explorer/script-caspian-store';
export default function CheckoutRoute() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return (
    <CheckoutPage
      successUrl={`${origin}/orders/success`}
      cancelUrl={`${origin}/checkout`}
    />
  );
}

// app/orders/success/page.tsx
'use client';
import { useSearchParams } from 'next/navigation';
import { OrderConfirmationPage } from '@caspian-explorer/script-caspian-store';
export default function OrderSuccess() {
  const sessionId = useSearchParams().get('session_id');
  return sessionId ? <OrderConfirmationPage orderId={sessionId} /> : null;
}
```

**Stripe webhook setup** — in your Stripe dashboard, add an endpoint pointing at the deployed `stripeWebhook` HTTPS function (e.g. `https://<region>-<project>.cloudfunctions.net/stripeWebhook`) and subscribe to `checkout.session.completed`. Put the resulting `whsec_…` into the `STRIPE_WEBHOOK_SECRET` secret (see step 5).

**Order history on an account page:**

```tsx
import { OrderHistoryList } from '@caspian-explorer/script-caspian-store';
<OrderHistoryList />
```

**Wishlist button on a product card:**

```tsx
import { WishlistButton } from '@caspian-explorer/script-caspian-store';
<WishlistButton productId={product.id} />
```

## 9. Mount the admin panel (v0.4.0)

```tsx
// app/admin/layout.tsx
'use client';
import type { ReactNode } from 'react';
import { AdminGuard, AdminShell } from '@caspian-explorer/script-caspian-store';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}

// app/admin/page.tsx
'use client';
import { AdminDashboard } from '@caspian-explorer/script-caspian-store';
export default function AdminHome() { return <AdminDashboard />; }

// app/admin/products/page.tsx
'use client';
import { AdminProductsList } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <AdminProductsList />; }

// app/admin/products/new/page.tsx
'use client';
import { AdminProductEditor } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <AdminProductEditor />; }

// app/admin/products/[id]/edit/page.tsx
'use client';
import { useParams } from 'next/navigation';
import { AdminProductEditor } from '@caspian-explorer/script-caspian-store';
export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <AdminProductEditor productId={id} />;
}

// app/admin/orders/page.tsx
'use client';
import { AdminOrdersList } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <AdminOrdersList />; }

// app/admin/orders/[id]/page.tsx
'use client';
import { useParams } from 'next/navigation';
import { AdminOrderDetail } from '@caspian-explorer/script-caspian-store';
export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <AdminOrderDetail orderId={id} />;
}

// app/admin/reviews/page.tsx
'use client';
import { AdminReviewsModeration } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <AdminReviewsModeration />; }
```

Customize the sidebar by passing `navItems` to `<AdminShell>`:

```tsx
import { AdminShell, type AdminNavItem } from '@caspian-explorer/script-caspian-store';
const items: AdminNavItem[] = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/settings', label: 'Settings' },
  { href: '/admin/my-custom-page', label: 'My page' },
];
<AdminShell navItems={items}>{children}</AdminShell>
```

## 10. Mount auth & account pages (v0.5.0)

```tsx
// app/login/page.tsx
'use client';
import { LoginPage } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <LoginPage />; }

// app/register/page.tsx
'use client';
import { RegisterPage } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <RegisterPage />; }

// app/forgot-password/page.tsx
'use client';
import { ForgotPasswordPage } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <ForgotPasswordPage />; }

// app/account/page.tsx
'use client';
import { AccountPage } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <AccountPage />; }
```

If you'd rather compose the account page yourself, use the individual cards:

```tsx
import {
  ProfileCard,
  AddressBook,
  ChangePasswordCard,
  OrderHistoryList,
} from '@caspian-explorer/script-caspian-store';

export function MyAccount() {
  return (
    <>
      <ProfileCard />
      <ChangePasswordCard />
      <AddressBook />
      <OrderHistoryList />
    </>
  );
}
```

## 11. i18n, theming presets, profile photos (v0.6.0)

### Pass a locale + message overrides to the provider

```tsx
import {
  CaspianStoreProvider,
  DEFAULT_MESSAGES,
} from '@caspian-explorer/script-caspian-store';

const messages = {
  ...DEFAULT_MESSAGES,
  'auth.login.title': 'Welcome back',
  'auth.login.submit': 'Log in',
};

<CaspianStoreProvider firebaseConfig={...} locale="en" messages={messages}>
  {children}
</CaspianStoreProvider>
```

Use translations in your own components via `useT()`:

```tsx
import { useT } from '@caspian-explorer/script-caspian-store';
export function MyHeader() {
  const t = useT();
  return <h1>{t('account.title')}</h1>;
}
```

### Deploy Storage rules (profile photos)

```bash
cp node_modules/@caspian-explorer/script-caspian-store/firebase/storage.rules storage.rules
firebase deploy --only storage
```

The rules let users write only to `users/{uid}/avatar.{ext}`, capped at 5 MB and image mimetype. Public read so product cards can display review avatars.

## 12. Visit `/settings` (or whatever route you mount)

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
npm install github:Caspian-Explorer/script-caspian-store#v1.4.0
```

See [CHANGELOG.md](./CHANGELOG.md) for release notes.
