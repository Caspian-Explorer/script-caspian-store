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
