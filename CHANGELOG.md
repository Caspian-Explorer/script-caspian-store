# Changelog

All notable changes will be documented in this file.

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
