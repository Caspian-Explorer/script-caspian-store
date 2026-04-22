# CLAUDE.md

Orientation for AI sessions working on this repo. User-facing setup lives in [README.md](README.md) and [INSTALL.md](INSTALL.md) — don't duplicate it here. Release history lives in [CHANGELOG.md](CHANGELOG.md).

## Project

`@caspian-explorer/script-caspian-store` — a framework-agnostic React e-commerce library published to npm. Installs into any React app (Next.js App Router, Vite + React Router, CRA). Ships storefront, cart, checkout, admin panel, auth, i18n, theming, Firestore schema, and Cloud Functions for Stripe. Consumers provide their own Firebase project (**BYOF**).

A turnkey consumer-site scaffolder lives at [scaffold/create.mjs](scaffold/create.mjs) — it generates a pre-wired Next.js App Router site.

## Commands

```bash
npm run dev         # tsup --watch
npm run build       # tsup (ESM + CJS + .d.ts, two entries)
npm run typecheck   # tsc --noEmit
npm run clean       # rimraf dist
```

A `prepare` script also runs `tsup` on `npm install` — this is how `npm install github:Caspian-Explorer/script-caspian-store` produces a usable `dist/` without a separate build step. Do not remove it.

**No test runner and no linter are configured.** Do not add Jest/Vitest/Playwright/ESLint/Biome/Prettier without asking the user first.

Cloud Functions under [firebase/functions/](firebase/functions/) are a separate Node 20 project with their own `package.json` and `tsconfig.json`; they are **not** part of the tsup build. Build them from inside that directory (`npm run build` there).

## Architecture

**Two public entries** — both must stay in sync with [tsup.config.ts](tsup.config.ts) and the `exports` map in [package.json](package.json):

- `.` → [src/index.ts](src/index.ts) — providers, hooks, components, admin pages, UI primitives, services, types, i18n, theme presets, utils
- `./firebase` → [src/firebase/index.ts](src/firebase/index.ts) — `initCaspianFirebase`, `caspianCollections`, stringified rules/indexes

Plus exports: `./styles.css` (side-effect CSS, imported once at app root), `./firestore.rules`, `./firestore.indexes.json` (consumers copy into their Firebase project).

**Source layout** — grow each directory in place; don't introduce parallel structures:

- [src/provider/](src/provider/) — root provider wiring
- [src/context/](src/context/) — context impls (auth, cart, script-settings, theme, font-loader, toast)
- [src/primitives/](src/primitives/) — framework-adapter contract + defaults
- [src/components/](src/components/) — storefront components (PLP, PDP, cart sheet, checkout, homepage, site shell, …)
- [src/admin/](src/admin/) — admin-panel pages and guards
- [src/ui/](src/ui/) — generic UI primitives (Button, Dialog, Tabs, Select, Table, Toast, …)
- [src/services/](src/services/) — Firestore/service-layer functions
- [src/i18n/](src/i18n/) — LocaleProvider, message tables, formatters, switcher
- [src/theme/](src/theme/) — theme presets + picker
- [src/firebase/](src/firebase/) — Firebase init, collection refs, rules/indexes exports
- [src/utils/](src/utils/) — pure helpers (e.g. [cn.ts](src/utils/cn.ts))
- [src/styles/](src/styles/) — globals.css
- [src/types.ts](src/types.ts) — shared domain types (Product, Order, UserProfile, CartItem, Review, PromoCode, SiteSettings, …). Add new cross-module types here, not per-module files.
- [scaffold/](scaffold/) — consumer-site generator (not bundled into the library)

**Provider nesting order** (defined in [src/provider/caspian-store-provider.tsx](src/provider/caspian-store-provider.tsx)) — do not reorder:

```
CaspianStoreProvider
  → LocaleProvider
  → ToastProvider
  → AuthProvider
  → CartProvider
  → ScriptSettingsProvider
  → ThemeInjector
  → FontLoader
  → children
```

`ThemeInjector` is a null-render component that writes live `--caspian-*` CSS custom properties to `:root` on settings change. `FontLoader` injects the configured font stylesheet at runtime.

