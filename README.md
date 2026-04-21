# @caspian-explorer/script-caspian-store

Framework-agnostic React e-commerce store. **Bring your own Firebase.** Install into any React app (Next.js, Vite, CRA).

> **Status: `v1.9.0` — working RSC-boundary install.** The bundle now preserves `'use client'` so Next.js App Router consumers render out of the box, and the `exports` map resolves for both `import` and `require`. See [CHANGELOG](./CHANGELOG.md).

## Quickstart

```bash
npm create caspian-store@latest my-shop
cd my-shop && npm install
cp .env.example .env.local   # fill in Firebase config
npm run dev                  # http://localhost:3000
```

`npm create caspian-store@latest` generates a Next.js 14 App Router project with every storefront, auth, content, and admin route pre-mounted, real deployable Firestore rules, and optional Stripe Cloud Functions (`--with-functions`). See [INSTALL.md](./INSTALL.md) for the full first-run checklist, or the manual-install path below for embedding into an existing app.

### Manual install

```bash
npm install github:Caspian-Explorer/script-caspian-store#vX.Y.Z firebase
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

See [INSTALL.md](./INSTALL.md) for the **one-command scaffolder**, **Vite** / **CRA** snippets, Firebase rules deployment, and Cloud Functions setup.

## What's in the box

| Surface | Status |
| --- | --- |
| `CaspianStoreProvider` + framework adapter contract | ✅ |
| Firebase init (BYOF), auth context, user profile bootstrap | ✅ |
| **Script Settings** — `<ScriptSettingsPage />`, theme tokens via CSS vars | ✅ |
| `firebase/firestore.rules` + `firebase/firestore.indexes.json` | ✅ |
| Cloud Functions — Stripe callable + webhook | ✅ (deployed as scaffold) |
| **Storefront — PLP:** `<ProductListPage />`, `<ProductGrid />`, `<ProductCard />` | ✅ |
| **Storefront — PDP:** `<ProductDetailPage />`, `<ProductGallery />`, size/qty pickers, Add to cart | ✅ |
| **Reviews & Q&A:** `<ProductReviews />` with summary, list, sort, write/ask dialogs, Verified Purchase badge | ✅ |
| **Cart:** `<CartProvider />`, `useCart()`, `<CartSheet />` drawer — Firestore-persisted for signed-in users, localStorage otherwise | ✅ |
| UI primitives: Button, Dialog, Input, Textarea, Label, Tabs, Select, Skeleton, Badge, Avatar, Separator, Toast | ✅ |
| **Checkout:** `useCheckout()` + `<CheckoutPage />` — Stripe redirect via Cloud Function | ✅ |
| **Order confirmation:** `<OrderConfirmationPage />` — polls Firestore for the webhook-created order | ✅ |
| **Order history:** `<OrderHistoryList />` | ✅ |
| **Wishlist:** `useWishlist()` + `<WishlistButton />` | ✅ |
| **Admin:** `<AdminGuard />`, `<AdminShell />`, `<AdminDashboard />`, product CRUD, orders + status, reviews moderation | ✅ |
| **Auth:** `<LoginPage />`, `<RegisterPage />`, `<ForgotPasswordPage />`, `<AccountPage />` (profile, password, addresses, orders) | ✅ |
| **i18n:** `<LocaleProvider>` + `useT()` + `DEFAULT_MESSAGES` + `<LocaleSwitcher />` (all surfaces migrated) | ✅ |
| **Theming:** 6 `THEME_PRESETS` + `<ThemePresetPicker />` | ✅ |
| **Profile photo:** `<ProfilePhotoCard />` (Firebase Storage, JPEG/PNG/WebP ≤5 MB) | ✅ |
| **Delete account:** `<DeleteAccountCard />` with reauth + typed confirmation | ✅ |

## Package surface

```ts
// Provider + hooks
CaspianStoreProvider, useCaspianStore,
useCaspianLink, useCaspianImage, useCaspianNavigation,
useCaspianCollections, useCaspianFirebase,
useAuth, useCart, useScriptSettings, useToast

// Storefront
ProductListPage, ProductGrid, ProductCard,
ProductDetailPage, ProductGallery, SizeSelector, QuantitySelector,
ProductReviews, ReviewSummary, ReviewList, ReviewItem,
QuestionList, QuestionItem, WriteReviewDialog, AskQuestionDialog,
CartSheet, CheckoutPage, OrderConfirmationPage, OrderHistoryList,
WishlistButton, ScriptSettingsPage,
StarIcon, StarRatingInput

// Client hooks
useCheckout, useWishlist

// Admin surface
AdminGuard, AdminShell, DEFAULT_ADMIN_NAV, AdminDashboard,
AdminProductsList, AdminProductEditor,
AdminOrdersList, AdminOrderDetail,
AdminReviewsModeration

// Auth + account
LoginPage, RegisterPage, ForgotPasswordPage,
AccountPage, ProfileCard, AddressBook, ChangePasswordCard,
ProfilePhotoCard, DeleteAccountCard

// i18n
LocaleProvider, LocaleSwitcher, useT, useLocale,
DEFAULT_MESSAGES, interpolate

// Theming
THEME_PRESETS, THEME_PRESET_LABELS, ThemePresetPicker

// UI primitives (also consumable)
Button, Input, Textarea, Label, Dialog,
Tabs, TabsList, TabsTrigger, TabsContent,
Select, Skeleton, Badge, Avatar, Separator

// Services
getProducts, getProductById, getProductsByIds, getRelatedProducts,
getApprovedReviewsForProduct, hasUserReviewedProduct, createReview,
listAllReviews, setReviewStatus, deleteReview,
getApprovedQuestionsForProduct, createQuestion, listAllQuestions,
setQuestionStatus, answerQuestion, deleteQuestion,
hasUserPurchasedProduct, loadUserCart, saveUserCart

// Framework adapter contract
FrameworkAdapters, CaspianLinkProps, CaspianImageProps,
CaspianNavigation, UseCaspianNavigation,
DefaultCaspianLink, DefaultCaspianImage, useDefaultCaspianNavigation
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

- **`"use client"` boundary (Next.js App Router):** the main entry bundle starts with `'use client';`, so package components and hooks can be imported directly from Server Component layouts and pages — the library *is* the client boundary. The `./firebase` sub-entry (`initCaspianFirebase`, `caspianCollections`, and the Firestore rules/indexes constants) is intentionally unbannered, so it stays callable from Node deploy scripts, Cloud Functions, and Server Components.
- **Tree-shaking:** the ESM bundle is side-effect-free except for `styles.css`, which you import once at your app root.
- **One store per page:** pass `appName="my-shop"` if you need multiple `CaspianStoreProvider` instances (e.g. a preview alongside the live storefront).

## Release history

The full release log lives in [CHANGELOG.md](./CHANGELOG.md). High-level:

- **v0.1 – v1.0** — scaffolded the provider, storefront, reviews/Q&A, cart, checkout, admin, auth, account, i18n, theming.
- **v1.1 – v1.8** — Stripe + i18n parity polish, homepage surface, journal + content pages, FAQs / shipping / size guide, remaining admin CRUD, site shell (header / footer / layout / favicon), turnkey scaffolder, admin todo list with setup checklist.
- **v1.9** — fixed the long-standing `'use client'` stripping bug so a fresh install renders in Next.js App Router without RSC errors; fixed the `exports` map so both `import` and `require` resolve.

## License

MIT © Caspian-Explorer
