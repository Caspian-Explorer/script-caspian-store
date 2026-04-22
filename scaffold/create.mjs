#!/usr/bin/env node
/**
 * create-caspian-store — scaffolds a fresh Next.js consumer site wired up to
 * @caspian-explorer/script-caspian-store.
 *
 * Usage:
 *   node <path-to-package>/scaffold/create.mjs <project-dir>
 *     [--package-tag vX.Y.Z]        # defaults to the package's own version
 *     [--next-version <spec>]       # pin for next in generated package.json; default ^15.0.0
 *     [--use-create-next-app]       # delegate Next.js boilerplate to `npx create-next-app`
 *                                    # for drift-free tsconfig / next.config / next-env.d.ts
 *     [--with-stripe]               # also copy firebase/functions-stripe/ (Stripe checkout
 *                                    #   + webhook) — admin codebase is always scaffolded
 *     [--with-functions]            # deprecated alias for --with-stripe (back-compat)
 *     [--force]                     # scaffold into a non-empty dir (.git / .gitignore /
 *                                    #   README.md / LICENSE are preserved without --force)
 *
 * What you get:
 *   - Next.js App Router project in <project-dir>/ (default Next pin: ^15.0.0)
 *   - All storefront + admin + content routes pre-mounted as one-liners
 *   - Next.js adapter code (Link/Image/useNavigation) for the package
 *   - Real firestore.rules / firestore.indexes.json / storage.rules copied
 *     from the package (deployable immediately)
 *   - .env.example with Firebase + Stripe placeholders
 *   - Scripts in package.json for dev / typecheck / seed / grant-admin
 *
 * After scaffolding, `cd <project-dir> && npm install` and follow the README.
 */

import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, cpSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = resolve(__dirname, '..');
const ownVersion = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')).version;

const { positionals, values: args } = parseArgs({
  options: {
    'package-tag': { type: 'string', default: `v${ownVersion}` },
    'next-version': { type: 'string', default: '^15.0.0' },
    'use-create-next-app': { type: 'boolean', default: false },
    force: { type: 'boolean', default: false },
    'with-stripe': { type: 'boolean', default: false },
    'with-functions': { type: 'boolean', default: false },
  },
  allowPositionals: true,
});

// --with-functions used to mean "copy the Stripe Cloud Functions tree"; it now
// only affects the Stripe codebase (admin codebase is always scaffolded), so
// treat it as an alias for --with-stripe to avoid breaking existing callers.
const includeStripe = args['with-stripe'] || args['with-functions'];

const targetDir = positionals[0];
if (!targetDir) {
  console.error(
    'Usage: node create.mjs <project-dir> [--package-tag vX.Y.Z] [--next-version <spec>]\n' +
    '                       [--use-create-next-app] [--with-stripe] [--force]',
  );
  process.exit(1);
}

// Files a freshly-initialised repo might already contain — these are preserved
// as-is during scaffolding. Anything else forces --force.
const HARMLESS_FILES = new Set(['.git', '.gitignore', 'README.md', 'LICENSE']);

const root = resolve(process.cwd(), targetDir);
if (existsSync(root) && !args.force) {
  const unrecognized = readdirSync(root).filter((name) => !HARMLESS_FILES.has(name));
  if (unrecognized.length > 0) {
    console.error(
      `[create-caspian-store] ${root} contains files that would be overwritten: ${unrecognized.join(', ')}\n` +
      `  Safe files (${[...HARMLESS_FILES].join(', ')}) would be preserved; pass --force to scaffold anyway.`
    );
    process.exit(1);
  }
}
mkdirSync(root, { recursive: true });

const packageTag = args['package-tag'];
const packageSpec = `github:Caspian-Explorer/script-caspian-store#${packageTag}`;
const nextVersion = args['next-version'];
const useCreateNextApp = args['use-create-next-app'];
const sourceFirebaseDir = join(packageRoot, 'firebase');