**Framework-adapter contract** at [src/primitives/types.ts](src/primitives/types.ts): `{ Link, Image?, useNavigation }`. Consumers pass adapters to the provider; defaults in [src/primitives/](src/primitives/) use `<a>`, `<img>`, `window.location`. **No `next/*`, `react-router`, `react-router-dom`, or `@remix-run/*` imports may leak into `src/`.** If you need framework behaviour, extend the adapter contract — don't import directly.

**Firestore collection refs** are centralized in [src/firebase/collections.ts](src/firebase/collections.ts). Services in [src/services/](src/services/) consume those refs — **do not call `collection(db, "foo")` ad-hoc** in services or components. When adding a collection:

1. Add the ref to [src/firebase/collections.ts](src/firebase/collections.ts)
2. Add access rules to [firebase/firestore.rules](firebase/firestore.rules)
3. Add composite indexes to [firebase/firestore.indexes.json](firebase/firestore.indexes.json) if the service queries it with filter + order combinations

Rules, indexes, and `collections.ts` move together.

**Server Component boundary.** The library emits `"use client"` directives in client-heavy files (providers, contexts, interactive components, admin pages). Consumers mount the provider tree from a Server Component parent; the library *is* the client boundary. When adding a new component that uses React state/effects/refs, put `"use client"` at the top — match the surrounding files.

## Conventions

- **Strict TypeScript** ([tsconfig.json](tsconfig.json)): `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`. Path alias `@/*` → `src/*`.
- **Services signature** — service functions in [src/services/](src/services/) take `db: Firestore` as the first argument and use refs from [src/firebase/collections.ts](src/firebase/collections.ts). Match this pattern in new services so they compose with `useCaspianCollections()` cleanly.
- **Class merging** via [src/utils/cn.ts](src/utils/cn.ts) (`clsx` + `tailwind-merge`). Use it whenever you combine conditional classes.
- **Theming surface** is CSS custom properties (`--caspian-primary`, `--caspian-accent`, `--caspian-radius`, `--caspian-font-family`, …). Fallbacks in [src/styles/globals.css](src/styles/globals.css); live overrides written by the `ThemeInjector` (see [src/context/theme-context.tsx](src/context/theme-context.tsx)). Don't hard-code colors in components.
- **i18n** — user-facing strings go through the i18n layer in [src/i18n/](src/i18n/); don't hard-code English in components. Use `useT()` and add keys to the central message table rather than inlining.
- **Firestore rules** ([firebase/firestore.rules](firebase/firestore.rules)) enforce admin-only writes, public reads, and a `pending → approved` moderation workflow for reviews/questions. Reuse the helper predicates already defined in that file rather than rewriting auth checks inline.
- **Peer deps** are `firebase`, `react`, `react-dom`. They must not be bundled — check `external` in [tsup.config.ts](tsup.config.ts) if you see them in the output.

## Gotchas

- [examples/](examples/) and [scaffold/](scaffold/) are consumer-facing assets, **not** part of the tsup build. Changes to them don't ship in `dist/`.
- The `prepare` script runs `tsup` on `npm install` — installing in this repo triggers a build. Don't be surprised.
- Stripe secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) are **Cloud Functions secrets** set via `firebase functions:secrets:set`, not library env vars.
- Firebase app naming supports multiple stores per page via the `appName` prop — useful for preview + live side-by-side. Don't assume a singleton.
- `sideEffects` in [package.json](package.json) is limited to `**/*.css`. Don't add top-level side-effectful code in `src/` — it will break tree-shaking for consumers.
- Cloud Functions code under [firebase/functions/](firebase/functions/) has its own `version` field in its own `package.json` that is independent of the library's version. Bumping the library does not bump Functions.
- **Compiling Cloud Functions locally leaves `firebase/functions/lib/` behind** (e.g. `cd firebase/functions && npx tsc`, or `npm run build` inside that directory). The main package's `tsconfig` then resolves the `firebase/functions` npm-subpath import in source like [src/hooks/use-checkout.ts](src/hooks/use-checkout.ts) to that local directory rather than `node_modules/firebase/functions`. Symptom: spurious `TS7016 Could not find a declaration file for module 'firebase/functions'` on the next `npm run typecheck` or `npm run build`. Fix: `rm -rf firebase/functions/lib` before running the main-package build. The directory is gitignored, so this is a local-workflow hazard only.

