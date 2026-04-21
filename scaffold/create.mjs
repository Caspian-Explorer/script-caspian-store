#!/usr/bin/env node
/**
 * create-caspian-store — scaffolds a fresh Next.js consumer site wired up to
 * @caspian-explorer/script-caspian-store.
 *
 * Usage:
 *   node <path-to-package>/scaffold/create.mjs <project-dir> [--package-tag vX.Y.Z]
 *
 *   # Or, via tiged / degit (if network-installed):
 *   npx tiged Caspian-Explorer/script-caspian-store/scaffold/template my-shop
 *
 * What you get:
 *   - Next.js 14 App Router project in <project-dir>/
 *   - All storefront + admin + content routes pre-mounted as one-liners
 *   - Next.js adapter code (Link/Image/useNavigation) for the package
 *   - Firestore rules + indexes copied in
 *   - .env.example with every required variable
 *   - Scripts in package.json for dev / typecheck / seed
 *
 * After scaffolding, `cd <project-dir> && npm install` and follow the README.
 */

import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const { positionals, values: args } = parseArgs({
  options: {
    'package-tag': { type: 'string', default: 'v1.7.0' },
    force: { type: 'boolean', default: false },
  },
  allowPositionals: true,
});

const targetDir = positionals[0];
if (!targetDir) {
  console.error('Usage: node create.mjs <project-dir> [--package-tag vX.Y.Z]');
  process.exit(1);
}

const root = resolve(process.cwd(), targetDir);
if (existsSync(root) && !args.force) {
  console.error(`[create-caspian-store] ${root} already exists. Pass --force to overwrite.`);
  process.exit(1);
}
mkdirSync(root, { recursive: true });

const packageTag = args['package-tag'];
const packageSpec = `github:Caspian-Explorer/script-caspian-store#${packageTag}`;

