# Changelog

All notable changes will be documented in this file.

<!--
Every entry MUST include exactly one of these two headings:

  ### Consumer action required on upgrade
  (followed by a fenced bash block of exact commands, or a numbered list)

  ### No consumer action required
  (followed by a one-line explanation, e.g. "internal build config only; existing
  installs unaffected" or "scaffolder-only change; does not touch consumer sites")

Do not omit the heading, rename it, or fold it into `### Notes`. This is how
customers tell at a glance whether an upgrade needs attention.
-->

## v2.7.0 — Coming Soon mode, currency formatting, store address, reviews/cart policies, admin header polish

First release of the WooCommerce-parity roadmap (Release A). Adds admin surfaces and storefront wiring for five merchant-facing knobs — Coming Soon mode, currency display formatting, a structured store address, review-submission policy, and cart behavior — plus the shared UI primitives (tooltip, field description, searchable select) that every downstream section consumes, and an onboarding progress ring in the admin header.

### Added

- **Coming Soon mode** — new `SiteSettings.comingSoon: { enabled, message?, allowAdminPreview }`. When enabled, `<LayoutShell>` replaces non-admin routes with a branded `<ComingSoonSplash>`. Admins (or merchants sharing a preview link) bypass the splash by loading any page with `?caspian-preview=1`; the grant persists to `sessionStorage` so SPA navigation keeps the bypass. When `allowAdminPreview` is false, the query-key trick is ignored. Admin UI lives at the top of `/admin/settings` under "Coming Soon mode".
- **Currency display formatting** — new `SiteSettings.currencyDisplay: { position, thousandSep, decimalSep, decimals }` + new util `formatCurrency(amount, currency, { display?, locale? })` at [src/utils/format-currency.ts](src/utils/format-currency.ts). When `display` is absent, the util falls back to `Intl.NumberFormat` defaults — no behavior change for stores that don't set it. Admin UI exposes a live preview ("Preview: $1,234.50"). Also exports `currencySymbol(currency, locale)` and `defaultCurrencyDisplay(currency)`.
- **Structured store address** — new `SiteSettings.storeAddress: { line1, line2?, city, stateOrRegion, country, postcode }`. Country uses a new `<SearchableSelect>` over the full `ISO_COUNTRIES` list; state/region uses the same component when the country has a subdivision table (US, CA, GB, AU) and falls back to a free-text input otherwise. Subdivision data lives at [src/data/subdivisions.ts](src/data/subdivisions.ts) and is exported via `getSubdivisions(countryCode)` and `SUBDIVISION_LIBRARY`. The existing free-text `contactAddress` field is kept untouched for backward compat.
- **Reviews policy** — new `SiteSettings.reviewPolicy: { restrictToVerifiedBuyers, requireStarRating, showVerifiedBadge }`. `createReview` service in [src/services/review-service.ts](src/services/review-service.ts) now accepts an optional `policy` argument and rejects submissions that violate it. `<ReviewItem>` and `<ReviewList>` accept a new `showVerifiedBadge` prop so consumers can wire the toggle through without fetching settings at every render.
- **Cart behavior** — new `SiteSettings.cartBehavior: { redirectToCartAfterAdd, ajaxOnArchives }`. `<ProductDetailPage>` reads it from site settings on mount (overridable via the new `cartBehavior` / `cartHref` props) and navigates to `/cart` when the flag is on. The `ajaxOnArchives` toggle is reserved for a future release — the admin UI marks it as upcoming.
- **Admin header polish** — `<AdminShell>` grows two opt-in slots: a circular onboarding progress ring (new `<AdminOnboardingProgress>` component) that shows `% of AdminTodo completed where isDefault=true`, hidden at 100%; and a `headerHelp?: ReactNode` slot consumers can fill with docs/support links. Enabled by default via `showOnboardingProgress: true`.
- **Shared admin UI primitives** — three reusable components under [src/ui/](src/ui/): `<FieldHelp>` (`?` tooltip icon + hover popover), `<FieldDescription>` (muted sub-text that matches the established 13px / #666 / 4px-top-margin convention), and `<SearchableSelect>` (keyboard-navigable type-to-filter dropdown, used by the new store-address country/state pickers).
- **New icons** — `HelpIcon`, `SearchIcon`, `ChevronDownIcon` in [src/ui/icons.tsx](src/ui/icons.tsx), consumed by the primitives above.

### Changed

- **`OrderStatus`** gains `'on-hold'` — marks orders awaiting manual payment confirmation (bank transfer, cheque, cash-on-delivery). Backward compatible: stores that don't use manual payment methods never see this status.
- **`<ReviewItem>` / `<ReviewList>`** default `showVerifiedBadge` to `true`, matching current behavior. Consumers who want to hide the badge site-wide now pass `false` instead of forking the component.

### Exports added

`ComingSoonSettings`, `CurrencyDisplay`, `StoreAddress`, `ReviewPolicy`, `CartBehavior` types; `formatCurrency`, `currencySymbol`, `defaultCurrencyDisplay`, `FormatCurrencyOptions`; `getSubdivisions`, `SUBDIVISION_LIBRARY`, `Subdivision`; `FieldHelp`, `FieldDescription`, `SearchableSelect` and their prop types; `HelpIcon`, `SearchIcon`, `ChevronDownIcon`; `ComingSoonSplash`, `ComingSoonSplashProps`; `AdminOnboardingProgress`, `AdminOnboardingProgressProps`; `ReviewItemProps`, `ReviewListProps`.

### No consumer action required

Pure additive release — no new Firestore collections, no rules changes, no migrations. Stores on v2.6.x that don't set any of the new optional fields get identical pre-upgrade behavior. Coming Soon mode is off by default; currency formatting falls back to `Intl.NumberFormat`; review policy and cart behavior read as "no policy" when unset.

---

## v2.6.0 — Country picker dialog + per-country tax table + per-method shipping eligibility

v2.5 shipped the tax + supported-countries schema but with a minimal MVP admin UI — a comma-separated textarea. v2.6 lands the proper admin surfaces I deferred: a check-many-at-once **Country Picker dialog** over a curated ISO 3166 list, a per-row **tax-rate table** that appears when tax mode is `per-country`, and an **Eligible countries** picker on each shipping-plugin install so "Standard Shipping" can be US-only while "International" covers everywhere else. No schema change — these surfaces populate the same `SiteSettings.supportedCountries` and `ShippingPluginInstall.eligibleCountries` fields that already exist.

### Added

- **`<CountryPickerDialog>`** at [src/admin/country-picker-dialog.tsx](src/admin/country-picker-dialog.tsx). Reusable check-many-at-once picker: searchable list of ~90 ISO 3166 countries (curated, not exhaustive), Select-visible and Clear-all helpers, Confirm-with-count primary button. Takes an optional `source` prop so callers can scope the picker to a narrower list (e.g. the shipping-eligibility picker scopes to `SiteSettings.supportedCountries`, not the full ISO list).
- **`ISO_COUNTRIES`** exported alongside — 90-country curated list covering North America, UK/EU/EEA, Oceania, Asia, Middle East, Africa, and Latin America. Admins needing codes outside this set can still edit `supportedCountries` via Firestore directly.
- **Admin shipping-plugin "Eligible countries" field** in `/admin/shipping-plugins` install config dialog. Defaults to empty (available everywhere). Shows the picker dialog + a row of removable chips listing the chosen countries. The picker is scoped to `SiteSettings.supportedCountries` so admins don't accidentally offer shipping to countries they don't sell in.

### Changed

- **`/admin/settings` "Tax & supported countries" section** — replaces the v2.5 textarea with: a **Manage countries** button that opens the picker dialog; a proper table of selected countries with a `×` remove on each row; when tax mode is `per-country`, each row grows an inline numeric input for the decimal tax rate (e.g. `0.08`). Existing `supportedCountries` data is preserved — rates and custom names survive the upgrade untouched.
- **`docToInstall`** now reads `eligibleCountries` from Firestore so saved values hydrate back into the edit form correctly.

### Exports added

- `CountryPickerDialog`, `ISO_COUNTRIES`, `CountryPickerDialogProps`, `IsoCountry`.

### No consumer action required

Pure additive release — no schema changes, no rules changes, no migrations. Stores on v2.5.x that configured countries via the textarea will see the new table-driven UI immediately with the same data. Shipping plugins without `eligibleCountries` keep shipping to every supported country.

## v2.5.2 — Apply `stripUndefined` across all admin write services

v2.5.1 fixed the `Unsupported field value: undefined` Firestore error for **Products** and **Promo codes** — the two surfaces a user had hit. This release sweeps the same hardening across every other admin-write service that takes a payload with optional fields, so the next blank-field save can't trigger the same crash on a different page.

### Fixed (preventatively)

The following admin save flows are now also immune to the "undefined field value" Firestore error when optional inputs are left blank:

- **Categories** (`description`, `imageUrl`, `parentId`, `path`, `depth`, `isFeatured`) — [src/services/category-service.ts](src/services/category-service.ts)
- **Collections** (`description`, `imageUrl`, `isFeatured`, `updatedAt`) — [src/services/product-collection-service.ts](src/services/product-collection-service.ts)
- **Languages** (`flag`, `updatedAt`) — [src/services/language-service.ts](src/services/language-service.ts)
- **Journal articles** (defensive on partial updates) — [src/services/journal-service.ts](src/services/journal-service.ts)
- **FAQs** (defensive on partial updates) — [src/services/faq-service.ts](src/services/faq-service.ts)
- **Site settings** (`faviconUrl`, `currency`, `timezone`, `country`, `taxMode`, `taxLabel`, `flatTaxRate`, `supportedCountries`) — [src/services/site-settings-service.ts](src/services/site-settings-service.ts)
- **Shipping plugin installs** (`eligibleCountries`) — [src/services/shipping-plugin-service.ts](src/services/shipping-plugin-service.ts)
- **Payment plugin installs** (defensive on partial updates) — [src/services/payment-plugin-service.ts](src/services/payment-plugin-service.ts)
- **Admin todos** (`description`, `done`, `order`, `isDefault` on partial updates) — [src/services/admin-todo-service.ts](src/services/admin-todo-service.ts)

### No consumer action required

Pure runtime hardening; no schema changes, no API changes. Upgrade and the affected admin save flows can no longer throw `Unsupported field value: undefined` on blank optional inputs.

## v2.5.1 — Fix Firestore "undefined field" rejection on product and promo-code save

Both the admin product editor and the new-promo-code dialog were building write payloads that included optional fields (e.g. `weightKg`, `shortDescription`, `details` on products; `minOrderAmount`, `maxDiscount` on promo codes) with `undefined` values when the admin left them blank. Firestore's SDK rejects any document key whose value is `undefined`, so saves failed with `Function addDoc() called with invalid data. Unsupported field value: undefined (found in field weightKg ...)`. The fix lives in the service layer: a new `stripUndefined` helper drops `undefined` keys from the payload before `addDoc`/`setDoc`/`updateDoc` runs. Service-layer placement means every current and future caller is protected without changing form code.

### Fixed

- **Create/edit Product** with empty optional fields no longer throws `Unsupported field value: undefined`. ([src/services/product-service.ts](src/services/product-service.ts))
- **Create/edit Promo code** with empty `Min order amount` and/or `Max discount` no longer throws the same error. ([src/services/promo-code-service.ts](src/services/promo-code-service.ts))

### Added

- **`stripUndefined(obj)`** internal utility at [src/utils/strip-undefined.ts](src/utils/strip-undefined.ts) — shallow copy with `undefined`-valued keys omitted. Preserves `null`, `false`, `0`, `''`, and empty arrays/objects (all valid Firestore field values).

### No consumer action required

Upgrade and the affected admin save flows start working again — no code or schema changes on the consumer side.

## v2.5.0 — Retail-skin storefront + admin layout overhaul with notifications

Two parallel pushes landed together. On the storefront, four design screenshots defined the cleanWhite theme's look across the funnel: a product page with a vertical thumbnail rail and tabbed content, a full-page shopping bag, and a two-card checkout step — v2.5 implements that skin end-to-end and adds the product-content and tax/countries primitives it needs. On the admin side, the shell was rebuilt so the sidebar runs full-height (not under the header), the header starts from the right of the sidebar with a toggle icon at its far left, a notifications bell lives in the header with an unread badge + dropdown, and a new `/admin/notifications` page lists every active signal — starting with available-library-update alerts and pending moderation items.

### Added

- **`<CartPage>`** at [src/components/cart-page.tsx](src/components/cart-page.tsx) — new full-page shopping bag. Two-column layout: item cards on the left (thumbnail + name + variant + pill qty stepper + price + `×` remove); sticky order summary on the right (subtotal, shipping placeholder, total, promo code with apply/clear, Proceed-to-Checkout CTA, lock-icon "Secure checkout" microcopy, Continue Shopping link). Applied promo codes carry to checkout via a `?promo=` query param. Mount at `/cart`. The existing `<CartSheet>` drawer is preserved for quick peeks.
- **`<RichTextEditor>`** at [src/ui/rich-text-editor.tsx](src/ui/rich-text-editor.tsx) — minimal contentEditable editor with Bold + Bulleted-list toolbar. Cmd/Ctrl+B shortcut. Paste-as-plain-text to keep foreign markup out. Output sanitized to a tight allowlist (`<p>`, `<br>`, `<strong>`, `<b>`, `<ul>`, `<li>`; every attribute stripped).
- **`sanitizeRichHtml(input)`** — exported sanitizer used by both the editor and the `<HtmlContent>` renderer. Zero dependencies; runs on the client via `DOMParser`.
- **`<HtmlContent>`** at [src/ui/html-content.tsx](src/ui/html-content.tsx) — renders sanitized HTML via `dangerouslySetInnerHTML`, re-sanitizing at render so stale Firestore data stays inside the allowlist.
- **`Product.shortDescription`** — 1–3 line marketing blurb rendered in the PDP hero column above Add-to-Cart. Optional; falls back to the first paragraph of `description` when empty.
- **`Product.details`** — rich-text HTML for the Details tab on the PDP (dimensions, materials, care). Authored via `<RichTextEditor>` in the admin product editor. Optional; tab is hidden when both `details` and `description` are empty.
- **PDP tab system** — the product page now renders three sibling tabs (Details / Reviews / Questions) below the hero grid with an active-underline style. Reviews and Questions reuse the existing `<ProductReviews>` via a new `mode` prop (`reviews-only` / `questions-only` / `combined`); existing standalone consumers continue to see the previous combined widget.
- **`<ProductGallery>` rebuild** — vertical thumbnail rail on the left (fixed height, internal scroll for ≥5 images) + 4:5 featured image on the right. New `aspectRatio` prop. Single-image products render without a rail.
- **`SiteSettings.taxMode` / `taxLabel` / `flatTaxRate` / `supportedCountries`** — tax system. Three modes: `none` (hide the tax row), `flat` (one decimal rate applies site-wide), `per-country` (per-row `taxRate` on each entry in `supportedCountries`). Admin configures in `/admin/settings` → new "Tax & supported countries" section.
- **`SupportedCountry` type** — `{ code: ISO-2, name, taxRate? }`. Populates the checkout country dropdown (restricted to this whitelist when non-empty). Library falls back to a 6-country default (US/CA/GB/AU/DE/FR) on unconfigured stores so checkout stays usable.
- **`ShippingPluginInstall.eligibleCountries`** — per-install whitelist of ISO-2 codes. Empty or undefined → available everywhere. The shipping-rate calculator copies it through onto `ShippingRate`; the checkout filters the radio list to the selected country.
- **`<CheckoutPage>` restyle** — card-based layout (Contact / Shipping Address / Shipping Method) with sticky Order Summary. Signed-in users see a saved-address picker that auto-fills the form; an "Enter a new address" option reveals blank fields, and a checkbox offers to save the new address to their profile. A "Email me with news and offers" checkbox wires to the `subscribers` collection on submit. CART › CHECKOUT breadcrumb at top. Tax row is rendered based on `taxMode`. Continue-to-Payment still redirects through the active payment plugin (Stripe-hosted today).
- **i18n** — 40+ new keys under `product.tabs.*`, `cart.page.*`, and `checkout.*` (breadcrumb, contact, shipping address, shipping method, tax, etc.).
- **Scaffold + example wiring** — scaffolder's `/cart` route now mounts `<CartPage>` instead of auto-opening the sheet; new `examples/nextjs/app/cart/page.tsx` mirrors it.
- **Main-entry exports** — `CartPage`, `CartPageProps`, `RichTextEditor`, `HtmlContent`, `sanitizeRichHtml`, `TaxMode`, `SupportedCountry`.
- **`<AdminShell>` layout rebuild** — the sidebar is now sticky and runs from top to bottom of the viewport with the brand title at its top. The header occupies only the content area on the right, sits sticky above the main scroll, and hosts a sidebar-toggle button at the far left. Toggle state persists in `localStorage` under `caspian:admin:sidebarOpen` so it survives page navigation and refreshes. Two new props on `<AdminShell>`: `showNotificationsBell` (default `true`) and `notificationsHref` (default `/admin/notifications`); `defaultSidebarOpen` (default `true`) controls the first-visit state when no saved preference exists.
- **`<AdminNotificationsBell>`** at [src/admin/admin-notifications-bell.tsx](src/admin/admin-notifications-bell.tsx) — bell icon in the admin header with an unread count badge. Click opens a 340-px dropdown showing the 5 most recent items + a "View all notifications →" link. Closes on outside click or Escape. Pulls its data from `useAdminNotifications()`, so turning it off is a one-prop change on `<AdminShell>`.
- **`<AdminNotificationsPage>`** at [src/admin/admin-notifications-page.tsx](src/admin/admin-notifications-page.tsx) — full-page list of every active notification with a Refresh button and kind labels (Update / Moderation). Mount at `/admin/notifications`; scaffolder emits the route automatically.
- **`useAdminNotifications()`** hook at [src/hooks/use-admin-notifications.ts](src/hooks/use-admin-notifications.ts) — derives notifications from live sources. Kinds shipped today: `update-available` (from the GitHub Releases check), `pending-reviews`, `pending-questions` (via `getCountFromServer` on the matching collections). No persistent read state — notifications disappear when the underlying condition resolves (library upgraded, reviews approved). Options to disable per-source: `checkForUpdates`, `checkModeration`.
- **`BellIcon`, `MenuIcon`** added to [src/ui/icons.tsx](src/ui/icons.tsx) and re-exported from the main entry.
- **DEFAULT_ADMIN_NAV** gains a "Notifications" item pointing at `/admin/notifications`.

### Changed

- **`<ProductDetailPage>`** replaces the flat hero + in-page reviews with a hero grid over a tab bar. Long `product.description` content migrates into the Details tab alongside `product.details`; the hero column shows only the short blurb.
- **Admin product editor** grows a "Short description (PDP hero blurb)" textarea and a "Details" rich-text editor.
- **Shipping calculator** emits `eligibleCountries` on each rate so the checkout can filter without a second Firestore read.

### Consumer action required on upgrade

Fresh scaffolds pick up everything automatically. Existing installs on v2.4.x need **two route files** to get the new full-page cart and notifications page:

```tsx
// src/app/cart/page.tsx
'use client';
import { CartPage } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <CartPage />; }
```

```tsx
// src/app/admin/notifications/page.tsx
'use client';
import { AdminNotificationsPage } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <AdminNotificationsPage />; }
```

No Firestore rules changes, no migrations. Products without `shortDescription` / `details` keep rendering — the PDP falls back to `description` in both the hero and the Details tab. The tax row is hidden until an admin picks a `taxMode` in `/admin/settings`. Supported-country whitelist defaults to a 6-country fallback list; configure your own to restrict. The admin sidebar toggle + notifications bell are on by default on any page wrapped in `<AdminShell>` — no wiring needed. To hide the bell, pass `showNotificationsBell={false}`; to skip the GitHub update check, pass `checkForUpdates={false}`.

## v2.4.0 — One-click library self-update from the admin About page

The About page added in v1.25 told admins an update was available but left them to run `npm install` in a terminal. v2.4 adds an **Update to vX.Y.Z** button that installs the latest tag end-to-end: the button posts to a companion Next.js API route (`/api/caspian-store/update`) that verifies the caller's admin claim via Firebase Admin, runs `npm install github:Caspian-Explorer/script-caspian-store#vX.Y.Z` on the host, and schedules a `process.exit(0)` so a process manager (or the Next dev server) respawns with the new dependency loaded. A **Copy install command** button is always shown as a fallback for non-scaffolded setups.

### Added

- **`<AdminAboutPage updateEndpoint>`** prop — override or disable (`null`) the companion route. Default `/api/caspian-store/update`. When an update is available and a user is signed in, the page renders an **Update to vX.Y.Z** primary button next to Refresh; clicking it streams a success/error panel with the captured `stdout`/`stderr` and a "restart your server" nudge.
- **`triggerSelfUpdate(user, version, options?)`** at [src/services/self-update-service.ts](src/services/self-update-service.ts) — client-side helper that attaches `Authorization: Bearer <idToken>` from the current Firebase user and POSTs to the endpoint. Exposed from the main entry so consumers can wire custom buttons elsewhere.
- **Scaffolder emits `src/app/api/caspian-store/update/route.ts`** — Node runtime, Firebase-Admin ID-token verification (must have `admin: true` custom claim), version-string validation (`/^\d+\.\d+\.\d+$/`), fixed owner/repo allowlist, captured stdout/stderr, 500ms-deferred `process.exit(0)` on success. Production requires `CASPIAN_ALLOW_SELF_UPDATE=true` server env or the route returns 403 — no one can accidentally ship a site that lets admins push arbitrary versions.
- **`firebase-admin` promoted from `devDependencies` to `dependencies`** in scaffolded sites so the route's ID-token verification works under `NODE_ENV=production` installs (Vercel, Firebase App Hosting, etc. strip devDeps).

### Platform matrix

| Host                                         | In-app Update button                                                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Local dev (`npm run dev`)                    | ✅ Works. Dev server respawns after install.                                                              |
| Self-hosted Node (VPS, Docker + PM2/systemd) | ✅ Works when `CASPIAN_ALLOW_SELF_UPDATE=true` is set and a process manager restarts the exited Node.    |
| Firebase App Hosting                         | ⚠️ Works only if the runtime has a writable `node_modules` and respawns on exit. Normally use re-deploys. |
| Vercel / other serverless                    | ❌ Read-only filesystem — `npm install` fails with EROFS. Use the Copy install command button + redeploy. |

### Consumer action required on upgrade

Existing scaffolds on v2.3.x need to add the new API route file and move `firebase-admin` to `dependencies`:

```bash
# 1. Add the route file
mkdir -p src/app/api/caspian-store/update
# paste the route from scaffold/create.mjs's emitted template, or re-scaffold into a sibling
# with --force and diff.

# 2. Move firebase-admin to dependencies
npm uninstall firebase-admin --save-dev
npm install firebase-admin@^13.0.0

# 3. For production, opt in explicitly
echo 'CASPIAN_ALLOW_SELF_UPDATE=true' >> .env.production
```

Fresh `npm create caspian-store@latest` scaffolds get everything automatically.

## v2.3.0 — Storefront search + admin search-terms analytics

The header search box was a dead input — no submit handler, no results page, no analytics. v2.3 wires it up end-to-end: submitting the header search logs the normalized term to a new `searchTerms` Firestore collection (atomic count-increment + timestamps) and navigates to a new `/search` results page that filters the active-product catalog client-side. Admins get a **Search terms** page showing the list of everything shoppers have searched, sorted by frequency or recency, with per-row delete + clear-all actions. Useful for spotting demand gaps, naming mismatches, and recurring typos.

### Added

- **`searchTerms` Firestore collection** ([src/firebase/collections.ts](src/firebase/collections.ts)) — one doc per normalized term, schema on `SearchTerm` in [src/types.ts](src/types.ts): `{ id, term, count, firstSearchedAt, lastSearchedAt }`. Doc id is the normalized term (lowercased, whitespace-collapsed, `/` stripped, capped at 120 chars) so `"Shoes "` and `"shoes"` and `"Shoes/Boots"` all merge into one counter.
- **Search-term service** at [src/services/search-term-service.ts](src/services/search-term-service.ts) — `logSearchTerm(db, term)` (upsert + `increment(1)` via Firestore's atomic counter), `listSearchTerms(db, { sortBy })`, `deleteSearchTerm(db, id)`, `clearAllSearchTerms(db)`, `normalizeSearchTerm(raw)` for consumers who want to log from their own code.
- **`<SearchResultsPage>`** at [src/components/search-results-page.tsx](src/components/search-results-page.tsx) — reads `?q=` from the URL (or a `query` prop for consumer-controlled wiring), loads `getProducts(db)`, filters client-side by `name`/`brand`/`category` includes. Fine for small-to-medium catalogs; swap for a consumer-authored page wired to Algolia / Typesense at scale.
- **`<AdminSearchTermsPage>`** at [src/admin/admin-search-terms-page.tsx](src/admin/admin-search-terms-page.tsx) — table of terms with count + first/last searched timestamps, filter box, sort toggle (most searched vs most recent), per-row delete, clear-all. Total-searches counter in the header for quick scanning.
- **Header search now actually submits.** [src/components/site-header.tsx](src/components/site-header.tsx) hooks the form `onSubmit`: fire-and-forget `logSearchTerm` (any rules denial logs to console, never blocks navigation), then `nav.push('/search?q=...')`.
- **`DEFAULT_ADMIN_NAV`** gains a **Search terms** entry (`/admin/search-terms`), slotted between Subscribers and Shipping.
- **Firestore rules** ([firebase/firestore.rules](firebase/firestore.rules)) — admin-only read/delete; create requires `count == 1` and a non-empty `term ≤ 200 chars`; update requires monotonic count (count > resource.data.count) and immutable term. Writes stay public so anonymous shoppers are counted; admin auth guards readouts.
- **Scaffolder + example wiring** — `search-terms` appended to `adminRoutes` in [scaffold/create.mjs](scaffold/create.mjs); new `src/app/search/page.tsx` generated for fresh scaffolds. Example-app routes at [examples/nextjs/app/search/page.tsx](examples/nextjs/app/search/page.tsx) and [examples/nextjs/app/admin/search-terms/page.tsx](examples/nextjs/app/admin/search-terms/page.tsx).
- **i18n** — `search.{title, resultsFor, resultCount, noResults, emptyQuery}` (with an ICU-style plural on `resultCount` so "1 match" and "37 matches" both render correctly).

### Consumer action required on upgrade

1. **Re-deploy Firestore rules** so the new collection is writable by shoppers and readable by admins:
   ```bash
   firebase deploy --only firestore:rules
   ```
2. **Add a `/search` route to your Next.js app** — fresh scaffolds get this automatically; existing installs should add it by hand:
   ```tsx
   // src/app/search/page.tsx
   'use client';
   import { SearchResultsPage } from '@caspian-explorer/script-caspian-store';
   export default function Page() { return <SearchResultsPage />; }
   ```
3. **Add the admin route file** so the new **Search terms** sidebar link doesn't 404:
   ```tsx
   // src/app/admin/search-terms/page.tsx
   'use client';
   import { AdminSearchTermsPage } from '@caspian-explorer/script-caspian-store';
   export default function Page() { return <AdminSearchTermsPage />; }
   ```

## v2.2.2 — Admin nav exposes Pages, FAQs, Journal, Promo codes, Subscribers, Collections, Languages

`DEFAULT_ADMIN_NAV` was missing sidebar entries for seven admin pages that the scaffolder already generates routes for. The most visible symptom: the storefront's `<PageContentView>` fallback ("This page has no content yet. Edit it in /admin/pages.") pointed admins at a route with no nav link — the Admin → Pages editor existed and was exported, but there was no way to get to it from the sidebar without typing the URL by hand. Five other admin pages had the same gap.

### Fixed

- [src/admin/admin-shell.tsx](src/admin/admin-shell.tsx) — `DEFAULT_ADMIN_NAV` gains seven entries: **Collections** (`/admin/collections`), **Pages** (`/admin/pages`), **FAQs** (`/admin/faqs`), **Journal** (`/admin/journal`), **Promo codes** (`/admin/promo-codes`), **Subscribers** (`/admin/subscribers`), **Languages** (`/admin/languages`). Order groups content next to products/reviews and marketing before shipping/payments.

### No consumer action required

Existing consumers using the default `<AdminShell>` nav pick up the new links automatically. Fresh scaffolds already ship page.tsx files for all seven routes via `scaffold/create.mjs`. Consumers who pass a custom `navItems` prop are unaffected. If an existing install was scaffolded on an old library version that predates one of the listed routes, clicking the new link will 404 until the corresponding `src/app/admin/*/page.tsx` is added (two lines each — copy the pattern from any existing admin route file).

## v2.2.1 — DropdownMenu escapes overflow ancestors

The admin Products page wraps its table in a scrollable box (`overflow-x: auto`, which per CSS also implies `overflow-y: auto`). `<DropdownMenu>` rendered its panel inline with `position: absolute`, so the 3-dot action menu on each product row was clipped by the table's scroll box — only the first item peeked through with a stray scrollbar. The component now portals the panel to `document.body` and positions it with `position: fixed` + coords computed from the trigger's `getBoundingClientRect()` (re-measured on `scroll` in capture phase + `resize`). Escapes every `overflow` ancestor — the same fix benefits `<AdminProfileMenu>` defensively.

### Fixed

- [src/ui/dropdown-menu.tsx](src/ui/dropdown-menu.tsx) — panel portals to `document.body` with `position: fixed`; click-outside handler now treats clicks inside either the trigger root OR the portaled panel as "inside" (previously it only checked the trigger root, which with a portal would have closed the menu before any item's `onSelect` fired); first-item autofocus wrapped in `requestAnimationFrame` so it runs after the two-pass position measure commits.

### No consumer action required

Internal-only bug fix; no public-API change. Existing installs continue to work, and every `<DropdownMenu>` consumer — including anything downstream of `<AdminProductsList>` or `<AdminProfileMenu>` — picks up the fix automatically on upgrade.

## v2.2.0 — Stripe: separate test + live publishable key fields, mode toggle

The Stripe plugin had a single `publishableKey` field; going from test to live meant erasing one key and pasting the other (and re-configuring the Cloud Functions secret at the same time, which was easy to forget). v2.2 replaces that with **two dedicated fields** (`publishableKeyTest` / `publishableKeyLive`) and a **Mode dropdown** on the Stripe install — admins paste both keys once and flip a single dropdown to switch which pair the storefront uses. The server-side `STRIPE_SECRET_KEY` still has to be kept in sync manually; the dropdown's hint text reminds admins.

### Added
- **`StripeMode` type** (`'live' | 'test'`) and `StripeConfig` fields `mode`, `publishableKeyLive`, `publishableKeyTest` in [src/payments/types.ts](src/payments/types.ts). The `publishableKey` field is retained as a derived read-only field — `validateConfig` picks the active key based on `mode` and writes it there so callers needing the active key don't have to dispatch on mode themselves.
- **Mode dropdown + two key inputs** in the Stripe ConfigFields of [src/admin/admin-payment-plugins-page.tsx](src/admin/admin-payment-plugins-page.tsx). Required asterisk follows the currently-selected mode.
- **Legacy-config migration on dialog open** — a v2.0/v2.1 install that stored a single `publishableKey` gets it auto-moved into the matching `pk_test_` or `pk_live_` slot when the admin clicks **Configure**, so no re-pasting is required.
- **i18n** — `admin.paymentPlugins.field.stripe.{mode, modeTest, modeLive, modeHint, publishableKeyTest, publishableKeyLive}` in [src/i18n/messages.ts](src/i18n/messages.ts).

### Changed
- **`STRIPE_PLUGIN.defaultConfig`** now `{ mode: 'test', publishableKeyLive: '', publishableKeyTest: '', publishableKey: '' }` — a fresh install starts in test mode.
- **`STRIPE_PLUGIN.validateConfig`** validates the key matching the active `mode` (with `pk_live_` / `pk_test_` prefix check) and rejects mismatched keys with a clear error. Also accepts the legacy `publishableKey` field as a fallback so existing installs keep working until an admin opens and re-saves them.

### No consumer action required

Existing v2.1 installs keep working without changes — `validateConfig`'s legacy migration maps the old `publishableKey` field into the new shape on read. The first time an admin opens **Configure** on an existing Stripe install, the legacy key auto-migrates into the matching test/live slot and is written back on Save.

Admins graduating from test to live on an existing install can now:
1. Open `/admin/payment-plugins`, click **Configure** on Stripe.
2. Paste both the `pk_test_...` and `pk_live_...` keys.
3. Pick the active **Mode** (Test or Live).
4. Run `firebase functions:secrets:set STRIPE_SECRET_KEY` with the matching secret and re-deploy `functions-stripe`.

## v2.1.0 — Theme catalog: Avada-style grid with previewable themes

The v2.0 Appearance page exposed raw `primary / foreground / accent / radius` color pickers — accurate, but nothing an admin who isn't a designer would enjoy. v2.1 rebuilds it as a **catalog grid of pre-designed themes**, each a complete out-of-the-box visual identity (colors + radius + optional serif-font override) shown as a card with thumbnail, name, category tags, and Preview / Activate buttons. A sidebar filters by category (Corporate, Shop, Creative, Portfolio, Education, Health & Beauty, Events, Food, Marketing, Minimal) with live counts, plus a search box.

Ten starter themes ship: **Clean white, Minimal dark, Boutique, Editorial, Neon shop, Pastel studio, Academy, Kitchen table, Forum blue, Runway**. New themes land by PR into `THEME_CATALOG` ([src/theme/catalog.ts](src/theme/catalog.ts)) — there's no runtime registration hook.

Preview opens a **popup window** rendering a dummy-data storefront (header, hero, 6-product grid, footer) with the chosen theme applied — no Firestore roundtrip required, so fresh installs can eyeball every theme before seeding real products. **Apply theme** writes the tokens to `scriptSettings/site.theme` and closes the popup.

### Added

- **Theme catalog** at [src/theme/catalog.ts](src/theme/catalog.ts). `THEME_CATALOG: readonly CatalogTheme[]` — 10 themes, each with `id`, `name`, `description`, `categories`, optional `isNew` / `fontFamily`, raw `tokens`, and `thumbnail` metadata (wordmark + tagline + background / foreground / accent for the SVG preview). Helpers: `findCatalogTheme(id)`, `countThemesByCategory()`, `THEME_CATEGORY_LABELS`. Back-compat: `THEME_PRESETS` and `THEME_PRESET_LABELS` are now derived from the catalog, so `save({ theme: THEME_PRESETS.cleanWhite })` still works.
- **`<ThemeThumbnailSvg>`** at [src/theme/theme-thumbnail.tsx](src/theme/theme-thumbnail.tsx) — inline-SVG preview card. No binary assets; every thumbnail renders from the theme's own tokens so colors, radius, and wordmark match the activated result.
- **`<AdminAppearancePage>` rebuild** at [src/admin/admin-appearance-page.tsx](src/admin/admin-appearance-page.tsx) — sidebar (search + category list with counts), responsive card grid, "NEW" badge for fresh themes, "Active" badge for the currently-saved theme (detected by token equality), Preview button (opens popup), Activate button (writes tokens).
- **`<AdminAppearancePreviewPage>`** at [src/admin/admin-appearance-preview-page.tsx](src/admin/admin-appearance-preview-page.tsx) — full-page dummy-data storefront mockup for theme preview. Reads `?theme=<id>` from the URL, scopes theme tokens to a wrapper `div` (no global `:root` mutation — nothing leaks out of the popup), renders a sticky top banner with "Apply theme" and "Close" actions. Mount it at `/admin/appearance/preview`.
- **Dummy-data primitives** at [src/theme/preview-demo-data.ts](src/theme/preview-demo-data.ts) — `DEMO_BRAND`, `DEMO_NAV`, `DEMO_HERO`, `DEMO_PRODUCTS`. Also re-exported from the main entry so consumers can reuse them in their own previewers.
- **i18n** — 16 new `admin.appearance.*` keys covering the grid, sidebar, category labels-usage, and preview banner. Existing `settings.theme.*` keys are preserved.
- **Scaffolder + example wiring** — `['appearance/preview', 'AdminAppearancePreviewPage']` appended to `adminRoutes` in [scaffold/create.mjs](scaffold/create.mjs), generating `src/app/admin/appearance/preview/page.tsx` in fresh scaffolds. Example app at [examples/nextjs/app/admin/appearance/preview/page.tsx](examples/nextjs/app/admin/appearance/preview/page.tsx).

### Changed

- **`<AdminAppearancePage>`** now renders a theme catalog grid instead of raw color pickers. The raw-token surface (`<ScriptSettingsPage>`'s color inputs) is unchanged for admins who want manual control — mount that page at a secondary route if you need it. A new `previewPath` prop on `<AdminAppearancePage>` (default `/admin/appearance/preview`) controls where Preview opens in case you mount the preview at a non-default route.
- **`THEME_PRESETS`** widens from 1 entry (`cleanWhite`) back to 10, mirroring the catalog. Not a breaking change — consumers indexing it by the one existing key (`THEME_PRESETS.cleanWhite`) still resolve.

### Consumer action required on upgrade

Fresh scaffolds get the preview route wired automatically. **Existing installs on v2.0.x must add one route file** so the Preview popup has somewhere to land:

```tsx
// src/app/admin/appearance/preview/page.tsx
'use client';
import { AdminAppearancePreviewPage } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <AdminAppearancePreviewPage />; }
```

No Firestore rules, indexes, or Functions changes. No persisted-theme migration runs — whatever's already in `scriptSettings/site.theme` keeps rendering. To adopt a new theme, open the Appearance page and click Activate.

## v2.0.1 — Polish admin About error messages

Small UX fix for the admin About page. When the GitHub releases API returns a non-2xx response, the page used to render `Couldn't reach GitHub: GitHub API 404:` — the `res.statusText` portion is blank on modern browsers (notably HTTP/2), so the message trailed off at a dangling colon. The service now drops the colon when there's nothing to follow, and adds hint text for the two status codes that actually show up in practice: `404 → Not found or private`, `403 → Rate-limited or forbidden`. Network failures (offline, DNS, CORS) now surface as `Network error` instead of the browser-specific `Failed to fetch` / `NetworkError when attempting to fetch resource`.

### Fixed

- [src/services/github-updates-service.ts](src/services/github-updates-service.ts) — `fetchRecentReleases` no longer produces trailing-colon error strings, gives hint text for 404/403, and maps fetch `TypeError` to `Network error`. `AbortError` still propagates unchanged so unmounts don't look like failures.

### No consumer action required

Internal-only bug fix; existing installs continue to work.

## v2.0.0 — Pluggable payment + shipping providers, admin appearance page

v2.0 makes the storefront's integration points **installable, not hard-coded**. Stripe used to be the only payment option and the Firestore `stripePublicKey` field was the only way to configure it; shipping used to be a flat list of fixed prices with no picker at checkout. Both are now plugin catalogs browsed and configured from the admin panel: the store owner picks a provider, fills in its fields, flips Enable. Alongside those two plugin systems, the admin panel grows a dedicated **Appearance** page for theme tokens (previously buried inside the orphan `<ScriptSettingsPage>`). This is a single major release because the payment migration removes `stripePublicKey` from `ScriptSettings` — a public-type breaking change — and bundling the shipping and appearance work keeps admin-nav churn to one upgrade.

### Added — Payment plugins

- **Plugin catalog** under [src/payments/](src/payments/) — static in-library registry of payment providers. Each plugin exposes `validateConfig`, `startCheckout(ctx, options)`, and a `defaultConfig`. One built-in ships today: `stripe` ([src/payments/plugins/stripe.ts](src/payments/plugins/stripe.ts)) wrapping the existing `createStripeCheckoutSession` Cloud Function callable. Full contract in [src/payments/types.ts](src/payments/types.ts). Future providers land by PR into `PAYMENT_PLUGIN_CATALOG` ([src/payments/catalog.ts](src/payments/catalog.ts)) — there is no runtime registration hook and that is intentional.
- **`paymentPluginInstalls` Firestore collection** — one document per installed provider. Schema on `PaymentPluginInstall` in [src/types.ts](src/types.ts): `{ pluginId, name, enabled, order, config }`. Rules: public read (so `useCheckout` can enumerate) + admin write ([firebase/firestore.rules](firebase/firestore.rules)). Only publishable (`pk_...`-style) credentials live here; server-side secrets remain Cloud Functions secrets.
- **CRUD service** at [src/services/payment-plugin-service.ts](src/services/payment-plugin-service.ts).
- **`<AdminPaymentPluginsPage>`** at [src/admin/admin-payment-plugins-page.tsx](src/admin/admin-payment-plugins-page.tsx) — installed-providers table (enable / configure / remove) + Browse dialog. Mounted at `/admin/payment-plugins`.
- **`useCheckout` refactor** ([src/hooks/use-checkout.ts](src/hooks/use-checkout.ts)) — reads `paymentPluginInstalls`, picks the first enabled install in `order`, delegates to its plugin's `startCheckout`. New return field `activePlugin: PaymentPlugin | null` so UI can render provider-specific labels. Emits a dev-only `console.info` when more than one plugin is enabled (no picker UI ships in v2.0; future minor).
- **Checkout empty-state** — when no payment plugin is installed-and-enabled, `<CheckoutPage>` renders a guidance block (and a link to `/admin/payment-plugins` if the viewer is an admin) instead of the shipping form.
- **i18n** — `admin.paymentPlugins.*`, `checkout.noPaymentConfigured.*`, and parameterized `checkout.paymentHint` / removed `checkout.calculatedAtStripe` ([src/i18n/messages.ts](src/i18n/messages.ts)).

### Added — Shipping plugins

- **Plugin catalog** under [src/shipping/](src/shipping/) — four built-ins: `flat-rate`, `free-shipping`, `free-over-threshold`, `weight-based`.
- **`shippingPluginInstalls` Firestore collection** — one document per installed + configured plugin instance. Schema on `ShippingPluginInstall` in [src/types.ts](src/types.ts). Rules: public read, admin write.
- **CRUD service** at [src/services/shipping-plugin-service.ts](src/services/shipping-plugin-service.ts).
- **Rate calculator** at [src/services/shipping-calculator.ts](src/services/shipping-calculator.ts). Resolves enabled installs through the catalog and returns a `ShippingRate[]` for the checkout picker. Invalid configs are logged and skipped so one bad install doesn't blank the whole picker.
- **`<AdminShippingPluginsPage>`** at [src/admin/admin-shipping-plugins-page.tsx](src/admin/admin-shipping-plugins-page.tsx). Replaces the old `<AdminShippingPage>`.
- **`<ShippingRatePicker>`** at [src/components/checkout/shipping-rate-picker.tsx](src/components/checkout/shipping-rate-picker.tsx) — radio-group rendered inside the checkout page.
- **Checkout integration** — `<CheckoutPage>` computes rates on cart change, renders the picker below the address form, shows a Shipping line + Total in the order summary, and disables the Pay button until a rate is selected.
- **Public shipping page update** — [src/components/shipping/shipping-returns-page.tsx](src/components/shipping/shipping-returns-page.tsx) reads `shippingPluginInstalls` and renders each install's describe-string.
- **Product `weightKg?: number` field** — new optional field on `Product` consumed by the Weight-Based plugin; `<AdminProductEditor>` gets a **Weight (kg)** input.
- **i18n** — `admin.shippingPlugins.*` (40+ keys), `shipping.plugins.{id}.{name,description}`, `checkout.rate.*`.

### Added — Admin Appearance page

- **`<AdminAppearancePage>`** at [src/admin/admin-appearance-page.tsx](src/admin/admin-appearance-page.tsx) mounted at `/admin/appearance`. Houses the `<ThemePresetPicker>` + live color pickers for `primary` / `primaryForeground` / `accent` + radius input. Saves via `useScriptSettings().save({ theme })`.

### Changed

- **`DEFAULT_ADMIN_NAV`** ([src/admin/admin-shell.tsx](src/admin/admin-shell.tsx)) gains `/admin/shipping-plugins`, `/admin/payment-plugins`, and `/admin/appearance` entries. `/admin/shipping` is removed.
- **`THEME_PRESETS`** narrows from six presets to one opinionated default (`cleanWhite`). Picker UI, types, and public exports are unchanged — just the contents of the record shrink.
- **`DEFAULT_SCRIPT_SETTINGS.theme.accent`** changes from `#f5a8b8` (pink) to `#171717` (neutral dark) to match the new default. `--caspian-accent` CSS fallback in [src/styles/globals.css](src/styles/globals.css) updated accordingly.
- **First-run todo detector** — `verify-shipping-methods` → `verify-shipping-plugins`, now reading the new collection.
- **Seed script** at [firebase/seed/seed.mjs](firebase/seed/seed.mjs) seeds three `shippingPluginInstalls` docs (Standard flat-rate, Express flat-rate, Free-over-$75) in place of the old flat `shippingMethods` seed.
- **`<ScriptSettingsPage>`** marked `@deprecated` in JSDoc — superseded by `<AdminSiteSettingsPage>` + `<AdminAppearancePage>`. Still functional; removal in a future major.

### Removed

- **`ScriptSettings.stripePublicKey`** — the publishable key now lives in `paymentPluginInstalls[stripe].config.publishableKey`. `DEFAULT_SCRIPT_SETTINGS.stripePublicKey` removed. `settings.stripePublicKey` / `settings.sections.payments` i18n keys dropped. The "Payments" section is gone from `<ScriptSettingsPage>`. Dead `stripePublicKey` fields in Firestore are harmless — nothing reads them post-upgrade.
- **`<AdminShippingPage>`**, `AdminShippingPage` public export, `src/admin/admin-shipping-page.tsx`.
- **`shipping-method-service`** — `listShippingMethods`, `createShippingMethod`, `updateShippingMethod`, `deleteShippingMethod`, `ShippingMethodWriteInput`.
- **`ShippingMethod`** type and its re-export from the main entry. Use `ShippingPluginInstall` (collection doc) or `ShippingRate` (computed) instead.
- **`shippingMethods` Firestore collection reference** — replaced with `shippingPluginInstalls`.
- **Preset keys** `minimalLight`, `minimalDark`, `boutique`, `neon`, `pastel`, `monochrome` from `THEME_PRESETS` / `THEME_PRESET_LABELS`.
- **Dead i18n keys** — `checkout.taxesShipping`, `checkout.calculatedAtStripe`.

### Consumer action required on upgrade

1. **Re-deploy Firestore rules** so the two new plugin-install collections are readable/writable per the public-read + admin-write policy:
   ```bash
   firebase deploy --only firestore:rules
   ```
2. **Add the three new admin route files** (fresh scaffolds get these automatically; existing installs on v1.25.x should add them by hand):
   ```tsx
   // src/app/admin/payment-plugins/page.tsx
   'use client';
   import { AdminPaymentPluginsPage } from '@caspian-explorer/script-caspian-store';
   export default function Page() { return <AdminPaymentPluginsPage />; }
   ```
   ```tsx
   // src/app/admin/shipping-plugins/page.tsx
   'use client';
   import { AdminShippingPluginsPage } from '@caspian-explorer/script-caspian-store';
   export default function Page() { return <AdminShippingPluginsPage />; }
   ```
   ```tsx
   // src/app/admin/appearance/page.tsx
   'use client';
   import { AdminAppearancePage } from '@caspian-explorer/script-caspian-store';
   export default function Page() { return <AdminAppearancePage />; }
   ```
   Delete any existing `src/app/admin/shipping/page.tsx` — the old route is gone.
3. **Re-install Stripe from the admin UI.** The old `stripePublicKey` field is no longer read. Sign in as admin, go to `/admin/payment-plugins`, click **Browse providers** → **Install** on the Stripe card, paste your `pk_...` publishable key, click **Save**, then flip **Enable**. Checkout resumes immediately — no Cloud Functions redeploy needed.
4. **Re-configure shipping.** Existing `shippingMethods` documents are no longer read. Either re-run the seed script (which now populates three starter `shippingPluginInstalls` docs), or go to `/admin/shipping-plugins` → **Browse providers** → install the strategies you want.
5. **If you mounted `<AdminShell>` with a custom `navItems` array**, update the entries: swap `/admin/shipping` → `/admin/shipping-plugins`, and add `/admin/payment-plugins` + `/admin/appearance` if you want them in your custom nav.
6. **Code-level migrations** — if your consumer code imports any of the removed names, map them over:
   - `listShippingMethods` / `createShippingMethod` / `updateShippingMethod` / `deleteShippingMethod` → equivalents from `shipping-plugin-service`.
   - `ShippingMethod` → `ShippingPluginInstall` (doc) or `ShippingRate` (computed).
   - `AdminShippingPage` → `AdminShippingPluginsPage`.
   - `settings.stripePublicKey` reads → `paymentPluginInstalls[stripe].config.publishableKey` via `listPaymentPluginInstalls(db)`.
   - `THEME_PRESETS.{minimalLight|minimalDark|boutique|neon|pastel|monochrome}` → `THEME_PRESETS.cleanWhite` or inline the tokens you want.
7. **To use the Weight-Based shipping plugin**, set `weightKg` on products via the admin product editor. The plugin hides itself at checkout when no cart items have a weight.

## v1.25.0 — Admin About page + update-availability nudges

The admin panel had no place to surface library metadata — a store operator couldn't tell which version of `@caspian-explorer/script-caspian-store` they were on, whether a newer release was out, or what had shipped lately without leaving the app. v1.25 adds an **About** page under `/admin/about` that pulls the current version from source and recent releases from the public GitHub Releases API. Two lightweight nudges elsewhere in the admin make a behind-version install noticeable without having to visit About: an "Update available" badge in the admin header, and a virtual row at the top of `/admin/todos`.

### Added
- **`<AdminAboutPage>`** at [src/admin/admin-about-page.tsx](src/admin/admin-about-page.tsx). Shows installed version vs. latest release tag with a status badge (up-to-date / update available / offline), a list of the 5 most recent releases (title + relative date + link to release notes on GitHub), a Refresh button, and footer links to the repo / CHANGELOG.md / Announcements. Props `owner`, `repo`, `maxReleases` let consumers repoint the page at a fork.
- **GitHub updates service** at [src/services/github-updates-service.ts](src/services/github-updates-service.ts). `fetchRecentReleases(owner?, repo?, limit?, options?)` — unauthenticated GET against `api.github.com`, filters drafts/prereleases, 10-minute module-level cache. `compareVersions(a, b)` and `isUpdateAvailable(installed, latest)` — semver-lite numeric compare. Also exports `GithubRelease`, `DEFAULT_REPO_OWNER`, `DEFAULT_REPO_NAME`.
- **`CASPIAN_STORE_VERSION`** top-level constant at [src/version.ts](src/version.ts). Auto-generated by [tsup.config.ts](tsup.config.ts) on every build / `npm install` from `package.json#version`, so it never drifts.
- **Admin header "Update available" badge** — [src/admin/admin-shell.tsx](src/admin/admin-shell.tsx) now optionally checks GitHub on mount and renders a small badge linking to `/admin/about` when behind. New props `checkForUpdates`, `updateCheckOwner`, `updateCheckRepo` on `<AdminShell>`; pass `checkForUpdates={false}` to skip the network call entirely.
- **Virtual upgrade todo** — [src/admin/admin-todo-page.tsx](src/admin/admin-todo-page.tsx) renders a non-persisted row at the top of the list when a newer version is out, linking to the About page. Disappears automatically once installed == latest.
- **Scaffolder wiring** — fresh scaffolds get `src/app/admin/about/page.tsx` mounting `<AdminAboutPage />` automatically.

### Consumer action required on upgrade

For fresh scaffolds, none — `/admin/about` is wired automatically. Existing installs on v1.24.x should add one route file to pick up the About page:

```tsx
// src/app/admin/about/page.tsx
'use client';
import { AdminAboutPage } from '@caspian-explorer/script-caspian-store';
export default function Page() { return <AdminAboutPage />; }
```

The header badge and virtual todo appear automatically on upgrade — no consumer wiring required. If you don't want the library to reach out to `api.github.com` from the admin shell, pass `checkForUpdates={false}` to `<AdminShell>`.

## v1.24.0 — Setup wizard: a guided `/setup` that replaces the CLI config dance

The post-install checklist in the scaffolder README asked consumers to seed Firestore, open `/admin/settings`, edit the site doc, open `scriptSettings` for theming, toggle feature flags — seven separate touchpoints before a store felt "theirs." v1.24 collapses all of that into a 4-step wizard at `/setup` that writes the same Firestore docs behind one guided flow (Your info → Branding → Features → Summary), plus a dev-only `/setup/init` that pastes your Firebase web config into `.env.local` so the very first step of the manual README also becomes a form.

### Added
- **`<SetupWizard>`** at [src/components/setup/setup-wizard.tsx](src/components/setup/setup-wizard.tsx). Admin-gated 4-step wizard. Step 1 writes `settings/site` via the existing `saveSiteSettings` service; steps 2 and 3 write `scriptSettings/site.{theme,hero,features}` via the `useScriptSettings()` context save. Pre-populates the draft from whatever's already in Firestore, so reopening `/setup` on an existing store surfaces current values, not empty fields. Styled to match the common multi-step-form pattern: violet left-rail stepper + navy-CTA white panel on a cream-blue background.
- **`<SetupInitPage>`** at [src/components/setup/setup-init-page.tsx](src/components/setup/setup-init-page.tsx). Dev-only Firebase-config paste form. POSTs to a companion Next.js API route that writes `.env.local` from the browser, then prompts the user to restart dev + register their first account (the `onUserCreate` trigger auto-promotes to admin from there). The API route 403s whenever `NODE_ENV !== 'development'` so a deployed site can't overwrite its own env vars from a browser.
- **Supporting primitives** — `<SetupShell>`, `<SetupStepper>`, `SetupStep` type — all exported from the main entry so consumers can build custom flows with the same visual language.
- **Scaffolder wiring** in [scaffold/create.mjs](scaffold/create.mjs). Fresh scaffolds ship `src/app/setup/{layout,page}.tsx`, `src/app/setup/init/page.tsx`, and `src/app/api/setup/write-env/route.ts` automatically. The generated README gets a "Prefer a GUI?" callout at the top of the First-run checklist pointing at `/setup/init` and `/setup`.
- **i18n** — 67 new `setup.*` keys in [src/i18n/messages.ts](src/i18n/messages.ts) covering every label, placeholder, hint, and error message so existing `messagesByLocale` consumers can translate the wizard.

### No consumer action required
Pure additive release. The wizard is a new surface; existing `/admin/settings` flows still work unchanged. Existing installs on v1.23.x upgrade by bumping the dep and adding four route files — copy the snippets from [scaffold/create.mjs](scaffold/create.mjs) or re-run the scaffolder with `--force` into a sibling directory and diff.

## v1.23.0 — Admin header profile menu + setup-todo automation

Final slice of the admin-UX overhaul started in v1.21. The admin shell now has a real profile dropdown in the header (avatar, name, "View storefront", "My profile", "Sign out") and the setup checklist at `/admin/todos` is self-driving — it auto-seeds on first load, auto-updates as the admin fixes things in other tabs, and a "Verify progress" button re-checks which items Firestore state says are done.

### Added
- **`<AdminProfileMenu>`** at [src/admin/admin-profile-menu.tsx](src/admin/admin-profile-menu.tsx). Avatar + dropdown. Mount it into `<AdminShell headerRight>` from your admin layout. Resolves `displayName` / `photoURL` / email from `useAuth()`; falls back to an initial-circle when no photo. Consumer-configurable props: `storefrontHref`, `profileHref`, `afterSignOutHref`, `avatarSize`.
- **Four new icons** in [src/ui/icons.tsx](src/ui/icons.tsx): `UserIcon`, `LogOutIcon`, `CheckIcon`, `RefreshIcon`. Exported from the main entry.
- **`listenAdminTodos(db, callback, onError?)`** in [src/services/admin-todo-service.ts](src/services/admin-todo-service.ts). `onSnapshot`-backed live subscription ordered by the todo `order` field. Replaces the one-shot `listAdminTodos()` call in `<AdminTodoPage>` so changes made in another tab (or by the auto-verify below) reflect instantly.
- **`verifyAdminTodos(db, todos)`** + **`AUTO_DETECTABLE_TODO_IDS`** in [src/services/admin-todo-detectors.ts](src/services/admin-todo-detectors.ts). One-shot detectors for eight of the seeded first-run items: admin role granted (tautological — you're reading the page), site settings edited, ≥ 2 active languages, at least one category / product / shipping method, homepage hero edited, a category marked featured. Deploy-related items (`deploy-firestore-rules`, `deploy-storage-rules`, `deploy-cloud-functions`, `configure-stripe-webhook`) are intentionally absent — they aren't observable from Firestore and stay manual.
- **"Verify progress" button** in `<AdminTodoPage>` wires `verifyAdminTodos()` + `updateAdminTodo()` so a single click flips every auto-detectable item whose work has been done.

### Changed
- **`<AdminTodoPage>`** now uses the live snapshot listener instead of a one-shot fetch. Auto-seeds `DEFAULT_ADMIN_TODOS` on first visit if the collection is empty, so the admin doesn't need the "Seed setup checklist" button to see the list. The button is renamed "Re-seed defaults" and remains available for recovery if someone deletes a default item and wants it back.
- **Scaffolder + example admin layout** now mount `<AdminProfileMenu />` into `<AdminShell headerRight>`. Fresh scaffolds pick this up automatically; existing consumers can add one import + one prop (see below).

### No consumer action required
Pure additive — no schema change, no storage-rules change, no migration. Existing admin pages keep working without the profile menu until you opt in.

To opt in in an existing install, update your `app/admin/layout.tsx` (or equivalent):

```tsx
import { AdminGuard, AdminProfileMenu, AdminShell } from '@caspian-explorer/script-caspian-store';

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <AdminShell headerRight={<AdminProfileMenu />}>{children}</AdminShell>
    </AdminGuard>
  );
}
```

Existing installs upgrade transparently via `npm install github:Caspian-Explorer/script-caspian-store#v1.23.0`.

## v1.22.0 — Admin products overhaul: category dropdown + color palette + image upload + 3-dot actions

Second slice of the admin-UX overhaul started in v1.21. Products were free-text everywhere — category was a text input (easy to typo, no connection to the categories collection), color was a text input (no swatch guidance), and images were URL-only. The product list had Edit + Delete buttons inline with no `#` column, no filters beyond search, and no way to jump to the storefront PDP. This release closes all of those.

### Added
- **`<DropdownMenu>` UI primitive** at [src/ui/dropdown-menu.tsx](src/ui/dropdown-menu.tsx). Minimal headless dropdown with click-outside + ESC close, arrow-key focus management, `destructive` item variant, optional icons. Exported from the main entry. Used by the product-row 3-dot menu here, and by the profile menu landing in v1.23.
- **Inline SVG icon set** at [src/ui/icons.tsx](src/ui/icons.tsx): `MoreHorizontalIcon`, `EditIcon`, `TrashIcon`, `ExternalLinkIcon`. Stroke-based, inherit `currentColor`. No icon library added — sticks to the existing inline-SVG pattern.
- **Categories entry in `DEFAULT_ADMIN_NAV`** (`/admin/categories`). The `<AdminProductCategoriesPage>` admin page already supported parent/child hierarchy; now it gets a sidebar link so operators can find it.
- **Hierarchical category `<Select>` in `<AdminProductEditor>`**. Options are indented by depth (e.g. `Shoes`, `— Sneakers`, `—— Low-top`) and sorted by the category `order` field. The select's `value` is the `ProductCategoryDoc.id`, and it's stored directly on `Product.category`.
- **Fixed-palette color `<Select>`**. 13 named colors: Black, White, Red, Blue, Green, Yellow, Pink, Purple, Orange, Brown, Grey, Beige, Multi. Legacy stored colors that don't match the palette surface a warning hint prompting the admin to normalise by picking + saving.
- **Multi-image upload in `<AdminProductEditor>`**. Uses `<ImageUploadField>` (introduced in v1.21) with a separate URL-paste row underneath. Files land at `products/{productId}/` in Firebase Storage.
- **Product-list overhaul** in [src/admin/admin-products-list.tsx](src/admin/admin-products-list.tsx):
  - Sequential `#` column (1-based over the filtered view).
  - Filter bar: status (all / active only / hidden only), category (dropdown fed from `productCategories`, including an "Unresolved (legacy names)" option to surface pre-migration docs), brand (substring match), plus the existing search box. Clear-filters button.
  - Edit / View on storefront / Delete collapsed into a 3-dot `<DropdownMenu>`. "View on storefront" opens the PDP in a new tab.
  - New optional `getViewHref` prop on `<AdminProductsList>` defaulting to `(id) => /product/${id}`.
  - Categories resolved `id → name` client-side for display. Products whose `category` doesn't match any known id render an amber warning icon (legacy pre-migration docs).
- **`products/**` Storage rule block** in [firebase/storage.rules](firebase/storage.rules). Public read, admin write up to 10 MB, raster image content-types only (`jpeg|png|webp|gif`). SVG is intentionally rejected for product photos — product catalogs shouldn't accept embedded-script vectors from less-trusted sources.
- **Storage-rules test coverage for `products/**`** in [firebase/rules.test.mjs](firebase/rules.test.mjs): unauthenticated write denied, non-admin write denied, SVG upload denied, public read allowed.

### Changed
- **`Product.category` semantics** — was the display name, now stores the `ProductCategoryDoc.id`. The Firestore filter in `getProducts`/`getRelatedProducts` is opaque to id-vs-name (`where('category', '==', value)`) so it keeps working as long as both halves (product + caller) use the same format. Callers that passed a hard-coded category name to `getProducts({ filters: { category } })` must resolve name → id via `listActiveCategories()` first.
- **`<AdminProductsList>`** displays the count as `filtered / total` instead of just `total`, since filters can now reduce the shown set below the full catalog.

### Migration
Run the one-off script once, from your project root:

```bash
node node_modules/@caspian-explorer/script-caspian-store/firebase/scripts/migrate-product-category-to-id.mjs \
  --project <your-project-id> \
  --credentials ./service-account.json \
  --dry-run    # first, to preview
```

Re-run without `--dry-run` to apply. The script:
- Rewrites `products/{id}.category` from name → id using `productCategories` as the lookup table.
- Skips docs whose `category` already matches a known category id (idempotent).
- Flags ambiguous matches (two categories with the same name) for manual reassignment.
- Flags unknown names — create the missing category or reassign the product in `/admin/products` before re-running.

Products flagged "unresolved" after the migration are surfaced with an amber warning icon in the admin list. Opening + saving such a product in the editor lets you pick the correct category from the dropdown.

### Consumer action required on upgrade

```bash
npm install github:Caspian-Explorer/script-caspian-store#v1.22.0

# Redeploy storage.rules so product-image uploads work:
cp node_modules/@caspian-explorer/script-caspian-store/firebase/storage.rules .
firebase deploy --only storage

# Run the category migration (see above).
node node_modules/@caspian-explorer/script-caspian-store/firebase/scripts/migrate-product-category-to-id.mjs \
  --project <your-project-id> \
  --credentials ./service-account.json \
  --dry-run

# If output looks right, re-run without --dry-run.
```

If your storefront code calls `getProducts({ filters: { category: 'Sneakers' } })` with a literal name, update it to resolve the category by slug or name → id first (the library's `listActiveCategories` returns the full category list).

## v1.21.0 — Admin settings overhaul: localization + logo/favicon upload + social links rework

First slice of a larger admin-UX overhaul. The storefront settings page was previously all plain text inputs — logo/favicon URLs had to be copy-pasted in from elsewhere, social-link `platform` was free-text (easy to typo), and there were no currency / timezone / country selectors. This release brings the page in line with what operators expect on day one.

### Added
- **Localization section in `<AdminSiteSettingsPage>`.** Three new dropdowns on [src/admin/admin-site-settings-page.tsx](src/admin/admin-site-settings-page.tsx):
  - **Currency** — 29 most-common ISO 4217 codes (USD, EUR, GBP, JPY, CAD, AUD, CHF, CNY, INR, BRL, MXN, …).
  - **Timezone** — populated at runtime from `Intl.supportedValuesOf('timeZone')` (typically ~420 IANA zones), with a 30-zone fallback list for older runtimes.
  - **Country** — 40-country ISO 3166-1 alpha-2 subset covering the usual storefront footprint.
  All three are optional on `SiteSettings`. Existing docs without these fields keep working.
- **`<ImageUploadField>` UI primitive** at [src/ui/image-upload-field.tsx](src/ui/image-upload-field.tsx). Wraps the existing `uploadAdminImage()` helper with a preview, file picker, `Replace` / `Remove` buttons, and an optional URL fallback input. Exported from the main entry so consumers can reuse it in their own admin pages. Renders a placeholder when empty; uploads are scoped to a caller-supplied `storagePath` so Storage rules stay in control of what ends up where.
- **`siteSettings/**` Storage rule block** in [firebase/storage.rules](firebase/storage.rules). Public read (the storefront renders the logo on every page), admin write up to 10 MB, content-type matches `image/(jpeg|png|webp|gif|svg+xml)`. SVG is permitted because logos and favicons are commonly vector.
- **Rules-behavior test coverage for Storage.** [firebase/rules.test.mjs](firebase/rules.test.mjs) now also initializes the Storage emulator and asserts the siteSettings block: admin upload allowed (PNG + SVG), non-admin write denied, disallowed content-type (`text/html`) denied, public read allowed after an admin upload. Paves the way for `products/**` coverage in a later release.
- **`SocialPlatform` type + `SOCIAL_PLATFORMS` constant** in [src/types.ts](src/types.ts). Closed union of the eight platforms the built-in `<SocialIcon>` registry already supports (`instagram`, `facebook`, `twitter`, `x`, `youtube`, `tiktok`, `linkedin`, `pinterest`). Exported from the main entry.

### Changed
- **`<AdminSiteSettingsPage>` logo + favicon** are now live file uploads via `<ImageUploadField>` instead of URL-only text inputs. The URL input is still available underneath each picker as a fallback for CDN-hosted images. Uploaded files land under `siteSettings/` in Firebase Storage.
- **Social links editor** — `platform` is now a `<Select>` fed from `SOCIAL_PLATFORMS`, and a live `<SocialIcon>` preview renders next to each row so operators can see the icon they picked without saving first. The `label` text input has been removed; the platform name doubles as the aria-label / tooltip in the footer.
- **`SocialLink.platform` type** narrowed from `string` to `SocialPlatform`. Consumer code that wrote arbitrary platform strings will no longer typecheck — migrate to one of the eight supported values (or extend `<SocialIcon>` + the union together). Existing Firestore docs with unknown platform strings fall through to the generic globe fallback icon at render time.
- **`SocialLink.label`** removed from the public type. Any consumer code reading it loses access; the field was optional and most installs never set it. The footer no longer reads `label`, so removing it from existing docs has no visible effect.

### Consumer action required on upgrade

```bash
npm install github:Caspian-Explorer/script-caspian-store#v1.21.0

# Redeploy storage.rules so logo/favicon uploads work:
cp node_modules/@caspian-explorer/script-caspian-store/firebase/storage.rules .
firebase deploy --only storage
```

If you were using `SocialLink.label` in a fork or custom footer, fold the copy into the `platform` value or render it from your own table — the field is gone from `SiteSettings`.

## v1.20.2 — `predev` kill-port in scaffolded `package.json` (Windows dev-server hygiene)

One-line mitigation for a Windows-specific Turbopack zombie-worker bug. When the parent shell exits without clean shutdown, Next 16's Turbopack occasionally leaves Node.exe worker PIDs holding port 3000, causing the next `npm run dev` to hang on `EADDRINUSE`. `predev` clears the port first.

### Added
- **`predev` script in scaffolder-generated `package.json`**: `npx --yes kill-port 3000 || exit 0`. Cross-platform safe — `kill-port` is a no-op if nothing holds the port, and `|| exit 0` swallows a port-free exit-1 so `npm run dev` proceeds normally on macOS / Linux / Windows without zombies. Applied in both scaffold branches (hand-rolled and `--use-create-next-app` delegation) via the shared `ourScripts` object.

### No consumer action required
Scaffolder-only change. Existing scaffolded sites can add this manually to their `package.json` if they've been seeing EADDRINUSE on Windows; fresh scaffolds pick it up automatically. No source, public API, or ruleset change.

Existing installs upgrade transparently via `npm install github:Caspian-Explorer/script-caspian-store#v1.20.2`.

## v1.20.1 — `firebase:sync` helper + `turbopack.root` in scaffolded `next.config.mjs`

Carryover items from earlier install reports. Two independent scaffolder additions and one audit-only item.

### Added
- **[firebase/scripts/sync-rules.mjs](firebase/scripts/sync-rules.mjs)** — new Node helper that copies `firestore.rules`, `firestore.indexes.json`, and `storage.rules` from the installed package into the consumer's project root. Scaffolded sites get a `firebase:sync` npm script wired to it. Run after any upgrade that touches rules/indexes (the release CHANGELOG will call it out).
- **[scaffold/create.mjs](scaffold/create.mjs): `turbopack: { root: __dirname }` in generated `next.config.mjs`.** Pins Turbopack's workspace root so Next stops logging "Warning: Next.js inferred your workspace root" for any consumer whose home dir has a stray `package-lock.json`. Derived via `fileURLToPath` + `dirname` because `__dirname` isn't a global in ESM `next.config.mjs`.
- **[INSTALL.md §12 Upgrade](INSTALL.md)** now recommends `npm run firebase:sync` as the rules-resync step after bumping the package.
- **Scaffolder-generated README Upgrade section** uses `npm run firebase:sync` instead of the previous "available in v1.18+; otherwise copy by hand" caveat — it's now unconditional.

### Changed
- **Scaffolded `package.json` scripts** gain a `firebase:sync` entry between `firebase:deploy` and `deploy:admin`.

### Verified (no code change)
- **[src/admin/admin-guard.tsx](src/admin/admin-guard.tsx) access-denied text** audited end-to-end. The three-path list (Claim admin button / `grant-admin` CLI / Firestore console) from v1.18.0 is intact; no stale "re-run the seed script" language. Closing the follow-up from report #2.

### Consumer action required on upgrade
Upgraded consumer sites need two small edits to pick up the new helper:

```bash
npm install github:Caspian-Explorer/script-caspian-store#v1.20.1

# Add firebase:sync to your package.json scripts:
#   "firebase:sync": "node node_modules/@caspian-explorer/script-caspian-store/firebase/scripts/sync-rules.mjs"

# Then sync the rules from the library into your project root:
npm run firebase:sync
firebase deploy --only firestore:rules,firestore:indexes,storage   # if rules changed in this release (they didn't)

# Optional: add the turbopack.root pin to your next.config.mjs.
# See scaffold/create.mjs for the current generated config — three new lines at the top and a two-line turbopack block.
```

Fresh scaffolds pick up everything automatically.

## v1.20.0 — Upgrade-notes template, `--no-apphosting` flag, hydration fix

Polish pass following v1.19.0. Three independent items:

1. CHANGELOG upgrade-notes had drifted across releases (`### Not affected`, `### Notes`, `### Consumer action required on upgrade`, or nothing at all). Customers couldn't tell at a glance whether a given release needed action. Formalized as a hard-required heading with only two allowed variants.
2. Scaffolder unconditionally wrote `apphosting.yaml` since v1.16.0. For Vercel-only consumers the file just sits unused. Now gated behind a new `--no-apphosting` flag (default stays "emit" — non-breaking).
3. `AdminDashboard` tile rendered `<Skeleton>` (a `<div>`) inside a `<p>`, tripping React's "`<p>` cannot contain a nested `<div>`" dev warning. Silent in production but noisy in dev. Fixed by swapping the outer `<p>` for a `<div>` with identical inline styles.

### Added
- **Scaffolder `--no-apphosting` flag** in [scaffold/create.mjs](scaffold/create.mjs). Suppresses the generated `apphosting.yaml`. Default remains "emit" — Firebase App Hosting consumers are unaffected. Documented in [INSTALL.md §Scaffold flags](INSTALL.md).
- **CHANGELOG upgrade-notes template** documented as a comment block at the top of [CHANGELOG.md](CHANGELOG.md). Every release entry must include exactly one of `### Consumer action required on upgrade` or `### No consumer action required`.

### Changed
- **[CLAUDE.md Pre-Commit Checklist §5](CLAUDE.md)** now documents the upgrade-notes heading requirement as part of the bump-version step.

### Fixed
- **[src/admin/admin-dashboard.tsx:132](src/admin/admin-dashboard.tsx)** — tile value was wrapped in `<p>` which React disallows containing `<Skeleton>` (a `<div>`). Changed to `<div>` with identical inline styles; visual output unchanged.
- **[CHANGELOG.md](CHANGELOG.md) v1.17.0 back-fill** — added the previously-missing `### No consumer action required` heading so the entry conforms to the new template.

### No consumer action required
- `--no-apphosting` is an additive flag with backwards-compatible default (emit). Existing scaffold invocations produce identical output.
- CHANGELOG template formalization is docs-only.
- The hydration fix is a silent-in-production source correction with no visual or API change.

Existing installs upgrade transparently via `npm install github:Caspian-Explorer/script-caspian-store#v1.20.0`.

## v1.19.0 — Per-codebase `.gitignore` + first-deploy retry helper

Closes the "install just works" gap on a clean v1.18.x run. Three field-report items from the latest consumer install:

1. Pre-split `.gitignore` didn't cover the new `functions-admin/lib/` and `functions-stripe/lib/` tsc output — customers were accidentally committing build artifacts on every upgrade.
2. First-ever 2nd-gen Cloud Functions deploy fails with a red `Permission denied while using the Eventarc Service Agent — Retry the deployment in a few minutes` error. The retry always works within a minute or two, but the raw `Error:` scares customers into thinking their store is broken.
3. Every functions deploy ends with `Error: Functions successfully deployed but could not set up cleanup policy in location us-central1` in red. The functions deployed fine — this is just Artifact Registry image retention — but the `Error:` prefix reads like a failure.

### Added
- **Scaffolder now writes per-codebase `.gitignore`** inside each generated `functions-admin/` and `functions-stripe/` dir (2 lines each: `node_modules` + `lib/`). Matches what `firebase init functions` ships and stops `tsc` output from being staged on upgrade. Written inline by the scaffolder because npm strips `.gitignore` entries from tarballs (it uses them as ignore rules rather than shipping them).
- **[firebase/scripts/deploy-functions.mjs](firebase/scripts/deploy-functions.mjs)** — consumer-side wrapper around `firebase deploy --only functions:<codebase>`. Detects the Eventarc-propagation error class and retries with a 60s visible countdown (max 2 retries). On success, runs `firebase functions:artifacts:setpolicy --force` and reframes the output with a `[cleanup-policy]` prefix so the informational lines aren't mistaken for errors. Zero new deps — pure Node built-ins.
- **Scaffolder: `deploy:admin` and `deploy:stripe` npm scripts** in the generated `package.json` wired to the helper above. Raw `firebase deploy` still available via the existing `firebase:deploy` script.

### Changed
- **[scaffold/create.mjs](scaffold/create.mjs) generated `.gitignore`** now also ignores `functions-admin/lib/` and `functions-stripe/lib/` as belt-and-braces in case the per-codebase ignore files are removed or merged away.
- **Generated README first-run checklist step #4** now recommends `npm run deploy:admin` over raw `firebase deploy`, with a one-paragraph explanation of the two first-deploy papercuts the helper handles.
- **[INSTALL.md §5 "Deploy Cloud Functions"](INSTALL.md)** updated to recommend `npm run deploy:admin` / `npm run deploy:stripe` and explain the Eventarc + cleanup-policy smoothings.

### Consumer action required on upgrade
If you've already scaffolded a site on v1.18.x and want the new deploy helper + per-codebase ignores:

```bash
npm install github:Caspian-Explorer/script-caspian-store#v1.19.0

# Create per-codebase .gitignore files (npm strips .gitignore from tarballs, so
# these must be written by hand for upgraded sites — fresh scaffolds get them automatically):
printf 'node_modules\nlib/\n' > functions-admin/.gitignore
printf 'node_modules\nlib/\n' > functions-stripe/.gitignore   # only if you deployed Stripe

# Add the deploy helper scripts to your package.json:
#   "deploy:admin":  "node node_modules/@caspian-explorer/script-caspian-store/firebase/scripts/deploy-functions.mjs --codebase caspian-admin",
#   "deploy:stripe": "node node_modules/@caspian-explorer/script-caspian-store/firebase/scripts/deploy-functions.mjs --codebase caspian-stripe"

# If you accidentally staged functions-admin/lib/ or functions-stripe/lib/ on a prior upgrade, untrack them now:
git rm -r --cached functions-admin/lib/ functions-stripe/lib/ 2>/dev/null || true
```

Fresh scaffolds pick up everything automatically.

### Notes
- The retry regex covers the three phrasings Firebase's CLI currently emits for Eventarc-propagation failures; if Google rewords the error, the helper falls through to exit with the original code and the customer sees the raw message, same as today (no regression).
- `firebase functions:artifacts:setpolicy` is one-time per project/region — the helper runs it on every deploy, but subsequent runs are no-ops. The `--force` flag suppresses the confirmation prompt.

## v1.18.2 — Fix scaffolded `next.config.mjs` image-host allowlist

Scaffolded storefronts were crashing with a `next/image` "hostname ... is not configured" runtime error whenever a product image came from a host outside Firebase Storage or Google user content (e.g. Wikimedia, Unsplash, a third-party CDN). The scaffolder's generated `next.config.mjs` shipped a two-host allowlist that was too tight for real catalogs.

### Fixed
- **[scaffold/create.mjs](scaffold/create.mjs) — `next.config.mjs` image hosts.** The generated config now allows any `https` host by default (`{ protocol: 'https', hostname: '**' }`), with an inline comment showing how to tighten it to an explicit per-host list for production. Fixes the "Invalid src prop — hostname not configured under images" runtime error for catalogs referencing images from external CDNs.
- **`--use-create-next-app` delegation path now carries our `images` config.** Previously, the delegated path inherited whatever `create-next-app` wrote (no `images` block at all), so the bug was silent in that branch. The scaffolder now removes any `next.config.{ts,js,mjs}` create-next-app emitted and writes our shared `next.config.mjs` on top.
- **[examples/nextjs/next.config.js](examples/nextjs/next.config.js)** — mirrored the same permissive images config so the example app renders arbitrary catalogs without surprise errors.

### Added
- **[INSTALL.md](INSTALL.md) — new "Configure `next/image` hosts" subsection** under manual Next.js setup, showing both the permissive scaffolder default and a tighter per-host recipe for production, with a link to the upstream Next.js docs.

### Notes
- No source, public API, or ruleset changes. Existing consumer sites can adopt the fix by editing their own `next.config.mjs` — the new subsection in INSTALL.md has the exact snippet.

## v1.18.1 — Fix scaffolder stripe runtime + regenerate Function lock files

Small follow-up to v1.18.0 catching a scaffolder bug and stale lock files that didn't make the cut.

### Fixed
- **[scaffold/create.mjs](scaffold/create.mjs) — generated `firebase.json` stripe codebase runtime.** v1.18.0 bumped the admin codebase from `nodejs20` to `nodejs22` in the scaffolder's output but missed the `--with-stripe` branch; scaffolded projects with `--with-stripe` got a mixed `nodejs22`/`nodejs20` config. Both now emit `nodejs22`.

### Changed
- **[firebase/functions-admin/package-lock.json](firebase/functions-admin/package-lock.json) and [firebase/functions-stripe/package-lock.json](firebase/functions-stripe/package-lock.json) regenerated** to reflect the `firebase-functions@^7` and `firebase-admin@^13` deps that shipped in v1.18.0. The v1.18.0 commit carried the `package.json` bumps but left the lock files pinned to the old v6/v12 resolution tree.

### Notes
- No source, public API, or ruleset changes. Consumer upgrade from v1.18.0 → v1.18.1 needs no action beyond `npm install` — and only if you were scaffolding with `--with-stripe` (otherwise the stripe runtime fix doesn't affect you).

## v1.18.0 — Split Cloud Functions codebase + retroactive admin-claim callable

Two interlocking fixes for the admin-bootstrap chicken-and-egg reported in the v1.15 field install:

1. **Functions codebase split.** The single `caspian-store` codebase forced `firebase deploy` to pre-flight all functions — including Stripe ones — before deploying *any*, so a consumer without Stripe configured couldn't deploy even `onUserCreate`. Splitting into two codebases lets the admin trigger ship on install day.
2. **New `claimAdmin` callable.** Closes the retroactive gap that `onUserCreate` can't: if the installer registered *before* deploying the trigger, the trigger never fires on their already-created `users/{uid}` doc. The callable runs on demand (wire it to the AdminGuard "Claim admin role" button), gated by the same "no admin exists yet" invariant the trigger uses.

### Added
- **[firebase/functions-admin/src/claim-admin.ts](firebase/functions-admin/src/claim-admin.ts)** — `claimAdmin` callable (v2 `onCall`). Throws `failed-precondition` once any admin exists, so the bootstrap window can never be re-opened by a malicious caller.
- **"Claim admin role" button in [src/admin/admin-guard.tsx](src/admin/admin-guard.tsx)** — wired to the new callable via `httpsCallable`. On success, calls `refreshProfile()` and the guard re-renders with the admin surface. On the `failed-precondition` error (admin already exists) the button shows the message but keeps the CLI / console / UID-copy paths visible as fallbacks.

### Fixed
- **[src/admin/admin-guard.tsx](src/admin/admin-guard.tsx) access-denied message** — removed the stale "re-run the seed script with --admin" language (the standalone `grant-admin.mjs` CLI has shipped since v1.11.0). Replaced with a three-path list: Claim admin button (if no admin yet), `grant-admin` CLI, Firestore console. The UID copy block from v1.10.0 stays.

### Changed (runtime bumps — time-sensitive)
- **Firebase Functions Node runtime `20 → 22`** in both [firebase/firebase.json](firebase/firebase.json) codebase entries and the scaffolder's generated `firebase.json`. **Firebase deprecates Node 20 on 2026-04-30 and decommissions it 2026-10-30.** Consumers still on Node 20 will lose redeploy capability this October. Package.json `engines.node` bumped to `"22"` in both `functions-admin/` and `functions-stripe/`.
- **`firebase-functions@^6.1.0 → ^7.0.0`** in both Function codebases. Our handlers use `firebase-functions/v2/*` APIs only, which are source-compatible across the bump — verified by recompiling both codebases locally (`tsc` clean, all exports land in `lib/`).
- **`firebase-admin@^12.6.0 → ^13.0.0`** in both Function codebases, matching the scaffolder bump in v1.16.1.

### Changed
- **[firebase/functions/](firebase/functions/) replaced by [firebase/functions-admin/](firebase/functions-admin/) and [firebase/functions-stripe/](firebase/functions-stripe/).**
  - `functions-admin` — `onUserCreate` only. Deps: `firebase-admin`, `firebase-functions`. No secrets, no Stripe, deployable immediately on a fresh Firebase project.
  - `functions-stripe` — `createStripeCheckoutSession`, `stripeWebhook`, `getStripeSession`. Deps: `firebase-admin`, `firebase-functions`, `stripe`. Requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` — deploy separately when your Stripe account is ready.
- **[firebase/firebase.json](firebase/firebase.json)** now declares two codebases (`caspian-admin`, `caspian-stripe`) with matching `predeploy` build steps. Deploy targets become `firebase deploy --only functions:caspian-admin` and `firebase deploy --only functions:caspian-stripe`.
- **[scaffold/create.mjs](scaffold/create.mjs)** — scaffolder now always copies `functions-admin/` and always includes the `caspian-admin` entry in the generated `firebase.json`. Opt into Stripe with `--with-stripe` (or the back-compat alias `--with-functions`) — that adds `functions-stripe/` and the matching codebase entry.
- **[INSTALL.md §5](INSTALL.md)** rewritten to describe the two-codebase deploy flow: admin always, Stripe when ready.
- **Generated README's first-run checklist step #4** now deploys `functions:caspian-admin` as step 1 (before registering!), then `functions:caspian-stripe` as optional step 2 with a clear signal about what secrets are needed.

### Consumer action required on upgrade
If you were on v1.17.0 or earlier:

```bash
npm install github:Caspian-Explorer/script-caspian-store#v1.18.0 firebase
rm -rf functions                                  # delete the old unified codebase
cp -R node_modules/@caspian-explorer/script-caspian-store/firebase/functions-admin .
cp -R node_modules/@caspian-explorer/script-caspian-store/firebase/functions-stripe .   # only if you have Stripe
cp node_modules/@caspian-explorer/script-caspian-store/firebase/firebase.json .         # or merge manually
cd functions-admin && npm install && cd ..
firebase deploy --only functions:caspian-admin
```

The old `functions:caspian-store` deploy target is gone; use `functions:caspian-admin` and `functions:caspian-stripe` instead.

### Notes
- Previously-deployed `caspian-store` codebase functions on Firebase aren't automatically renamed by this change. After deploying `caspian-admin` and `caspian-stripe`, use `firebase functions:delete <functionName> --codebase caspian-store` to clean up the orphans, or just leave them — they'll be idle.
- v1.17.0's rules CI doesn't yet cover Cloud Functions compilation. Future release could add a `functions-admin: tsc --noEmit && functions-stripe: tsc --noEmit` step alongside the rules tests — catches type regressions in the triggers at PR time.

## v1.17.0 — Rules compile + behavior tests in CI

The last two shipped bugs — v1.13.0 (`storage.rules` grammar) and v1.15.0 (`users/{uid}` first-create silently denied) — both escaped because nobody ran `firebase deploy` before release. The rules tree now has two safety nets: the Firebase emulator runs on every PR (compiles the rules files, fails CI on grammar errors), and [@firebase/rules-unit-testing](https://firebase.google.com/docs/rules/unit-tests) executes a small behavior suite against the rules (would have caught v1.15.0 at PR time).

### Added
- **[.github/workflows/rules.yml](.github/workflows/rules.yml)** — the repo's first GitHub Action. Triggers on push / PR that touches `firebase/*.rules`, `firebase/firestore.indexes.json`, `firebase/firebase.json`, the test file, or the workflow itself. Steps: checkout → setup Node 20 → setup Java 17 (emulators are JVM-based) → `npm install --legacy-peer-deps` → install `firebase-tools` globally → `firebase emulators:exec --only firestore,storage "node --test firebase/rules.test.mjs"`. The `emulators:exec` command boots the emulator (which parses the rules on startup and exits non-zero on grammar errors), runs the behavior suite, and tears down. Both bug classes fail CI before reaching a release.
- **[firebase/rules.test.mjs](firebase/rules.test.mjs)** — Node-22 `node --test` + `@firebase/rules-unit-testing@5`. ~20 assertions covering:
  - `users/{uid}` — auth user can self-create with `role='customer'` or role omitted; **cannot** self-create with `role='admin'`; **cannot** self-promote via update; unauth can't read. This is the exact regression that hit v1.15.0.
  - `products/{id}` — public read; non-admin write denied; admin write succeeds.
  - `orders/{id}` — auth user can create own order; cannot read another user's; admin can read any.
  - `reviews/{id}` — auth user can create with `status='pending'` and rating in [1, 5]; cannot create with `status='approved'` or rating out of bounds.
  - `adminTodos/{id}` — non-admin read/write denied; admin read/write succeeds.
- **`emulators` + `storage` blocks in [firebase/firebase.json](firebase/firebase.json)** — firestore on `:8080`, storage on `:9199`, UI disabled, `singleProjectMode: true`. Required for `firebase emulators:exec` to know which services to boot.
- **`@firebase/rules-unit-testing@^5.0.0`** added as a devDep in the main [package.json](package.json).
- **`npm test` script:** `cd firebase && firebase emulators:exec --only firestore,storage "cd .. && node --test firebase/rules.test.mjs"`. Runs the same suite locally; requires `firebase-tools` on PATH and a JRE.

### Changed
- **[CLAUDE.md](CLAUDE.md) Pre-Commit Checklist step 2** flipped from "N/A — no test runner is configured" to the `npm test` instructions above, with a Java-not-installed fallback pointing at CI. The "don't add Jest/Vitest/Playwright" rule still applies for component/unit tests; the rules tests are a narrow exception.

### No consumer action required
CI infrastructure only — no source, public API, or ruleset change. Existing installs are unaffected; the upgrade is transparent.

### Notes
- Regression-verified locally: reverting the v1.15.0 `users/{uid}` rule fix makes three of the suite's assertions fail; re-applying the fix turns them green again. Proves the tests actually gate the bug they were written for, not just pass-through noise.
- The install of `@firebase/rules-unit-testing` requires `--legacy-peer-deps` because its v5 peers `firebase@^10` while this repo pins `firebase@^11` as a devDep to match consumer peer deps. The behavior is fine at runtime; the workflow passes the flag explicitly.

## v1.16.1 — Scaffolder firebase-admin bump + upgrade-path docs

Three small-but-real items from a post-v1.15 field review that didn't make it into v1.16.0: an `npm audit` footgun in the scaffolder's `firebase-admin` pin, a stale version pin in the manual-install copy-paste, and a missing upgrade-procedure note that causes "every route 500s" on in-place upgrades.

### Changed
- **[scaffold/create.mjs](scaffold/create.mjs) `firebase-admin` pin bumped `^12.0.0` → `^13.0.0`** in the generated project's devDependencies. Closes a long-standing `npm audit` noise footgun (transitive `@tootallnate/once` / older `@google-cloud/*` chain in 12.x) that made `npm audit fix --force` *downgrade* `firebase-admin` to 10.x and introduce 5 critical vulnerabilities. `seed.mjs` and `grant-admin.mjs` use stable SDK APIs (`admin.initializeApp` / `firestore()` / `auth()`); 12 → 13 is transparent.
- **Scaffolder-generated README Upgrade section** now documents the dev-server stale-cache footgun: stop `next dev`, bump the dep, redeploy rules if changed, clear `.next`, restart. Avoids the "every route 500s after upgrade" trap.
- **[INSTALL.md §1](INSTALL.md) manual-install copy-paste** no longer pins stale `#v1.9.0`; now points at `#v1.16.1` with a link to the releases page so readers can pick the latest.

### Notes
- Pure scaffolder + docs; no source or build changes. Consumers don't need to upgrade their code. For existing scaffolded projects: running `npm install firebase-admin@^13 --save-dev` in the consumer project brings the `firebase-admin` dep in line with what new scaffolds get.

## v1.16.0 — Frontend deployment path: Vercel + Firebase App Hosting

Consumers who followed `INSTALL.md` end-to-end ended up with deployed Firestore rules, Storage rules, Cloud Functions, and seed data — but **no documented path for deploying the Next.js site itself**. The generated `npm run firebase:deploy` script ran `firebase deploy`, but the scaffolder's `firebase.json` has no `hosting` block, so only the backend rules/functions deployed. Closing that gap with first-class docs + a scaffolded `apphosting.yaml`.

### Added
- **Firebase App Hosting wiring in [scaffold/create.mjs](scaffold/create.mjs).** Scaffolded projects now ship an `apphosting.yaml` at the project root declaring the six `NEXT_PUBLIC_FIREBASE_*` vars + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` with `availability: [BUILD, RUNTIME]` (BUILD is required — Next.js inlines `NEXT_PUBLIC_*` at build time). Values left blank by design; consumers fill them via the Firebase console or commit non-sensitive values. Safe to delete if the consumer deploys to Vercel instead.
- **§8 "Deploy the Next.js site" in the scaffolder-generated README** ([scaffold/create.mjs](scaffold/create.mjs)). Two parallel subsections cover Vercel (`npx vercel@latest --prod`, paste env vars in dashboard) and Firebase App Hosting (`firebase init apphosting` + `firebase deploy --only apphosting`). Notes that the Stripe webhook points at the Cloud Function, not the Next.js site — switching hosts doesn't reconfigure it.
- **§11 "Deploy the Next.js frontend" in [INSTALL.md](INSTALL.md)** for the manual-install path. Mirrors the scaffolder README but targets consumers embedding the package into an existing React app; documents the minimal `apphosting.yaml` shape for those who aren't using the scaffolder. Upgrade moves from §11 to §12.

### Notes
- No source changes; this is pure scaffolder + docs. Existing installs on v1.15.x or earlier can upgrade without code edits, then copy the `apphosting.yaml` template from the new [INSTALL.md §11](INSTALL.md#11-deploy-the-nextjs-frontend) if they want Firebase App Hosting.

## v1.15.0 — Fix first-sign-in profile create + admin nav link + AccountPage polish

A consumer reported three issues on a fresh install: (1) `/account` was missing the Profile / Photo / Addresses cards and had a huge blank gap at the top, (2) there was no visible way to navigate to `/admin` from the UI. Root cause of (1) turned out to be a Firestore-rules bug that silently blocked first-ever profile creation; (2) was intentional security (hide admin from non-admins) but missing a `role === 'admin'` escape hatch. Fixed both, plus tightened the account-page layout.

### Fixed
- **[firebase/firestore.rules](firebase/firestore.rules) `users/{uid}` rule blocked first-ever profile creation.** The single `allow write` rule required `request.resource.data.role == resource.data.role`, but on create `resource.data` is null, so `'customer' == null` evaluated false and the write was denied. The client's [auth-context.tsx](src/context/auth-context.tsx) silently caught the permission error and set `userProfile = null`, which made every profile-dependent UI card (`<ProfileCard>`, `<ProfilePhotoCard>`, `<AddressBook>`) early-return null. Rule now splits into `allow create` (permits role absent or explicitly `'customer'`) and `allow update` (role must equal existing). Admin-branch and read-self are unchanged.
- **Consumer action required after upgrading:** re-deploy the Firestore rules — `firebase deploy --only firestore:rules` — or the bug persists on already-deployed projects. The rule ships in both the package's `firebase/firestore.rules` and any scaffolded consumer's own copy.

### Added
- **Admin nav link in [SiteHeader](src/components/site-header.tsx).** A small "Admin" button renders in the right-side cluster (before the account avatar) only when `userProfile.role === 'admin'`. Clicks through to `/admin`. Invisible to non-admins — no information leak. New i18n key `navigation.admin`.

### Changed
- **[AccountPage](src/components/auth/account-page.tsx) layout polished.** Wrapped in a `maxWidth: 960` container with `32px/24px` padding so it no longer stretches edge-to-edge on wide screens. Header now renders an [Avatar](src/ui/misc.tsx) (user's `photoURL` if present, initial fallback) next to the title + signed-in-as line, on a subtle gradient card. Section order tightened: Photo → Profile → Addresses → Password → Orders → Delete. No prop changes; `AccountPageProps` remains the same.

## v1.14.0 — Fix `<DynamicFavicon>` rendered outside `<CaspianStoreProvider>`

Consumer running a fresh scaffolded install saw `Error: useCaspianStore must be called inside <CaspianStoreProvider>` at runtime. Root cause: the scaffolder and INSTALL.md §3 both emitted a `layout.tsx` with `<DynamicFavicon />` as a **sibling** of `<Providers>` instead of a child. [`<DynamicFavicon>`](src/components/dynamic-favicon.tsx) calls `useCaspianFirebase()` which requires the provider above it in the tree.

### Fixed
- [scaffold/create.mjs](scaffold/create.mjs) generated `layout.tsx` — moved `<DynamicFavicon />` inside `<Providers>`.
- [INSTALL.md](INSTALL.md) §3 Next.js example — same correction.

### Notes
- Existing installs scaffolded from v1.7.0–v1.13.0 need to edit their own `src/app/layout.tsx` manually (bumping the package dep doesn't touch consumer files). One-line move:
  ```diff
       <Providers>
         <LayoutShell>{children}</LayoutShell>
  +      <DynamicFavicon />
       </Providers>
  -    <DynamicFavicon />
  ```
- Consider adding a runtime sanity check to `<DynamicFavicon>` that renders a clearer *"must be inside `<CaspianStoreProvider>`"* message instead of bubbling the generic `useCaspianStore` error — deferred to a later release.

## v1.13.0 — Fix `storage.rules` compile error on fresh installs

A consumer running `firebase deploy --only storage` against a fresh install hit a grammar error. Root cause was a `{wildcard}` inside a path segment — not supported by Firebase Storage rules grammar. Bug dates back to v0.6.0 (profile-photo feature) and was never caught because storage rules only compile at deploy time and CI doesn't run `firebase deploy`.

### Fixed
- [firebase/storage.rules](firebase/storage.rules) — replaced `match /users/{uid}/avatar.{ext} { … }` with `match /users/{uid}/{filename} { … }`. Security is unchanged: the existing `write` guard already enforces `contentType.matches('image/(jpeg|png|webp)')` + `size < 5 MB`, so relaxing the path pattern doesn't broaden what can be uploaded.

### Notes
- No `{path=**}` recursive wildcard was used — avatars are a single flat file, not a subtree. Single-segment `{filename}` is the minimal fix.
- Consider adding `firebase emulators:start --only storage` (which compiles the rules on boot) to CI so future rules regressions fail at PR time, not at consumer-deploy time.

## v1.12.0 — Configurable Next version + optional `create-next-app` delegation

Picks up the two 🔵 nits the install reviewer explicitly deferred — closing out the punch list.

### Added
- **`--next-version <spec>`** on [scaffold/create.mjs](scaffold/create.mjs). Overrides the pin for `next` in the generated `package.json`. Default bumped from the old hard-coded `^14.2.0` to `^15.0.0`. Users who want Next 14 can still scaffold with `--next-version '^14.2.0'`.
- **`--use-create-next-app`** on [scaffold/create.mjs](scaffold/create.mjs) (opt-in). When passed, the scaffolder delegates the Next.js boilerplate to `npx create-next-app@latest` (flags: `--typescript --app --src-dir --no-tailwind --no-eslint --import-alias "@/*" --use-npm --yes --skip-install --disable-git`) and overlays our package dependencies, scripts, pages, adapters, providers, and Firebase config on top. This insulates the generated `tsconfig.json`, `next.config.*`, `next-env.d.ts`, and `.gitignore` from drifting out of step with Next upstream. Windows uses `shell: true` with a single command string so `cmd.exe` resolves the `npx.cmd` wrapper via `PATHEXT`; Linux/macOS spawn `npx` directly.

### Changed
- **Default Next pin** in the scaffolder is now `^15.0.0` (was `^14.2.0`). Next 15 supports React 19 — when using `--use-create-next-app`, the merged `package.json` inherits Next 15's `react`/`react-dom` `19.x` pins and `@types/react` `^19`. Hand-written path keeps the existing React 18 pins for backward compat; pass `--use-create-next-app` to get the React 19 stack.

### Notes
- Both paths are verified end-to-end: hand-written with default `^15.0.0`, hand-written with `--next-version '^14.2.0'`, and `--use-create-next-app` (network-dependent, ~30s). `--use-create-next-app` currently opts in; may flip to default after it's battle-tested.

## v1.11.1 — `npm create caspian-store@latest` (thin sibling package)

Main-package bump covers the doc updates; the actual new capability ships as a separate npm package.

### Added
- **`create-caspian-store` v0.1.0** ([create-caspian-store/](create-caspian-store/)) — a thin launcher published separately to npm. Enables `npm create caspian-store@latest <project-dir>` by cloning this repo shallowly into a temp dir, invoking [scaffold/create.mjs](scaffold/create.mjs) against the user's target with all flags forwarded, then cleaning up the clone. Requires `git` on `PATH` and Node ≥ 18.

### Changed
- [README.md](README.md) Quickstart now leads with `npm create caspian-store@latest`; the git-URL install remains as the "Manual install" path.
- [INSTALL.md](INSTALL.md) §0 replaced with the `npm create` one-liner; the old `git clone + node scaffold/create.mjs` invocation kept as a fallback for offline / locked-network environments.

### Not affected
- No source, build, or public API changes in the main package — so no upgrade action is required. `npm install github:Caspian-Explorer/script-caspian-store#v1.11.0` and `#v1.11.1` are interchangeable for consumers of the main package.

## v1.11.0 — Admin onboarding: auto-promote + grant-admin CLI

First-install admin grant no longer requires hunting for a uid in the Firebase console or editing Firestore by hand.

### Added
- **`onUserCreate` Firestore trigger** ([firebase/functions/src/on-user-create.ts](firebase/functions/src/on-user-create.ts)) — when the first-ever `users/{uid}` doc is created and no admin exists yet, promotes that user to `role: 'admin'`. Once any admin exists the trigger permanently short-circuits, so it's a strictly first-install helper. Exported from [firebase/functions/src/index.ts](firebase/functions/src/index.ts) alongside the Stripe handlers; deployed automatically when consumers run `firebase deploy --only functions`.
- **`grant-admin.mjs` CLI** ([firebase/seed/grant-admin.mjs](firebase/seed/grant-admin.mjs)) — promotes an existing user by email or uid. Accepts `--project`, `--credentials`, `--email <addr>` OR `--uid <uid>`. When `--email` is passed, resolves the uid via `firebase-admin/auth` before writing `users/{uid}.role = 'admin'` with `{ merge: true }`. Fails loudly if the target hasn't signed in yet (no users/{uid} doc) or the email doesn't match a Firebase Auth record.
- Scaffolder-generated `package.json` gains `"grant-admin"` as an npm script, pointing at `node_modules/@caspian-explorer/script-caspian-store/firebase/seed/grant-admin.mjs`.

### Changed
- **INSTALL.md §7** rewritten to present three paths — auto-promote (preferred), `grant-admin` CLI by email or uid (explicit), and hand-edit in the Firebase console (fallback) — instead of the old "find your uid in the console, re-run seed --admin".
- **Scaffolder generated README** — the admin-grant step now points at auto-promote first and `npm run grant-admin -- --email` as the explicit path; no more Firebase-console uid hunting.

### Security note
The `onUserCreate` trigger has a small race window during initial deployment: between the function going live and the installer registering their account, any other sign-up wins the admin role. Mitigations: deploy the function immediately before signing up, or leave it disabled and use the CLI. The in-code "check for existing admin before promoting" guard protects against *later* auto-promotions, not this initial race.

## v1.10.0 — Scaffolder polish + AdminGuard UID helper

The turnkey scaffolder produces a project that can now `firebase deploy` cleanly without any manual `cp` from `node_modules`, and a non-admin landing on `/admin` finally sees their own UID with a copy button instead of being told to hunt for it in the Firebase console.

### Added
- **`--with-functions` flag** on [scaffold/create.mjs](scaffold/create.mjs). Copies the package's [firebase/functions/](firebase/functions/) tree (Stripe Cloud Functions + Node 20 `package.json` + `tsconfig`) into the generated project and adds the `functions` block to `firebase.json`. Default stays off so a first-time user doesn't need a Blaze-plan upgrade on day one.
- **AdminGuard UID display.** When `userProfile.role !== 'admin'`, the access-denied screen now renders the signed-in user's `uid` in a monospaced block with a **Copy UID** button. Paste straight into `npm run firebase:seed -- --admin <uid>`.

### Fixed
- **Scaffolder wrote comment-only rule stubs.** The generated `firestore.rules`, `firestore.indexes.json`, and `storage.rules` were placeholder files telling the user to "copy me from node_modules" — anyone running `firebase deploy --only firestore:rules` before reading them deployed a comment-only ruleset and locked their database. The scaffolder now copies the real files from [firebase/](firebase/) at scaffold time.
- **Scaffolder refused to run on any non-empty directory.** Fresh `gh repo create` / `git init` leaves `.git`, `.gitignore`, `README.md`, `LICENSE` around — the scaffolder now detects these as "harmless", proceeds without `--force`, and emits a clearer error listing the actual files that would be overwritten when it can't.
- **Scaffolder wrote a `functions` block for a non-existent directory.** `firebase.json` used to list `functions: [{ source: 'functions', ... }]` while no `functions/` was ever created, making `firebase deploy --only functions` fail. The block is now written only when `--with-functions` is passed.
- **Scaffolder's `--package-tag` default was hard-coded** (last release: `v1.8.0`, so fresh clones post-v1.9.0 still pinned to v1.8.0). Now reads the package's own `package.json` version at scaffold time.

### Changed
- **`.env.example`** generated by the scaffolder gains `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=` and a comment explaining that `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` are Cloud Functions secrets (set via `firebase functions:secrets:set`), not env vars.
- **Generated `README.md`'s first-run checklist** drops the obsolete `cp node_modules/.../firebase/*.rules` step (the scaffolder now drops them in directly) and points admin-grant instructions at the new AdminGuard UID copy button.

## v1.9.0 — Unblock installs (fixed `'use client'`, fixed `exports` map)

Fresh installs into Next.js App Router now render. Two build-time bugs that had quietly shipped since tsup 8.5 upgraded the ESM/CJS filename convention are fixed.

### Fixed
- **`'use client'` preservation in the main bundle.** esbuild was stripping the module-level directive during bundling (warning: "Module level directives cause errors when bundled"), so consumers hit RSC-context errors the moment they imported anything from the package. The fix prepends `'use client';` to `dist/index.mjs` and `dist/index.js` via a tsup `onSuccess` hook — `banner: { js: "'use client';" }` does NOT work (esbuild strips it), and `esbuild-plugin-preserve-directives` was not preserving directives on Windows. The `./firebase` sub-entry is intentionally left unbannered so `initCaspianFirebase`, `caspianCollections`, and the Firestore rules/indexes constants stay callable from Node deploy scripts, Cloud Functions, and Server Components.
- **`exports` map referenced files tsup no longer emits.** Under tsup 8.5, ESM outputs are `.mjs` and CJS outputs are `.js`. The `exports` map was pinned to the older tsup convention (`.js` for ESM, non-existent `.cjs` for CJS), so `require('@caspian-explorer/script-caspian-store')` failed to resolve. Exports now map `import` → `.mjs` and `require` → `.js` for both the root and `./firebase` entries.

### Changed
- [tsup.config.ts](tsup.config.ts) split into two configs — main entry (gets the directive) and firebase sub-entry (does not) — so the two can be banner'd independently.
- [README.md](README.md) and [INSTALL.md](INSTALL.md) refreshed: stale version pins updated, the long-standing "a v0.1.1 release will preserve per-file directives automatically" promise removed (it's now actually preserved), the roadmap collapsed into a short release-history summary pointing at this CHANGELOG, and §0 (scaffolder) now branches cleanly from §1–§11 (manual install).

### Added
- **[CLAUDE.md](CLAUDE.md)** — orientation + workflow for AI coding sessions. Captures durable architecture invariants (two tsup entries, provider nesting order, framework-adapter contract, centralized Firestore collection refs, Server Component boundary), conventions (services signature, theming surface, i18n, class merging), the full release cycle (bump → docs → verify → commit → tag → push → release → announce), and the never-do list.
- `.claude/` added to [.gitignore](.gitignore) so session-local Claude state stays out of the repo.

## v1.8.0 — Admin todo list + seeded setup checklist

Adds an in-admin todo list so the person running the store has a single place to track setup actions and day-to-day operational tasks.

### Added
- **`<AdminTodoPage>`** — new admin page at `/admin/todos`. Lists tasks with checkboxes, progress bar (`N / M complete (X%)`), a "Hide completed" filter, inline add (press Enter to create), and per-row delete. Seeded tasks are tagged with a "Setup" badge so they're distinguishable from admin-added ones.
- **Setup checklist** — 12 pre-written tasks covering the manual steps needed to make a fresh install production-ready: deploy rules, deploy Cloud Functions, configure Stripe webhook, grant admin role, edit site settings, activate languages, seed categories + products, verify shipping, edit hero, pin featured content. Empty `adminTodos` collection shows a "Seed setup checklist" button; clicking it writes the defaults idempotently (re-seeding skips existing ids).
- **`admin-todo-service`** — `listAdminTodos` / `createAdminTodo` / `updateAdminTodo` / `deleteAdminTodo` / `seedDefaultAdminTodos` + `DEFAULT_ADMIN_TODOS` exported from the package root.
- **Types** — `AdminTodo` interface exported.
- **Nav** — `DEFAULT_ADMIN_NAV` gains a "Todo list" entry between Dashboard and Products.
- **Firestore rules** — new `match /adminTodos/{id}` block (admin-only read + write).
- **Scaffolder** — generates `src/app/admin/todos/page.tsx` and pins new installs to v1.8.0.

### Migration note
Drop-in from v1.7.0. Existing consumers get the new page automatically by bumping the tag; the `adminTodos` collection is empty until an admin clicks "Seed setup checklist".

## v1.7.0 — Turnkey install (scaffolder + seed + rewritten INSTALL)

No runtime changes. Makes the package trivial to install on a fresh domain.

### Added
- **`scaffold/create.mjs`** — Node scaffolder that generates a ready-to-run Next.js App Router consumer site wired up to the package. 48 pre-mounted routes (storefront + auth + account + editorial + admin), Next.js adapter code, Firebase config placeholders, tailored README with first-run checklist. Run with `node <path>/scaffold/create.mjs my-store [--package-tag vX.Y.Z]`.
- **`firebase/seed/seed.mjs`** — idempotent Firestore seeder using `firebase-admin`. Writes the `languages` collection (en/ar/de/es/fr with English as default), `settings/site` brand placeholders, `scriptSettings/site` (theme + hero + fonts), and `shippingMethods` (standard + express). Optional `--admin <uid>` flag promotes a Firebase Auth user to admin.
- **`INSTALL.md`** — fully rewritten for v1.6.0+. Covers the one-command scaffold path up front, then every surface added in phases 2–6 (homepage, journal, FAQs, shipping, size guide, admin CRUD pages, site shell), multi-locale i18n, theming, fonts, Troubleshooting section.

### Packaging
- `scaffold/` directory is now included in the published tarball so `node_modules/@caspian-explorer/script-caspian-store/scaffold/create.mjs` resolves after install.

## v1.6.0 — Site shell (header, footer, layout, favicon)

Sixth and final release in the hadiyyam migration series. Ships the site chrome — header, footer, layout shell, and dynamic favicon — so consumers can drop their bespoke shell components and have a working storefront end-to-end out of the package. No breaking changes.

### Added
- **`<SiteHeader>`** — sticky header with brand (auto-loaded from `settings/site.brandName`, falls back to a `brandFallback` prop), configurable top-level nav, optional "Pages" dropdown for secondary nav, search slot, language-switcher slot, user-menu slot, wishlist + cart icon buttons. The cart button opens an inline `<CartSheet>` so consumers don't need to wire it up themselves.
- **`<SiteFooter>`** — four-column footer (brand + description + social, About, Customer care, Newsletter). Brand description and social links read from `settings/site` automatically. Newsletter form posts to the `subscribers` collection via the already-shipped `subscribeEmail` helper. Social icons use a built-in `<SocialIcon>` SVG mapper for the 8 most-common platforms (instagram, facebook, twitter/x, youtube, tiktok, linkedin, pinterest); override via `renderSocialIcon` prop.
- **`<LayoutShell>`** — wraps children with `<SiteHeader>` + `<SiteFooter>` and bypasses the chrome on routes whose pathname (after stripping the locale prefix) starts with one of `bypassPrefixes` (default `['/admin']`). Pass `header={null}` or `footer={null}` to disable either band; pass props through to override defaults.
- **`<DynamicFavicon>`** — reads `settings/site.faviconUrl` and updates the document's `<link rel="icon">`. Mount once in your root layout.
- **`<SocialIcon>`** — exported standalone for consumers who want to reuse the icon set elsewhere.
- **i18n** — DEFAULT_MESSAGES gains 16 new keys under `navigation.*` and `footer.*` so the shell renders sensibly even with no consumer-supplied dict.
- **Adapter contract** — `CaspianLinkProps` now accepts an optional `style` prop. Existing consumer Link adapters keep working; the package's defaults pass it through.

### Migration note
Upgrading from v1.5.x is drop-in. Hadiyyam PR #6 pins this tag, retires `src/components/header.tsx`, `footer.tsx`, `layout-shell.tsx`, and `dynamic-favicon.tsx`, and replaces them with one-line mounts of the package components. After PR #6 merges, hadiyyam's `src/` is roughly 80% smaller than at the start of the migration series.

## v1.5.0 — Remaining admin CRUD (promo codes, subscribers, categories, collections, languages, site settings)

Fifth release in the hadiyyam migration series. Ships the last set of admin pages so consumers can retire every bespoke admin CRUD they still carry. No breaking changes.

### Added
- **`<AdminPromoCodesPage>`** — CRUD for the `promoCodes` collection: code (auto-uppercased), type (`percentage` | `fixed`), value, optional `minOrderAmount` / `maxDiscount`, active toggle.
- **`<AdminSubscribersPage>`** — list of `subscribers` docs with email search, delete, and a one-click CSV export (Blob download, `subscribers-YYYY-MM-DD.csv`).
- **`<AdminProductCategoriesPage>`** — hierarchical CRUD for `productCategories`. Parent-category select is filtered to exclude self when editing. Slug auto-generates from name when left blank. Supports `isActive` + `isFeatured` flags and a display `order` integer.
- **`<AdminProductCollectionsPage>`** — CRUD for `productCollections`. Includes a searchable product picker with selected-chips view so merchandisers can assemble a curated set of products for a named collection.
- **`<AdminLanguagesPage>`** — CRUD for the `languages` registry: code (BCP 47), name, native name, flag emoji, direction (`ltr` | `rtl`), default flag, active flag. Blocks deleting the default language.
- **`<AdminSiteSettingsPage>`** — single-form editor for the `settings/site` doc: brand name, brand description, logo URL, favicon URL, contact email/phone/address, business hours, and a repeatable list of social links.
- **Services** — `promo-code-service` gains `listPromoCodes` / `createPromoCode` / `updatePromoCode` / `deletePromoCode` / `PromoCodeWriteInput`; `subscriber-service` gains `listSubscribers` / `deleteSubscriber` / `subscribersToCsv`; `category-service` gains `listAllCategories` / `createCategory` / `updateCategory` / `deleteCategory` / `CategoryWriteInput`; **new** `product-collection-service` (`listProductCollections` + CRUD + `ProductCollectionWriteInput`); **new** `language-service` (`listLanguages` + CRUD + `LanguageWriteInput`); **new** `site-settings-service` (`getSiteSettings`, `saveSiteSettings`).
- **Exports** — all the above pages, services, and write-input types exported from the package root.

### Migration note
Upgrading from v1.4.x is drop-in. Hadiyyam PR #5 pins this tag, retires `admin/promo-codes/page.tsx`, `admin/subscribers/page.tsx`, `admin/categories/page.tsx`, `admin/collections/page.tsx`, `admin/languages/page.tsx`, and `admin/settings/page.tsx`, and collapses each to a one-line mount of the package component.

## v1.4.0 — FAQs + shipping/returns + size guide

Fourth release in the hadiyyam migration series. Rounds out the static-content surfaces with FAQs, shipping/returns, and a size guide, plus their admin editors. No breaking changes.

### Added
- **`<FaqsPage>`** — public accordion page grouping `faqs` docs by category. Configurable `categoryLabels`, `categoryOrder`, `title`, `subtitle`, `emptyMessage`.
- **`<AdminFaqsPage>`** — CRUD editor with category select + per-row display order. Ships a sensible default category list (`orders` / `returns` / `products` / `account` / `general`); override via `categoryOptions`.
- **`<ShippingReturnsPage>`** — renders active `shippingMethods` as a table with locale-aware price formatting, then appends the long-form returns copy from `pageContents/shipping-returns` (or whatever `returnsPageKey` you configure).
- **`<AdminShippingPage>`** — shipping-method CRUD: name, slug (auto-generated from name), price, min/max estimated days, display order, active toggle with show/hide shortcut.
- **`<SizeGuidePage>`** — reads `scriptSettings.sizeGuide` or falls back to the exported `DEFAULT_SIZE_GUIDE` (tops/bottoms/shoes tables). The size-guide config is now a typed `SizeGuideConfig` (tables + tips) that consumers can seed to Firestore per site.
- **Types** — `SizeTableRow`, `SizeTable`, `SizeGuideConfig` exported. `ScriptSettings` gains an optional `sizeGuide?: SizeGuideConfig` field.
- **Services** — `faq-service.ts` (`listFaqs`, `createFaq`, `updateFaq`, `deleteFaq`) and `shipping-method-service.ts` (`listShippingMethods` with `{ onlyActive }` filter, `createShippingMethod`, `updateShippingMethod`, `deleteShippingMethod`).

### Migration note
Upgrading from v1.3.x is drop-in. Hadiyyam PR #4 pins this tag, retires `faqs/page.tsx`, `shipping-returns/page.tsx`, `size-guide/page.tsx`, `admin/faqs/page.tsx`, and `admin/shipping/page.tsx`.

## v1.3.0 — Journal + generic content pages

Third release in the hadiyyam migration series. Ships the editorial/journal surface plus a generic page-content system so hadiyyam can retire its hardcoded `journal/`, `about/`, `contact/`, `privacy/`, `terms/`, `sustainability/` pages in a follow-up PR. No breaking changes.

### Added
- **`<JournalListPage>`** — responsive card grid reading from the `journal` Firestore collection (ordered by `createdAt` desc). Configurable `getArticleHref`, `title`, `subtitle`, `emptyMessage`.
- **`<JournalDetailPage articleId={id}>`** — full-width article view with hero image, category badge, date, paragraph-split content (splits on double newlines), and a back link. `onNotFound` callback.
- **`<PageContentView pageKey>`** — drop-in long-form page reading from `pageContents/{pageKey}`. Shows an optional `fallback={{ title, subtitle, content }}` when no doc exists yet, and accepts an `afterContent` slot for page-specific extras (e.g. a contact form).
- **`<AdminJournalPage>`** — create / edit / delete articles. Cover images upload to `journal/{filename}` in Firebase Storage via the new `uploadAdminImage` helper; best-effort Storage cleanup on delete.
- **`<AdminPagesPage pageKeys={[...]}>`** — table-driven editor for `pageContents/{pageKey}` docs. Ships `DEFAULT_PAGE_KEYS = ['about', 'contact', 'privacy', 'terms', 'sustainability', 'shipping-returns', 'size-guide']`; consumers can override.
- **Services** — `journal-service.ts` (`listJournalArticles`, `getJournalArticle`, `createJournalArticle`, `updateJournalArticle`, `deleteJournalArticle`), `page-content-service.ts` (`getPageContent`, `listPageContents`, `savePageContent`).
- **Storage helpers** — `uploadAdminImage({ storage, path, file })` + `deleteStorageObject(storage, path)` exports for admin upload flows.
- **Storage rules** — `firebase/storage.rules` now gates `/journal/**` and `/pageContents/**` by a Firestore-backed `isAdmin()` helper (no custom claims required). Same pattern as the Firestore rules the package already ships.

### Migration note
Upgrading from v1.2.x is drop-in. Hadiyyam PR #3 will pin this tag, replace the journal + content pages, and collapse the hadiyyam admin pages for journal and pageContents to one-line renders of the package components.

## v1.2.0 — Homepage + font management

Second release in the hadiyyam migration series. Ships the homepage surface and a font-management system so hadiyyam can retire its bespoke `[locale]/page.tsx` in a follow-up PR. No breaking changes.

### Added
- **`<Hero>`** — full-bleed homepage hero. Title / subtitle / CTA / background image all read from `scriptSettings.hero` (admin-editable). A gradient fallback renders when no image is set. Override any field inline via `<Hero hero={{ title, subtitle, cta, ctaHref, imageUrl }} />`.
- **`<FeaturedCategoriesSection>`** — calls `getFeaturedCategories(db)` (new service) and renders a responsive card grid. Hides when the list is empty.
- **`<TrendingProductsSection>`** — wraps `<ProductGrid>` with a `limit` (default 4) and title/label copy.
- **`<NewsletterSignup>`** — email capture form backed by the new `subscribeEmail(db, email)` service. Idempotent: returns `'already-subscribed'` when the email is already in `subscribers/`. Ships full-section and `compact` layouts.
- **`<HomePage>`** — compound component that stacks the four built-in sections with section-hide flags and `after*` slots for custom blocks.
- **Font management** — new `<FontLoader>` auto-mounted inside `<CaspianStoreProvider>`. Pushes `--caspian-font-body` / `--caspian-font-headline` CSS variables from `scriptSettings.fonts`; when `fonts.googleFamilies` is populated it injects a `<link>` tag for `fonts.googleapis.com/css2?…` with preconnect hints. Admin-editable via `<ScriptSettingsPage>`, which gained a **Fonts** section and a **Homepage hero** section.
- **Services** — `category-service.ts` (`listActiveCategories`, `getFeaturedCategories`) and `subscriber-service.ts` (`subscribeEmail`).
- **Messages** — ~12 new keys under `settings.fonts.*`, `settings.hero.*`.

### Changed
- `<ScriptSettingsPage>` grew two new sections (Fonts, Homepage hero).
- `<CaspianStoreProvider>` now mounts `<FontLoader />` as a sibling to `<ThemeInjector />`. No consumer change required.

### Migration note
Upgrading from v1.1.x is drop-in. Hadiyyam PR #2 pins this tag, replaces `[locale]/page.tsx` with `<HomePage>`, and deletes the hardcoded homepage. Hero title / subtitle / CTA / image that lived in next-intl JSON become editable from `/admin/settings`.

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