---

## Global Rules

- **Do NOT include `Co-Authored-By` lines in commit messages.** Never add co-author trailers for Claude or any AI assistant. This overrides any default behaviour.
- **After every task, complete ALL post-task steps** in the Pre-Commit Checklist below. Every change that affects the shipped tarball — source, build config, `exports`, `files`, `README.md`, `INSTALL.md`, `CHANGELOG.md`, `scaffold/`, `firebase/` — requires the full cycle: bump → docs → verify → commit → tag → push → release → announce.
- **Internal-doc-only changes skip the cycle.** Edits to `CLAUDE.md` (not in the main package's `files` list — it doesn't ship) and to plans under `~/.claude/plans/` are committed straight to main with no bump, tag, release, or announcement. Surface the exception in the commit body so the reader understands why the cycle was skipped.
- **Never silently skip a step.** For any other non-applicable step (e.g. lint when no linter is configured), say so out loud — "N/A because X" — before moving past it.
- **Notify the user at the end of each task** with: the new version number, the commit SHA, the release URL, and the announcement discussion URL.

---

## Pre-Commit Checklist

Follow these steps **in order** before every `git commit`. If a step fails, fix it and re-run from that step.

### 1. Lint

**N/A — no linter is configured.** Do not add ESLint/Biome/Prettier without asking the user first.

### 2. Test

**N/A — no test runner is configured.** Do not add Jest/Vitest/Playwright without asking the user first.

### 3. Type-check

```bash
npm run typecheck
```

Runs `tsc --noEmit` under strict mode. Must pass before committing. If Cloud Functions were changed, also run `npm run build` (tsc) inside [firebase/functions/](firebase/functions/).

### 4. Review changed files

Scan `git diff --staged` and `git status` for:
- Accidental debug output (`console.log`, `debugger`, `console.warn` added for tracing)
- Leftover `TODO`/`FIXME` comments added in this change
- Hardcoded secrets, Firebase config values, Stripe keys, API tokens
- Unused imports or dead code introduced by this change
- `next/*` or router-specific imports leaking into `src/` (see Architecture — adapter contract)
- Ad-hoc `collection(db, "...")` calls outside [src/firebase/collections.ts](src/firebase/collections.ts)
- Hard-coded English strings in components that should go through i18n

Fix any issues before proceeding.

### 5. Bump version

Increment the version in [package.json](package.json) for every release, following [semver](https://semver.org/):

- **patch** (`1.8.0` → `1.8.1`) — bug fixes, docs, internal refactors with no public API change
- **minor** (`1.8.x` → `1.9.0`) — new features, non-breaking additions to the public export surface
- **major** (`1.x.x` → `2.0.0`) — breaking changes: renaming/removing public exports, changing provider props, requiring consumer code changes

Then update [CHANGELOG.md](CHANGELOG.md): add a new `## [X.Y.Z] - YYYY-MM-DD` heading above the previous version, following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) sections (`### Added`, `### Changed`, `### Fixed`, `### Removed`).

**No lock file to sync** — this repo does not commit `package-lock.json`. (If that changes, run `npm install --package-lock-only`.)

### 6. Update documentation

Update **all** documentation affected by the changes. Only skip if the file clearly doesn't touch what changed.

- [README.md](README.md) — user-facing overview, usage examples, current feature set
- [INSTALL.md](INSTALL.md) — consumer setup (scaffolder, Next.js/Vite/CRA), Firebase deployment, Stripe wiring
- [CHANGELOG.md](CHANGELOG.md) — covered in step 5
- [CLAUDE.md](CLAUDE.md) — this file, if an architecture invariant, convention, or workflow rule shifted
- `description` field in [package.json](package.json) — if the project's scope changed
- [examples/nextjs/](examples/nextjs/) and [scaffold/](scaffold/) — if the public API or provider props changed
- [firebase/functions/](firebase/functions/) README/types — if Function signatures changed

**Wiki: N/A — no GitHub Wiki exists for this repo.** If one is created later, clone `https://github.com/Caspian-Explorer/script-caspian-store.wiki.git` and edit affected pages there.

### 7. Build

