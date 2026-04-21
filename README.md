# @caspian-explorer/script-caspian-store

Framework-agnostic React e-commerce store. **Bring your own Firebase.** Install into any React app (Next.js, Vite, CRA).

> **Status: `v1.2.0` — homepage + font management.** `<HomePage>` + `<Hero>` + `<FeaturedCategoriesSection>` + `<TrendingProductsSection>` + `<NewsletterSignup>` ship. Fonts are now admin-editable from `<ScriptSettingsPage>` with optional Google Fonts injection. See [CHANGELOG](./CHANGELOG.md).

## Quickstart

```bash
npm install github:Caspian-Explorer/script-caspian-store#v1.2.0 firebase
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

## What's in v0.2.0

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

## Package surface (v0.2.0)

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

- **`"use client"` boundary (Next.js App Router):** the package does not emit a `"use client"` directive in its bundle. Import our components/hooks from a consumer file marked with `'use client'` at the top — e.g. a `providers.tsx` or a dedicated client wrapper. See [`examples/nextjs/app/providers.tsx`](./examples/nextjs/app/providers.tsx). A v0.1.1 release will preserve per-file directives automatically.
- **Tree-shaking:** the ESM bundle is side-effect-free except for `styles.css`, which you import once.
- **One store per page:** pass `appName="my-shop"` if you need multiple `CaspianStoreProvider` instances (e.g., a preview alongside the live storefront).

## Roadmap

- **v0.1.0-alpha** — scaffolding, provider, Script Settings. ✅
- **v0.2.0** — storefront (PLP, PDP), Reviews & Q&A, cart primitives, cart drawer, UI primitives. ✅
- **v0.3.0** — Stripe checkout client hook, checkout page, order confirmation, order history, wishlist. ✅
- **v0.4.0** — admin panel: shell, dashboard, product CRUD, orders, reviews moderation. ✅
- **v0.5.0** — auth pages (login, register, forgot password) + account page (profile, password, addresses, order history). ✅
- **v0.6.0** — i18n provider + `useT()`, theming presets + picker, profile photo upload, delete-account flow. ✅
- **v1.0.0 (now)** — full string migration across all surfaces, `<LocaleSwitcher />`, stable API. ✅

## License

MIT © Caspian-Explorer
