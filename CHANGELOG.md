# Changelog

All notable changes will be documented in this file.

## v1.1.0 — Stripe + i18n parity for hadiyyam migration

Groundwork release for the hadiyyam migration. Brings the package's Stripe server logic and i18n capabilities to parity with hadiyyam's production setup so phase-1 migration can install this tag and retire a big chunk of the native implementation. No breaking changes — everything is additive.

### Added
- **Cloud Functions — `createStripeCheckoutSession`** rewritten to match hadiyyam's `/api/checkout/create-session`:
  - Server-side cart validation (product exists, `isActive`, per-size stock).
  - Server-side promo code resolution from the `promoCodes` collection with `isActive` / `minOrderAmount` / `maxDiscount` honored. Coupon created on Stripe when a valid discount applies.
  - Optional shipping cost added as a line item; shipping details passed through via session metadata.
  - Rich session metadata (`userId`, `userEmail`, `items` JSON, `shippingInfo` JSON, `shippingCost`, `discount`, `promoCode`, `locale`) for the webhook to reconstruct the order.
- **Cloud Functions — `stripeWebhook`** upgraded:
  - Duplicate-event detection by `payment.stripeSessionId`.
  - Enriched `payment` object with card brand + last4 from the retrieved payment intent.
  - Full order doc matching hadiyyam's schema (`subtotal`, `shippingCost`, `discount`, `promoCode`, `total`, serverTimestamps, `shippingInfo`).
  - Per-size stock decrement, best-effort with try/catch.
  - Cart clearing after order creation.
