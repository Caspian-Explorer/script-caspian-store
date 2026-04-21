# Seed script

Creates the minimum Firestore documents a fresh Caspian Store needs to render:

- `languages` collection — 5 locales (en/ar/de/es/fr), English set as default
- `settings/site` — brand name, contact placeholders, social links array
- `scriptSettings/site` — theme tokens, feature flags, hero, fonts
- `shippingMethods` — standard + express defaults
- Optional: grants admin role to a Firebase Auth uid via `--admin <uid>`

Idempotent by default — existing docs are left alone. Pass `--force` to overwrite.

## Run it

```bash
# 1. Download a service-account JSON from Firebase console
#    (Project settings → Service accounts → Generate new private key)

# 2. From your consumer project root:
npm install --no-save firebase-admin

node node_modules/@caspian-explorer/script-caspian-store/firebase/seed/seed.mjs \
  --project my-firebase-project-id \
  --credentials ./service-account.json \
  --admin <your-firebase-auth-uid>
```

Or with an env var:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
node node_modules/@caspian-explorer/script-caspian-store/firebase/seed/seed.mjs \
  --project my-firebase-project-id \
  --admin <your-firebase-auth-uid>
```

## Get your Firebase Auth uid

1. Sign up at the consumer site's `/register` page with your real email.
2. In the Firebase console → Authentication → Users, copy the User UID column.
3. Re-run the seed script with `--admin <that-uid>` to promote yourself.

You can also set the role directly in the Firestore console: `users/{uid}.role = 'admin'`.