function write(relPath, content) {
  const abs = join(root, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

// ---- package.json ----
write('package.json', JSON.stringify({
  name: targetDir.split(/[\\/]/).pop(),
  version: '0.1.0',
  private: true,
  scripts: {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
    typecheck: 'tsc --noEmit',
    'firebase:deploy': 'firebase deploy',
    'firebase:seed': 'node node_modules/@caspian-explorer/script-caspian-store/firebase/seed/seed.mjs',
  },
  dependencies: {
    '@caspian-explorer/script-caspian-store': packageSpec,
    firebase: '^11.0.0',
    next: '^14.2.0',
    react: '^18.3.0',
    'react-dom': '^18.3.0',
  },
  devDependencies: {
    '@types/node': '^20.0.0',
    '@types/react': '^18.3.0',
    '@types/react-dom': '^18.3.0',
    typescript: '^5.6.0',
    'firebase-admin': '^12.0.0',
  },
}, null, 2) + '\n');

// ---- tsconfig.json ----
write('tsconfig.json', JSON.stringify({
  compilerOptions: {
    target: 'ES2022',
    lib: ['dom', 'dom.iterable', 'esnext'],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: 'esnext',
    moduleResolution: 'bundler',
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: 'preserve',
    incremental: true,
    plugins: [{ name: 'next' }],
    paths: { '@/*': ['./src/*'] },
  },
  include: ['next-env.d.ts', 'src/**/*.ts', 'src/**/*.tsx', '.next/types/**/*.ts'],
  exclude: ['node_modules'],
}, null, 2) + '\n');

// ---- next.config.mjs ----
write('next.config.mjs', `const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};
export default nextConfig;
`);

// ---- .env.example ----
write('.env.example', `# Firebase web config (from Firebase console → Project settings → Your apps)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
`);

// ---- .gitignore ----
write('.gitignore', `node_modules
.next
.env*.local
*.log
service-account*.json
`);

// ---- next-env.d.ts ----
write('next-env.d.ts', `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`);

// ---- src/lib/caspian-adapters.tsx ----
write('src/lib/caspian-adapters.tsx', `'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import type {
  CaspianLinkProps,
  CaspianImageProps,
} from '@caspian-explorer/script-caspian-store';

export const caspianFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export function CaspianNextLink({ href, children, className, style, onClick, target, rel, 'aria-label': al }: CaspianLinkProps) {
  return (
    <Link href={href as any} className={className} style={style} onClick={onClick} target={target} rel={rel} aria-label={al}>
      {children}
    </Link>
  );
}

export function CaspianNextImage({ src, alt, width, height, fill, priority, className, sizes }: CaspianImageProps) {
  if (fill) {
    return <Image src={src} alt={alt} fill priority={priority} className={className} sizes={sizes} />;
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width ?? 600}
      height={height ?? 400}
      priority={priority}
      className={className}
      sizes={sizes}
    />
  );
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
`);

// ---- src/app/providers.tsx ----
write('src/app/providers.tsx', `'use client';

import type { ReactNode } from 'react';
import { CaspianStoreProvider } from '@caspian-explorer/script-caspian-store';
import {
  CaspianNextLink,
  CaspianNextImage,
  useCaspianNextNavigation,
  caspianFirebaseConfig,
} from '@/lib/caspian-adapters';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CaspianStoreProvider
      firebaseConfig={caspianFirebaseConfig}
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
`);

// ---- src/app/layout.tsx ----
write('src/app/layout.tsx', `import type { ReactNode } from 'react';
import { LayoutShell, DynamicFavicon } from '@caspian-explorer/script-caspian-store';
import '@caspian-explorer/script-caspian-store/styles.css';
import { Providers } from './providers';

export const metadata = {
  title: 'Store',
  description: 'A Caspian Store.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <LayoutShell>{children}</LayoutShell>
        </Providers>
        <DynamicFavicon />
      </body>
    </html>
  );
}
`);

// ---- Storefront pages ----
write('src/app/page.tsx', `'use client';
import { HomePage } from '@caspian-explorer/script-caspian-store';
export default function Home() { return <HomePage />; }
`);

write('src/app/product/[id]/page.tsx', `'use client';
import { useParams } from 'next/navigation';
import { ProductDetailPage } from '@caspian-explorer/script-caspian-store';
export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <ProductDetailPage productId={id} />;
}
`);

write('src/app/collections/page.tsx', `'use client';
import { ProductListPage } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <ProductListPage title="Shop" />; }
`);

write('src/app/cart/page.tsx', `'use client';
import { useState } from 'react';
import { CartSheet } from '@caspian-explorer/script-caspian-store';
export default function Page() {
  const [open, setOpen] = useState(true);
  return <CartSheet open={open} onOpenChange={setOpen} />;
}
`);

write('src/app/checkout/page.tsx', `'use client';
import { CheckoutPage } from '@caspian-explorer/script-caspian-store';
export default function Page() {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return (
    <CheckoutPage
      successUrl={\`\${origin}/orders/success?session_id={CHECKOUT_SESSION_ID}\`}
      cancelUrl={\`\${origin}/checkout\`}
    />
  );
}
`);

write('src/app/orders/success/page.tsx', `'use client';
import { useSearchParams } from 'next/navigation';
import { OrderConfirmationPage } from '@caspian-explorer/script-caspian-store';
export default function Page() {
  const sessionId = useSearchParams().get('session_id');
  return sessionId ? <OrderConfirmationPage orderId={sessionId} /> : null;
}
`);

write('src/app/wishlist/page.tsx', `'use client';
export default function Page() {
  return <div style={{ padding: 24 }}>Your wishlist lives inside the account page.</div>;
}
`);

// ---- Auth pages ----
for (const [route, comp] of [
  ['auth/login', 'LoginPage'],
  ['auth/register', 'RegisterPage'],
  ['auth/forgot-password', 'ForgotPasswordPage'],
]) {
  write(`src/app/${route}/page.tsx`, `'use client';
import { ${comp} } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <${comp} />; }
`);
}

write('src/app/account/page.tsx', `'use client';
import { AccountPage } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <AccountPage />; }
`);

// ---- Content pages ----
for (const [route, comp, key, fallback] of [
  ['about', 'PageContentView', 'about', 'About us'],
  ['contact', 'PageContentView', 'contact', 'Contact'],
  ['privacy', 'PageContentView', 'privacy', 'Privacy'],
  ['terms', 'PageContentView', 'terms', 'Terms'],
  ['sustainability', 'PageContentView', 'sustainability', 'Sustainability'],
]) {
  write(`src/app/${route}/page.tsx`, `'use client';
import { PageContentView } from '@caspian-explorer/script-caspian-store';
export default function Page() {
  return <PageContentView pageKey="${key}" fallback={{ title: '${fallback}', content: 'This page has no content yet. Edit it in /admin/pages.' }} />;
}
`);
}

write('src/app/journal/page.tsx', `'use client';
import { JournalListPage } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <JournalListPage />; }
`);

write('src/app/journal/[id]/page.tsx', `'use client';
import { useParams } from 'next/navigation';
import { JournalDetailPage } from '@caspian-explorer/script-caspian-store';
export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <JournalDetailPage articleId={id} />;
}
`);

write('src/app/faqs/page.tsx', `'use client';
import { FaqsPage } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <FaqsPage />; }
`);

write('src/app/shipping-returns/page.tsx', `'use client';
import { ShippingReturnsPage } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <ShippingReturnsPage />; }
`);

write('src/app/size-guide/page.tsx', `'use client';
import { SizeGuidePage } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <SizeGuidePage />; }
`);

// ---- Admin pages ----
write('src/app/admin/layout.tsx', `'use client';
import type { ReactNode } from 'react';
import { AdminGuard, AdminShell } from '@caspian-explorer/script-caspian-store';
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
`);

const adminRoutes = [
  ['', 'AdminDashboard'],
  ['products', 'AdminProductsList'],
  ['orders', 'AdminOrdersList'],
  ['reviews', 'AdminReviewsModeration'],
  ['journal', 'AdminJournalPage'],
  ['pages', 'AdminPagesPage'],
  ['faqs', 'AdminFaqsPage'],
  ['shipping', 'AdminShippingPage'],
  ['promo-codes', 'AdminPromoCodesPage'],
  ['subscribers', 'AdminSubscribersPage'],
  ['categories', 'AdminProductCategoriesPage'],
  ['collections', 'AdminProductCollectionsPage'],
  ['languages', 'AdminLanguagesPage'],
  ['settings', 'AdminSiteSettingsPage'],
];

for (const [sub, comp] of adminRoutes) {
  const path = sub ? `src/app/admin/${sub}/page.tsx` : `src/app/admin/page.tsx`;
  write(path, `'use client';
import { ${comp} } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <${comp} />; }
`);
}

write('src/app/admin/products/new/page.tsx', `'use client';
import { AdminProductEditor } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <AdminProductEditor />; }
`);

write('src/app/admin/products/[id]/edit/page.tsx', `'use client';
import { useParams } from 'next/navigation';
import { AdminProductEditor } from '@caspian-explorer/script-caspian-store';
export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <AdminProductEditor productId={id} />;
}
`);

write('src/app/admin/orders/[id]/page.tsx', `'use client';
import { useParams } from 'next/navigation';
import { AdminOrderDetail } from '@caspian-explorer/script-caspian-store';
export default function Page() {
  const { id } = useParams<{ id: string }>();
  return <AdminOrderDetail orderId={id} />;
}
`);

// ---- Firebase config placeholders ----
// Copy rules/indexes from the package at install time — but since we don't
// know the package location yet, emit instructions instead:
write('firebase.json', JSON.stringify({
  firestore: {
    rules: 'firestore.rules',
    indexes: 'firestore.indexes.json',
  },
  storage: { rules: 'storage.rules' },
  functions: [{ source: 'functions', codebase: 'caspian-store' }],
}, null, 2) + '\n');

write('firestore.rules', `// Copy this file from:
//   node_modules/@caspian-explorer/script-caspian-store/firebase/firestore.rules
// after running \`npm install\`. The package ships a deployable rules file.
`);

write('firestore.indexes.json', JSON.stringify({ indexes: [], fieldOverrides: [] }, null, 2) + `
// Copy from node_modules/@caspian-explorer/script-caspian-store/firebase/firestore.indexes.json
`);

write('storage.rules', `// Copy from node_modules/@caspian-explorer/script-caspian-store/firebase/storage.rules
`);

// ---- README ----
write('README.md', `# ${targetDir.split(/[\\/]/).pop()}

A storefront powered by [\`@caspian-explorer/script-caspian-store\`](https://github.com/Caspian-Explorer/script-caspian-store) (pinned to \`${packageTag}\`).

## Getting started

\`\`\`bash
npm install
cp .env.example .env.local   # fill in Firebase config
npm run dev                  # http://localhost:3000
\`\`\`

## First-run checklist

1. **Create a Firebase project** at <https://console.firebase.google.com>. Enable Authentication (Email/Password + Google), Firestore, Functions, Storage.
2. **Populate \`.env.local\`** with the web config object from Project settings → Your apps.
3. **Deploy Firestore rules + indexes + Storage rules:**
   \`\`\`bash
   cp node_modules/@caspian-explorer/script-caspian-store/firebase/firestore.rules .
   cp node_modules/@caspian-explorer/script-caspian-store/firebase/firestore.indexes.json .
   cp node_modules/@caspian-explorer/script-caspian-store/firebase/storage.rules .
   firebase deploy --only firestore:rules,firestore:indexes,storage
   \`\`\`
4. **Deploy Stripe Cloud Functions** (follow [package INSTALL.md §5](https://github.com/Caspian-Explorer/script-caspian-store/blob/main/INSTALL.md)).
5. **Seed Firestore:**
   \`\`\`bash
   # After downloading a service-account JSON:
   npm run firebase:seed -- --project <projectId> --credentials ./service-account.json
   \`\`\`
6. **Grant yourself admin:** sign up at \`/auth/register\`, copy your uid from Firebase Auth, then:
   \`\`\`bash
   npm run firebase:seed -- --project <projectId> --credentials ./service-account.json --admin <your-uid>
   \`\`\`
7. **Open /admin/settings** to set brand name, logo, social links.

## Routes

### Storefront
- \`/\` — HomePage (hero + featured categories + trending)
- \`/product/[id]\` — product detail
- \`/collections\` — product list
- \`/cart\` — full-page cart (header has a drawer too)
- \`/checkout\`, \`/orders/success\` — Stripe Checkout flow
- \`/account\` — profile, addresses, orders, password, photo, danger zone
- \`/auth/login\`, \`/auth/register\`, \`/auth/forgot-password\`
- \`/about\`, \`/contact\`, \`/privacy\`, \`/terms\`, \`/sustainability\` — editable content pages
- \`/journal\`, \`/journal/[id]\` — editorial
- \`/faqs\`, \`/shipping-returns\`, \`/size-guide\`

### Admin (requires \`users/{uid}.role === 'admin'\`)
- \`/admin\` — dashboard
- \`/admin/products\`, \`/admin/orders\`, \`/admin/reviews\`
- \`/admin/journal\`, \`/admin/pages\`, \`/admin/faqs\`, \`/admin/shipping\`
- \`/admin/promo-codes\`, \`/admin/subscribers\`
- \`/admin/categories\`, \`/admin/collections\`, \`/admin/languages\`
- \`/admin/settings\` — brand / logo / favicon / social

## Customizing

- **Theme, fonts, hero:** admin → Settings, or edit \`scriptSettings/site\` in Firestore.
- **Translations:** pass \`messagesByLocale\` to \`<CaspianStoreProvider>\` in \`src/app/providers.tsx\`.
- **Replace header/footer with your own:** wrap \`children\` in your own chrome and set \`<LayoutShell header={null} footer={null}>\`.

## Upgrade

\`\`\`bash
npm install github:Caspian-Explorer/script-caspian-store#vX.Y.Z
\`\`\`

See [CHANGELOG](https://github.com/Caspian-Explorer/script-caspian-store/blob/main/CHANGELOG.md).
`);

console.log(`[create-caspian-store] scaffolded ${targetDir}/ pinned to ${packageTag}`);
console.log('');
console.log('Next steps:');
console.log(`  cd ${targetDir}`);
console.log('  npm install');
console.log('  cp .env.example .env.local      # fill in Firebase config');
console.log('  npm run dev');
console.log('');
console.log('Then follow the first-run checklist in README.md.');
