# Changelog

All notable changes will be documented in this file.

## v0.4.0 — Stage 3 admin panel

Adds a complete admin surface: role-gated shell, dashboard, product CRUD, orders management, and the reviews/questions moderation page.

### Added
- **`<AdminGuard>`** — role gate. Blocks render unless `userProfile.role === 'admin'`. Renders a sign-in prompt for signed-out users and an access-denied notice for non-admins. Optional `fallback` override.
- **`<AdminShell>`** — sticky header + sidebar layout. Sidebar items come from `DEFAULT_ADMIN_NAV` or a custom `navItems` array. Active-route highlighting uses the framework adapter's `useNavigation`.
- **`<AdminDashboard>`** — at-a-glance cards: products, orders, revenue (paid/processing/shipped/delivered only), pending reviews, pending questions. Cards deep-link into the matching admin list.
- **`<AdminProductsList>`** — searchable table with name/brand/category/price/status/actions. Edit and Delete buttons per row, configurable `newProductHref` and `getEditHref`, confirm-before-delete.
- **`<AdminProductEditor>`** — one form for create + edit. Name, brand, description, price, category, sizes (CSV), color, `isNew` / `limited` / `isActive` flags, plus image URL list with add/remove controls.
- **`<AdminOrdersList>`** — status-filterable table (all / pending / paid / processing / shipped / delivered / cancelled), one row per order.
- **`<AdminOrderDetail>`** — per-order view with inline status dropdown (writes through `updateOrderStatus`), line items, shipping address, totals breakdown.
- **`<AdminReviewsModeration>`** — tabbed Reviews / Questions moderation. Per-row approve / reject / delete. Questions can also be answered via a dialog that writes `answer`, `answeredAt`, `answeredByUid`.
- **Services** — `listAllProducts`, `createProduct`, `updateProduct`, `deleteProduct`, `listAllOrders`, `updateOrderStatus`.
- **UI primitive** — `Table` / `THead` / `TBody` / `TR` / `TH` / `TD` (headless-ish, inline-styled).
- **Example app** — new routes: `/admin` (dashboard), `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`, `/admin/orders`, `/admin/orders/[id]`, `/admin/reviews`, `/admin/settings`. `/admin/layout.tsx` wraps the tree in `<AdminGuard>` + `<AdminShell>`.

### Known limitations (land in v0.5+)
- Category / brand / promo-code / shipping-method admin CRUD pages are still on the roadmap.
- No bulk selection/bulk-actions on the product or order tables yet.
- Image upload still takes raw URLs; Firebase Storage picker comes later alongside the product-builder stepper.

## v0.3.0 — Stage 2 checkout & account

Completes the customer purchase flow: client-side Stripe redirect, post-payment confirmation with order polling, account order history, and wishlist.

### Added
- **`useCheckout()` hook** — wraps the `createStripeCheckoutSession` Firebase callable. Validates cart/sign-in, passes cart items + success/cancel URLs, auto-appends `{CHECKOUT_SESSION_ID}` to the success URL, clears the local cart optimistically, and redirects to Stripe.
- **`<CheckoutPage>`** — shipping form + order summary + "Continue to payment" button. Empty-cart and sign-in gates built in.
- **`<OrderConfirmationPage>`** — resolves an order from Firestore by ID (= Stripe session ID per our webhook). Polls up to ~9 s to cover webhook latency before showing a soft "still processing" message.
- **`<OrderHistoryList>`** — signed-in users see their past orders with status + total; links into order confirmation pages.
- **`useWishlist()` hook + `<WishlistButton>`** — heart toggle backed by the existing `users.wishlist` array on Firestore. Unsigned users get a sign-in toast.
- **Order service** — `getOrderById`, `getOrdersByUser`.
- **Wishlist service** — `addToWishlist`, `removeFromWishlist`.
- **Example routes** — `/checkout`, `/orders/success?session_id=…`, `/orders/[id]`, `/account`.

### Flow
1. Cart → `/checkout` → `useCheckout().startCheckout({ successUrl, cancelUrl })`.
2. Stripe Checkout → `success_url=…&session_id={CHECKOUT_SESSION_ID}` → `/orders/success`.
3. Our webhook creates the order doc keyed by the Stripe session ID. `OrderConfirmationPage` polls until it appears.

### Known limitations (land in v0.4+)
- Shipping-method picker + promo-code redemption are still pass-through — the client forwards them to the callable but the callable doesn't yet resolve server-side pricing. Stripe collects whatever flat rate you configure on the Checkout session.
- Dedicated account page wrapper and address/profile editing stage for v0.4 alongside admin moderation.

## v0.2.0 — Stage 1 storefront