- **Cloud Functions — new `getStripeSession`** callable. Maps a Stripe session ID → Firestore order ID (parity with hadiyyam's `/api/checkout/session`). Useful on the order-success page.
- **`useCheckout`** gains:
  - Optional `endpoint: string` — when set, posts JSON to the consumer's URL (with a bearer `Authorization` header) instead of invoking the callable. Lets Next.js consumers keep existing API routes.
  - Optional `promoCode`, `shippingCost`, `shippingInfo`, `locale` fields on `StartCheckoutOptions`.
  - Exports the new `CheckoutShippingInfoInput` type.
- **`validatePromoCode(db, code, subtotal)`** — client-side preview helper that mirrors the server's discount math. Returns `AppliedPromoCode` or `null`. Display-only; server still re-validates at checkout.
- **i18n — `LocaleProvider`** gains:
  - New `messagesByLocale?: Record<string, MessageDict>` prop for multi-locale sites. Active `locale` selects the dict; `fr-CA` → `fr` falls back to the primary subtag.
  - Automatic `dir="rtl"` CSS custom property (`--caspian-direction`) for Arabic / Hebrew / Farsi / Urdu locales.
  - New `useDirection()`, `useFormatNumber()`, `useFormatCurrency(currency)`, `useFormatDate()` hooks wrapping the native `Intl` API with locale awareness.
  - `isRtl(locale)` helper exported.
- **`interpolate`** upgraded to a minimal ICU plural subset: `{count, plural, =0 {none} one {one} other {# items}}`. Simple `{placeholder}` substitution still works.
- **`CaspianStoreProvider`** forwards `messagesByLocale` to the LocaleProvider.
- **Types** — new exports matching hadiyyam's Firestore schema: `FaqItem`, `JournalArticle`, `Subscriber`, `SocialLink`, `SiteSettings`, `PromoCode`, `AppliedPromoCode`, `ShippingMethod`, `ProductCategoryDoc`, `ProductBrandDoc`, `ProductCollectionDoc`, `PageContent`, `LanguageDoc`, plus `FontTokens` and `HeroTokens`.
- **`ScriptSettings`** gains optional `fonts` and `hero` blocks (seeded with sensible defaults). Consumers can ignore both; they become active in v1.2.
- **`DEFAULT_MESSAGES`** gains ~30 keys for home / journal / FAQs / content pages / size guide / shipping so forthcoming phases don't redefine them mid-migration.

### Changed
- Bundle grew from 40 KB → 47 KB (`.d.ts`) to cover new exports. No runtime-size regression for tree-shaken consumers.

### Migration notes
Consumers upgrading from v1.0.0 have nothing to do — all changes are additive. Before deploying the new Cloud Functions, set the existing `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` secrets; nothing else changed about the deploy flow.

## v1.0.0 — Stable release

The public API is now frozen. All user-facing surfaces route through `useT()`, a `LocaleSwitcher` ships, and the six-stage roadmap closes out.

### Added
- **Full string migration** — every user-visible literal in storefront (product card, grid, list/detail pages, cart sheet), reviews & Q&A (summary, list, items, dialogs), checkout + order confirmation + order history, wishlist button, and the account cards (profile, address book, change password, script settings page) now flows through `useT()`. `DEFAULT_MESSAGES` gained ~140 keys covering these surfaces.
- **`<LocaleSwitcher />`** — minimal dropdown UI for switching locales. Consumers own where the chosen code is persisted (URL, cookie, user profile) and feed it back into the provider's `locale` prop.

### Changed
- Minor: components that previously accepted `emptyMessage` / `subtitle` / `title` string props now default to `useT(...)` keys when those props are omitted — explicit overrides still win.

### API surface
Stable as of v1.0 (see [README §Package surface](./README.md#package-surface)):
- Provider: `CaspianStoreProvider`, `useCaspianStore` + `useCaspian{Link,Image,Navigation,Collections,Firebase}`
- Hooks: `useAuth`, `useCart`, `useCheckout`, `useWishlist`, `useScriptSettings`, `useT`, `useLocale`, `useToast`
- Storefront: `ProductListPage`, `ProductGrid`, `ProductCard`, `ProductDetailPage`, `ProductGallery`, `SizeSelector`, `QuantitySelector`, `CartSheet`, `StarRatingInput`
- Reviews: `ProductReviews`, `ReviewSummary`, `ReviewList`, `ReviewItem`, `QuestionList`, `QuestionItem`, `WriteReviewDialog`, `AskQuestionDialog`
- Checkout + account: `CheckoutPage`, `OrderConfirmationPage`, `OrderHistoryList`, `WishlistButton`, `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `AccountPage`, `ProfileCard`, `AddressBook`, `ChangePasswordCard`, `ProfilePhotoCard`, `DeleteAccountCard`, `ScriptSettingsPage`
- Admin: `AdminGuard`, `AdminShell`, `AdminDashboard`, `AdminProductsList`, `AdminProductEditor`, `AdminOrdersList`, `AdminOrderDetail`, `AdminReviewsModeration`
- Theming + i18n: `ThemePresetPicker`, `THEME_PRESETS`, `LocaleProvider`, `LocaleSwitcher`, `DEFAULT_MESSAGES`
- UI primitives: `Button`, `Dialog`, `Input`, `Textarea`, `Label`, `Tabs`, `Select`, `Skeleton`, `Badge`, `Avatar`, `Separator`, `Table`

## v0.6.0 — Stage 5 i18n, theming presets, profile photo, delete account

Rounds out the customer + account surface with localization infrastructure, theme presets, Firebase Storage-backed profile photos, and a safe delete-account flow. This is the last feature release before v1.0 stabilizes the API.

### Added
- **i18n** — `<LocaleProvider>` + `useT()` hook + `DEFAULT_MESSAGES` dictionary. `CaspianStoreProvider` now accepts `locale` and `messages` props; partial overrides merge onto the defaults, so consumers can ship a tiny override dict or a complete translation. The login / register / forgot-password / account pages have been migrated to `useT()` as reference implementations; other surfaces still read defaults and can be migrated incrementally.
- **Theming presets** — `THEME_PRESETS` constants (`minimalLight`, `minimalDark`, `boutique`, `neon`, `pastel`, `monochrome`) plus a `<ThemePresetPicker />` swatch grid that writes the chosen preset to `scriptSettings/site`. Integrated into the existing `<ScriptSettingsPage />` above the manual color inputs.
- **Profile photo** — `<ProfilePhotoCard />` with upload-or-remove controls. Uploads to `users/{uid}/avatar.{ext}` in Firebase Storage (JPEG/PNG/WebP, ≤5 MB), then mirrors the download URL into the user's Firestore doc *and* `auth.currentUser.photoURL`.
- **Delete account** — `<DeleteAccountCard />` with a two-step dialog: re-enter password (skipped for Google accounts), type `DELETE` to confirm. On confirm, clears the user's Firestore docs (`users/{uid}`, `carts/{uid}`), calls `deleteUser`, signs out, and redirects. Order history is intentionally preserved for records.
- **Storage service** — `uploadProfilePhoto`, `removeProfilePhoto`, plus `MAX_PROFILE_PHOTO_BYTES` / `ALLOWED_PROFILE_PHOTO_TYPES` constants.
- **Storage rules** — `firebase/storage.rules` published for consumers to deploy (`firebase deploy --only storage`). Reads public (review avatars), writes scoped to the authenticated user's own path with 5 MB / image-mime enforcement.
- **AccountPage** — now stacks `ProfilePhotoCard` + `ProfileCard` + `ChangePasswordCard` + `AddressBook` + order history + `DeleteAccountCard`. New section-level hide props: `hidePhoto`, `hideDeleteAccount`.

### Changed
- `CaspianStoreProvider` now wraps `LocaleProvider` at the top of the tree so `useT()` works from anywhere inside.

### Known limitations (land in v1.0)
- String migration is partial — only auth + account views use `useT()`. Storefront, checkout, admin, and reviews still render English literals. Migration is mechanical; will happen before v1.0 API freeze.
- No locale-switcher component yet; consumers set `locale` + `messages` at the provider level.

## v0.5.0 — Stage 4 auth & account

Ships the user-facing auth surface — sign-in, sign-up, forgot password — plus a full account page with profile editing, addresses, password change, and order history.

### Added
- **`<LoginPage>`** — email/password form + "Continue with Google" + remember-me + forgot-password link. Uses `useAuth().signIn` / `signInWithGoogle`.
- **`<RegisterPage>`** — name/email/password/confirm form + "Continue with Google". Validates confirm + minimum password length.
- **`<ForgotPasswordPage>`** — email → `sendPasswordResetEmail` with a success state.
- **`<ProfileCard>`** — inline edit for `displayName`; email is read-only.
- **`<AddressBook>`** — list, add, edit, delete, and set-default on `users.addresses`. First address auto-set as default; removing the default promotes the next entry.
- **`<ChangePasswordCard>`** — re-authenticates with `EmailAuthProvider` and calls `updatePassword`. Detects Google-provider accounts and shows a friendly hint.
- **`<AccountPage>`** — compound page stacking `ProfileCard` + `ChangePasswordCard` + `AddressBook` + `OrderHistoryList`. Section-level hide props (`hideOrders`, `hideAddresses`, `hidePassword`). Sign out in the header.
- **Service** — `user-service`: `updateDisplayName`, `addAddress`, `updateAddress`, `deleteAddress`, `setDefaultAddress`.
- **Example routes** — `/login`, `/register`, `/forgot-password`; `/account` now mounts `<AccountPage />`.

### Known limitations (land in v0.6+)
- Profile photo upload + delete-account flow are staged for v0.6 alongside Firebase Storage wiring.
- No social providers beyond Google yet.
- Email verification banner not enforced — Firebase still sends the verification email on sign-up; we just don't render a UI around it.

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