function write(relPath, content) {
  const abs = join(root, relPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

// ---- optional: delegate Next.js boilerplate to create-next-app ----
// When enabled, `npx create-next-app@latest` writes tsconfig.json, next.config.*,
// next-env.d.ts, .gitignore, a starter src/app/ tree, public/ assets, and a
// package.json. We then overlay our pages, adapters, providers, firebase config,
// and merge our deps + scripts into the package.json it wrote. This insulates
// the tsconfig / next.config shape from drifting out of step with Next upstream
// without us having to chase every Next release.
if (useCreateNextApp) {
  // On Windows the npx wrapper is npx.cmd; spawning it directly bypasses
  // PATHEXT resolution and exits null. Using shell: true routes through
  // cmd.exe which handles the .cmd suffix. Elsewhere we spawn directly —
  // faster and avoids the "args + shell:true" deprecation.
  const isWindows = process.platform === 'win32';
  const cnaArgs = [
    '--yes',
    'create-next-app@latest',
    root,
    '--typescript',
    '--app',
    '--src-dir',
    '--no-tailwind',
    '--no-eslint',
    '--import-alias',
    '@/*',
    '--use-npm',
    '--yes',
    '--skip-install',
    '--disable-git',
  ];
  const result = isWindows
    ? spawnSync(
        `npx ${cnaArgs.map((a) => (/[\s*]/.test(a) ? `"${a}"` : a)).join(' ')}`,
        { stdio: 'inherit', shell: true },
      )
    : spawnSync('npx', cnaArgs, { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(
      '[create-caspian-store] create-next-app exited with status ' + result.status,
    );
    process.exit(result.status ?? 1);
  }
}

// ---- package.json ----
// When delegating to create-next-app, merge into what it wrote so we keep
// Next's current dep pins and scripts. Otherwise write a hand-rolled version.
const ourScripts = {
  typecheck: 'tsc --noEmit',
  'firebase:deploy': 'firebase deploy',
  'firebase:seed': 'node node_modules/@caspian-explorer/script-caspian-store/firebase/seed/seed.mjs',
  'grant-admin': 'node node_modules/@caspian-explorer/script-caspian-store/firebase/seed/grant-admin.mjs',
};
const ourDeps = {
  '@caspian-explorer/script-caspian-store': packageSpec,
  firebase: '^11.0.0',
};
const ourDevDeps = {
  // v13 drops the transitive @tootallnate/once / older @google-cloud/* chain
  // that triggers `npm audit` noise on fresh scaffolds. APIs used by seed.mjs
  // and grant-admin.mjs (admin.initializeApp / firestore / auth) are stable
  // from 12 → 13.
  'firebase-admin': '^13.0.0',
};

if (useCreateNextApp) {
  const pkgPath = join(root, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.scripts = { ...(pkg.scripts ?? {}), ...ourScripts };
  pkg.dependencies = { ...(pkg.dependencies ?? {}), ...ourDeps };
  if (nextVersion) pkg.dependencies.next = nextVersion;
  pkg.devDependencies = { ...(pkg.devDependencies ?? {}), ...ourDevDeps };
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
} else {
  write('package.json', JSON.stringify({
    name: targetDir.split(/[\\/]/).pop(),
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      ...ourScripts,
    },
    dependencies: {
      ...ourDeps,
      next: nextVersion,
      react: '^18.3.0',
      'react-dom': '^18.3.0',
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      typescript: '^5.6.0',
      ...ourDevDeps,
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
}

// ---- .env.example ----
write('.env.example', `# Firebase web config (from Firebase console → Project settings → Your apps)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Stripe publishable key (Stripe dashboard → Developers → API keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Note: STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are *Cloud Functions secrets*,
# not env vars. Set them with:
#   firebase functions:secrets:set STRIPE_SECRET_KEY
#   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
`);

// ---- .gitignore + next-env.d.ts ----
// create-next-app writes both; skip when delegating. Otherwise emit our own.
if (!useCreateNextApp) {
  write('.gitignore', `node_modules
.next
.env*.local
*.log
service-account*.json
`);
  write('next-env.d.ts', `/// <reference types="next" />
/// <reference types="next/image-types/global" />
`);
}

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
          <DynamicFavicon />
        </Providers>
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
  ['todos', 'AdminTodoPage'],
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

// ---- Firebase config ----
// Copy the real rule files from the package's own firebase/ tree, so the user
// can `firebase deploy --only firestore:rules,firestore:indexes,storage`
// immediately after scaffolding. Previously these were comment-only stubs,
// which meant a user who ran `firebase deploy` before reading the file would
// deploy an empty rules file and lock the database down.
write('firestore.rules', readFileSync(join(sourceFirebaseDir, 'firestore.rules'), 'utf8'));
write('firestore.indexes.json', readFileSync(join(sourceFirebaseDir, 'firestore.indexes.json'), 'utf8'));
write('storage.rules', readFileSync(join(sourceFirebaseDir, 'storage.rules'), 'utf8'));

// Functions codebase split (v1.16.0+): caspian-admin is always scaffolded —
// it contains only the `onUserCreate` auto-promote trigger, no Stripe deps,
// no secrets, deployable without a Stripe account. caspian-stripe ships
// checkout + webhook + session lookup and requires STRIPE_SECRET_KEY /
// STRIPE_WEBHOOK_SECRET; opt in with --with-stripe.
//
// Pre-split behaviour (single `caspian-store` codebase) forced every install
// to pre-configure Stripe secrets before deploying any function, even the
// admin trigger. Splitting lets a non-Stripe install deploy onUserCreate
// immediately, closing the admin-bootstrap chicken-and-egg loop.
const firebaseConfig = {
  firestore: {
    rules: 'firestore.rules',
    indexes: 'firestore.indexes.json',
  },
  storage: { rules: 'storage.rules' },
  functions: [
    {
      source: 'functions-admin',
      codebase: 'caspian-admin',
      runtime: 'nodejs22',
      predeploy: ['npm --prefix "$RESOURCE_DIR" run build'],
    },
  ],
};
if (includeStripe) {
  firebaseConfig.functions.push({
    source: 'functions-stripe',
    codebase: 'caspian-stripe',
    runtime: 'nodejs20',
    predeploy: ['npm --prefix "$RESOURCE_DIR" run build'],
  });
}
write('firebase.json', JSON.stringify(firebaseConfig, null, 2) + '\n');

// Always copy functions-admin; copy functions-stripe only on opt-in.
cpSync(join(sourceFirebaseDir, 'functions-admin'), join(root, 'functions-admin'), { recursive: true });
if (includeStripe) {
  cpSync(join(sourceFirebaseDir, 'functions-stripe'), join(root, 'functions-stripe'), { recursive: true });
}

// ---- apphosting.yaml ----
// Firebase App Hosting is Firebase's current Next.js-native deploy target
// (git-based, Cloud Build -> Cloud Run). NEXT_PUBLIC_* vars must be available
// at BUILD time for Next.js to inline them into the client bundle; hence
// availability: [BUILD, RUNTIME]. Values left blank by design — consumers fill
// them via the Firebase console or `firebase apphosting:secrets:set` (for the
// sensitive ones). Always emitted: harmless if the consumer deploys to Vercel
// instead, and keeps the "just deploy" path single-command for App Hosting users.
write('apphosting.yaml', `# Firebase App Hosting config. Only read when deploying via Firebase App Hosting.
# Safe to delete if you deploy to Vercel or elsewhere.
#
# NEXT_PUBLIC_* vars must be inlined at build time, so availability must include BUILD.
# For sensitive values (none in this file by default), use Secret Manager + the
# \`secret: <name>\` form instead of \`value:\`.
runConfig:
  minInstances: 0
  maxInstances: 1
env:
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    value: ""
    availability: [BUILD, RUNTIME]
  - variable: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    value: ""
    availability: [BUILD, RUNTIME]
  - variable: NEXT_PUBLIC_FIREBASE_PROJECT_ID
    value: ""
    availability: [BUILD, RUNTIME]
  - variable: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    value: ""
    availability: [BUILD, RUNTIME]
  - variable: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    value: ""
    availability: [BUILD, RUNTIME]
  - variable: NEXT_PUBLIC_FIREBASE_APP_ID
    value: ""
    availability: [BUILD, RUNTIME]
  - variable: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    value: ""
    availability: [BUILD, RUNTIME]
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
3. **Deploy Firestore rules + indexes + Storage rules** (the scaffolder already dropped \`firestore.rules\`, \`firestore.indexes.json\`, and \`storage.rules\` alongside this README):
   \`\`\`bash
   firebase deploy --only firestore:rules,firestore:indexes,storage
   \`\`\`
4. **Deploy Cloud Functions.**
   \`\`\`bash
   cd functions-admin && npm install && cd ..
   firebase deploy --only functions:caspian-admin
   \`\`\`
   This deploys the \`onUserCreate\` auto-promote trigger (no secrets needed). **Do this before anyone registers** or auto-promote can't retroactively fire on an already-created user doc.

   If you also scaffolded with \`--with-stripe\`, deploy the Stripe codebase separately once you have your keys:
   \`\`\`bash
   cd functions-stripe && npm install && cd ..
   firebase functions:secrets:set STRIPE_SECRET_KEY      # paste sk_test_... or sk_live_...
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET  # from Stripe dashboard → Webhooks
   firebase deploy --only functions:caspian-stripe
   \`\`\`
5. **Seed Firestore:**
   \`\`\`bash
   # After downloading a service-account JSON:
   npm run firebase:seed -- --project <projectId> --credentials ./service-account.json
   \`\`\`
6. **Grant yourself admin.** If you deployed \`caspian-admin\` in §4 *before* registering, the \`onUserCreate\` trigger auto-promotes the first-ever user — just sign up at \`/auth/register\`. If you registered before the deploy (or the auto-promote window has closed), use the CLI:
   \`\`\`bash
   npm run grant-admin -- --project <projectId> --credentials ./service-account.json --email you@example.com
   \`\`\`
   (If the auto-promote window has closed, this is the explicit path. The AdminGuard access-denied screen also shows your uid with a Copy button if you prefer \`--uid\`.)
7. **Open /admin/settings** to set brand name, logo, social links.
8. **Deploy the Next.js site.** Two supported hosts — pick one:

   **Vercel** (zero-config, native Next.js host):
   \`\`\`bash
   # Option A: push to GitHub, then import the repo at https://vercel.com/new
   # Option B: install the CLI and deploy directly:
   npx vercel@latest        # first run: links the project
   npx vercel@latest --prod # subsequent deploys
   \`\`\`
   After the first deploy, paste every variable from your local \`.env.local\` into **Project Settings → Environment Variables** in the Vercel dashboard, then redeploy. Firestore, Storage, and Cloud Functions stay on Firebase — Vercel only hosts the Next.js site.

   **Firebase App Hosting** (keeps everything on Firebase):
   \`\`\`bash
   firebase init apphosting       # creates a backend, links your GitHub repo
   firebase deploy --only apphosting
   \`\`\`
   The scaffolder already dropped an \`apphosting.yaml\` with the \`NEXT_PUBLIC_*\` vars declared but empty. Fill the values in **Firebase console → App Hosting → your backend → Environment variables**, or commit them to \`apphosting.yaml\` (they're already public — bundled into the client). For anything sensitive, use \`firebase apphosting:secrets:set <NAME>\` and switch the entry in \`apphosting.yaml\` from \`value:\` to \`secret: <NAME>\`.

   Either host works with the same Stripe webhook endpoint — the webhook points at a Cloud Function (\`https://<region>-<project-id>.cloudfunctions.net/stripeWebhook\`), not at your Next.js site, so you don't reconfigure it when switching hosts.

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
- \`/admin/todos\` — setup + operational checklist (seed defaults on first visit)
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

Stop any running \`next dev\` first — swapping the package under a live dev server corrupts \`.next\` state and every route starts 500'ing with no obvious clue.

\`\`\`bash
# 1. Stop next dev (Ctrl+C).
# 2. Bump the dep:
npm install github:Caspian-Explorer/script-caspian-store#vX.Y.Z
# 3. If the CHANGELOG for the target release mentions rule changes,
#    copy the updated rules and redeploy:
npm run firebase:sync 2>/dev/null || true  # (available in v1.18+; otherwise copy by hand)
firebase deploy --only firestore:rules,firestore:indexes,storage
# 4. Clear the stale Next cache and restart:
rm -rf .next
npm run dev
\`\`\`

See [CHANGELOG](https://github.com/Caspian-Explorer/script-caspian-store/blob/main/CHANGELOG.md) for release-specific notes.
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