Ports the full storefront surface — product listing, product detail, reviews & Q&A — plus a persistent cart, cart drawer, and a library of internal UI primitives. No Tailwind required; everything is styled via inline styles driven by the `--caspian-*` CSS variables set from script settings.

### Added
- **Product list page** — `<ProductListPage>`, `<ProductGrid>`, `<ProductCard>`. Responsive grid, skeleton loading states, configurable `getProductHref` and `formatPrice`.
- **Product detail page** — `<ProductDetailPage>`, `<ProductGallery>`, `<SizeSelector>`, `<QuantitySelector>`. Gallery with thumbnail strip, size/qty pickers, Add-to-Cart, and a collapsible Reviews/Questions section.
- **Reviews & Questions** — `<ProductReviews>` plus sub-components: `ReviewSummary` (average + distribution bars), `ReviewList`, `ReviewItem`, `QuestionList`, `QuestionItem`, `WriteReviewDialog`, `AskQuestionDialog`. Verified-Purchase badge computed server-side from orders.
- **Cart primitives** — `CartProvider` (wired into `CaspianStoreProvider`), `useCart()` hook, persistent cart (Firestore for signed-in users, localStorage fallback for guests). `<CartSheet>` drawer with quantity and remove controls.
- **Services** — `getProductsByIds`, `getRelatedProducts`, full `review-service` (create/list/moderate/delete), full `question-service` (create/list/moderate/answer/delete), `hasUserPurchasedProduct`, `loadUserCart`/`saveUserCart`.
- **UI primitives** — `Button`, `Dialog`, `Input`, `Textarea`, `Label`, `Tabs`, `Select`, `Skeleton`, `Badge`, `Avatar`, `Separator`, `ToastProvider` + `useToast`. Headless-ish: inline-styled, className-overridable, CSS-variable-driven for theming. No Tailwind peer dep.
- **Example update** — `examples/nextjs` now includes `/` (storefront list + cart drawer) and `/product/[id]` (detail page with reviews).

### Changed
- `product-service` functions now take a `Firestore` as their first argument (keeping the package stateless — no module-level collection refs).
- `CaspianStoreProvider` now wraps `AuthProvider` → `CartProvider` → `ScriptSettingsProvider` → `ToastProvider`. No consumer change required.

### Known limitations (land in v0.3+)
- Stripe callable from the client cart (`startCheckout()` hook) still to come. The Cloud Function is ready; only the client wiring is pending.
- Admin panel pages (`v0.4.0`) and auth pages (`v0.5.0`) still pending per roadmap.
- No locale switching yet — `defaultLocale` is stored but not consumed.

## v0.1.0-alpha — Stage 0 scaffolding

Initial release. Ships the install path, provider, framework adapter contract, Firestore rules/indexes, Cloud Functions for Stripe, and one fully ported proof-of-pattern component. Storefront, cart, checkout, admin, and auth surfaces are staged for subsequent releases — see [Roadmap in README](./README.md#roadmap).

### Added
- `@caspian-explorer/script-caspian-store` package with tsup build (ESM + CJS + .d.ts).
- `CaspianStoreProvider` — Firebase init (BYOF), auth state, script-settings subscription, theme injection.
- Framework-agnostic adapter contract: `Link`, `Image`, `useNavigation` — default implementations plus typed slots for Next.js / React Router / any React host.
- `useAuth`, `useScriptSettings`, `useCaspianStore`, `useCaspianCollections`, `useCaspianFirebase`, `useCaspianLink`, `useCaspianImage`, `useCaspianNavigation` hooks.
- **Script Settings** — site-level config (brand, currency, locale, Stripe public key, theme tokens, feature flags) stored at `scriptSettings/site`. Live theme tokens surfaced as CSS custom properties.
- `<ScriptSettingsPage />` — self-service admin form, role-gated.
- Proof-of-port component: `<StarRatingInput />`.
- Services: `getProducts`, `getProductById`.
- Firestore rules + indexes at `firebase/firestore.rules` and `firebase/firestore.indexes.json`.
- Firebase Cloud Functions for Stripe: `createStripeCheckoutSession` (callable) + `stripeWebhook` (HTTP).
- Minimal Next.js consumer example at `examples/nextjs/`.
- INSTALL.md with Next.js / Vite / CRA integration snippets.

### Known limitations
- Only one storefront component is ported so far (intentional — proves the pattern). Cart, checkout, PDP, PLP, admin, and auth pages land in v0.2+.
- Cloud Functions are scaffolded; promo-code discounting and shipping-method wiring land with the client cart hook in v0.3.
- No locale provider yet — `defaultLocale` is stored in script settings but not consumed by any shipped component.