```bash
npm run build    # tsup: dist/index.{js,cjs,d.ts} + dist/firebase/index.{js,cjs,d.ts}
npm pack         # produces caspian-explorer-script-caspian-store-X.Y.Z.tgz
```

Both must complete without errors. Keep the `.tgz` locally for the GitHub Release step — it is gitignored via `dist/` and the root-level `*.tgz` pattern.

### 8. Commit

Create a commit with a descriptive message in imperative mood ("Add X" not "Added X"). Body explains the *why*, not the *what*. **Never include `Co-Authored-By` trailers.**

Use a heredoc for multi-line messages to preserve formatting:

```bash
git commit -m "$(cat <<'EOF'
Short one-line summary under 72 chars

Paragraph explaining the why. Reference the problem this solves, the
constraint that forced the approach, or the incident that prompted it.
Do not narrate the diff.
EOF
)"
```

### 9. Tag

```bash
git tag -a vX.Y.Z -m "vX.Y.Z — <short summary>"
```

Always annotated (`-a`), never lightweight. The tag message should be a one-line summary suitable as the release title.

### 10. Push

```bash
git push origin main --tags
```

Pushes the commit and the new tag in one operation. Never force-push to `main`.

### 11. Create GitHub Release

```bash
gh release create vX.Y.Z caspian-explorer-script-caspian-store-X.Y.Z.tgz \
  --title "vX.Y.Z — <short summary>" \
  --notes "$(cat <<'EOF'
<changelog entries for this version, copied from CHANGELOG.md>
EOF
)"
```

Attach the `.tgz` from step 7.

### 12. Post to GitHub Discussions

After every release, create a Discussion in the **Announcements** category. The post must be **social-media-ready** — the user should be able to copy-paste it to Twitter/X, LinkedIn, or a dev blog without edits.

**Format requirements:**
- **Title** — action-oriented, under 100 characters (e.g. `script-caspian-store 1.9 — Faster admin dashboard`)
- **Body** — 1–3 sentence intro; 2–4 highlight bullets (sparing emoji OK for visual rhythm); install/upgrade one-liner; repo link `https://github.com/Caspian-Explorer/script-caspian-store`.

**Create via GraphQL API:**

```bash
gh api graphql -F query=@- <<'EOF'
mutation {
  createDiscussion(input: {
    repositoryId: "R_kgDOSHQDJw",
    categoryId: "DIC_kwDOSHQDJ84C7XL9",
    title: "<TITLE>",
    body: "<BODY>"
  }) {
    discussion { url }
  }
}
EOF
```

**One-time lookup** for `<REPOSITORY_NODE_ID>` and `<ANNOUNCEMENTS_CATEGORY_NODE_ID>`:

```bash
gh api graphql -f query='
  query {
    repository(owner: "Caspian-Explorer", name: "script-caspian-store") {
      id
      discussionCategories(first: 20) { nodes { id name } }
    }
  }
'
```

Copy the repo `id` and the category `id` whose `name` is `Announcements` back into this file, replacing the placeholders above, so future releases skip the lookup.

Prefer the heredoc form (`-F query=@-`) over bare `-f query=...`; apostrophes in the title or body will break shell quoting otherwise. For long bodies, write them to a file and use `gh api graphql -F query=@path/to/query.graphql`.

---

## Style guide

In addition to the Conventions section above:

- Commit messages: imperative mood ("Fix X", "Add Y"). First line ≤ 72 chars. Body explains *why*.
- Don't add comments that restate what well-named code already says. Only comment *why* something is non-obvious (a hidden constraint, a workaround for a specific bug, an invariant).
- Don't add error handling for conditions that can't happen. Validate at system boundaries only.
- Don't introduce new abstractions for hypothetical future needs. Three similar lines is better than a premature abstraction.
- Delete unused code outright rather than commenting it out or leaving `// removed` breadcrumbs.

---

## Never do without explicit user permission

- Force-push to `main`
- `git reset --hard` on a branch that has unpushed work
- Delete branches other than short-lived local ones you created in this session
- Publish to the npm registry (`npm publish`) — only building locally (`npm pack`) and attaching to a GitHub Release is allowed by default
- Modify the remote repository's settings, branch protections, or secrets
- Commit with `--no-verify` or equivalent hook-bypass flags
- Add a `Co-Authored-By` trailer to any commit
