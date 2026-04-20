# Changelog

All notable changes will be documented in this file.

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
