# create-caspian-store

One-command scaffolder for [`@caspian-explorer/script-caspian-store`](https://github.com/Caspian-Explorer/script-caspian-store) — a framework-agnostic React e-commerce storefront + admin panel.

## Usage

```bash
npm create caspian-store@latest my-shop
cd my-shop
npm install
cp .env.example .env.local  # fill in Firebase config
npm run dev                  # http://localhost:3000
```

### Options

All flags are forwarded to the underlying scaffolder:

- `--package-tag vX.Y.Z` — pin the generated project to a specific release (default: latest main)
- `--with-functions` — also scaffold the Stripe Cloud Functions tree into `functions/`
- `--force` — scaffold into a non-empty directory (`.git`, `.gitignore`, `README.md`, `LICENSE` are preserved automatically)

### What gets scaffolded

- Next.js 14 App Router project with every storefront, auth, content, and admin route pre-mounted
- Next.js adapter code (`Link`, `Image`, `useNavigation`) for the package
- Real `firestore.rules`, `firestore.indexes.json`, `storage.rules` deployable via `firebase deploy --only firestore:rules,firestore:indexes,storage`
- `.env.example` with Firebase web config + Stripe publishable key placeholders
- `package.json` scripts for `dev`, `typecheck`, `firebase:seed`, `grant-admin`

## How it works

This package is a thin launcher. It clones the main [`script-caspian-store`](https://github.com/Caspian-Explorer/script-caspian-store) repo into a temporary directory, runs the scaffolder inside it against your target directory, then removes the clone.

Requires `git` on `PATH` and Node ≥ 18.

## Links

- Main repo: https://github.com/Caspian-Explorer/script-caspian-store
- INSTALL guide: https://github.com/Caspian-Explorer/script-caspian-store/blob/main/INSTALL.md
- CHANGELOG: https://github.com/Caspian-Explorer/script-caspian-store/blob/main/CHANGELOG.md

## License

MIT © Caspian-Explorer
