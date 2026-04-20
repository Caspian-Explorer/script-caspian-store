# @caspian-explorer/script-caspian-store

Framework-agnostic React e-commerce store. **Bring your own Firebase.** Install into any React app (Next.js, Vite, CRA).

> **Status: `v0.3.0` — Stage 2 checkout & account landed.** Stripe checkout, order confirmation, order history, and wishlist are installable. Admin panel + auth pages come in v0.4–v0.5. See [Roadmap](#roadmap).

## Quickstart

```bash
npm install github:Caspian-Explorer/script-caspian-store#v0.3.0 firebase
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
| Admin panel (`/admin` pages) | ⏳ v0.4 |
| Auth pages (login/register/account) | ⏳ v0.5 |
| i18n + theming polish | ⏳ v0.6 |

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
- **v0.3.0 (now)** — Stripe checkout client hook, checkout page, order confirmation, order history, wishlist. ✅
- **v0.4.0** — admin panel pages (products, orders, reviews moderation).
- **v0.5.0** — auth pages (login, register, forgot password, account).
- **v0.6.0** — i18n (locale provider), theming polish, presets.
- **v1.0.0** — stable API, changelog freeze.

## License

MIT © Caspian-Explorer
