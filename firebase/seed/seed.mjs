#!/usr/bin/env node
/**
 * Firestore seed script for @caspian-explorer/script-caspian-store.
 *
 * Seeds the minimum set of documents needed for a fresh store to render:
 *   - `languages` collection: en, ar, de, es, fr (en = default)
 *   - `settings/site`         brand / contact / social scaffolding
 *   - `scriptSettings/site`   theme + features + hero + fonts
 *   - `shippingMethods` collection: standard + express defaults
 *   - Optional: grants `users/{uid}.role = 'admin'` to a uid passed via --admin
 *
 * Idempotent — existing docs are left alone unless --force is passed.
 *
 * Usage:
 *   node firebase/seed/seed.mjs \
 *     --project my-firebase-project-id \
 *     --credentials ./service-account.json \
 *     --admin <firebase-auth-uid>        # optional
 *     --force                            # optional; overwrite existing docs
 *
 * Alternatively set GOOGLE_APPLICATION_CREDENTIALS to the service account path.
 */

import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
  options: {
    project: { type: 'string' },
    credentials: { type: 'string' },
    admin: { type: 'string' },
    force: { type: 'boolean', default: false },
  },
});

let admin;
try {
  admin = await import('firebase-admin');
} catch {
  console.error(
    '[seed] firebase-admin is not installed. Run `npm install --no-save firebase-admin` and re-run.',
  );
  process.exit(1);
}

const credentialsPath = args.credentials ?? process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (credentialsPath) {
  const serviceAccount = JSON.parse(readFileSync(credentialsPath, 'utf8'));
  admin.default.initializeApp({
    credential: admin.default.credential.cert(serviceAccount),
    projectId: args.project ?? serviceAccount.project_id,
  });
} else {
  admin.default.initializeApp({ projectId: args.project });
}

const db = admin.default.firestore();

const LANGUAGES = [
  { code: 'en', name: 'English',  nativeName: 'English',  flag: '🇬🇧', direction: 'ltr', isDefault: true,  isActive: true,  order: 0 },
  { code: 'ar', name: 'Arabic',   nativeName: 'العربية',  flag: '🇸🇦', direction: 'rtl', isDefault: false, isActive: false, order: 1 },
  { code: 'de', name: 'German',   nativeName: 'Deutsch',  flag: '🇩🇪', direction: 'ltr', isDefault: false, isActive: false, order: 2 },
  { code: 'es', name: 'Spanish',  nativeName: 'Español',  flag: '🇪🇸', direction: 'ltr', isDefault: false, isActive: false, order: 3 },
  { code: 'fr', name: 'French',   nativeName: 'Français', flag: '🇫🇷', direction: 'ltr', isDefault: false, isActive: false, order: 4 },
];

const SITE_SETTINGS = {
  logoUrl: '',
  faviconUrl: '',
  brandName: 'STORE',
  brandDescription: 'A modern e-commerce experience powered by Caspian Store.',
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  businessHours: '',
  socialLinks: [],
};

const SCRIPT_SETTINGS = {
  brandName: 'STORE',
  currency: 'USD',
  currencySymbol: '$',
  primaryColor: '#111111',
  primaryForeground: '#ffffff',
  accentColor: '#ec4899',
  radius: 6,
  features: {
    reviews: true,
    questions: true,
    wishlist: true,
    newsletter: true,
    promoCodes: true,
  },
  hero: {
    title: 'New season, new stories',
    subtitle: 'Explore the latest arrivals.',
    ctaLabel: 'Shop now',
    ctaHref: '/',
    imageUrl: '',
  },
  fonts: {
    body: 'Lato',
    headline: 'Montserrat',
  },
};

const SHIPPING_METHODS = [
  {
    slug: 'standard',
    name: 'Standard shipping',
    price: 5,
    estimatedDays: { min: 3, max: 7 },
    isActive: true,
    order: 0,
  },
  {
    slug: 'express',
    name: 'Express shipping',
    price: 15,
    estimatedDays: { min: 1, max: 2 },
    isActive: true,
    order: 1,
  },
];

async function seedLanguages() {
  const existing = await db.collection('languages').get();
  const have = new Set(existing.docs.map((d) => d.data().code));
  let written = 0;
  const now = admin.default.firestore.Timestamp.now();
  for (const lang of LANGUAGES) {
    if (have.has(lang.code) && !args.force) continue;
    const id = lang.code;
    await db.collection('languages').doc(id).set({ ...lang, updatedAt: now });
    written++;
  }
  console.log(`[seed] languages: wrote ${written}, skipped ${LANGUAGES.length - written}`);
}

async function seedSiteSettings() {
  const ref = db.doc('settings/site');
  const snap = await ref.get();
  if (snap.exists && !args.force) {
    console.log('[seed] settings/site: already exists, skipped');
    return;
  }
  await ref.set(SITE_SETTINGS);
  console.log('[seed] settings/site: written');
}

async function seedScriptSettings() {
  const ref = db.doc('scriptSettings/site');
  const snap = await ref.get();
  if (snap.exists && !args.force) {
    console.log('[seed] scriptSettings/site: already exists, skipped');
    return;
  }
  await ref.set(SCRIPT_SETTINGS);
  console.log('[seed] scriptSettings/site: written');
}

async function seedShippingMethods() {
  const existing = await db.collection('shippingMethods').get();
  const have = new Set(existing.docs.map((d) => d.data().slug));
  let written = 0;
  const now = admin.default.firestore.Timestamp.now();
  for (const method of SHIPPING_METHODS) {
    if (have.has(method.slug) && !args.force) continue;
    await db.collection('shippingMethods').add({ ...method, createdAt: now });
    written++;
  }
  console.log(`[seed] shippingMethods: wrote ${written}, skipped ${SHIPPING_METHODS.length - written}`);
}

async function grantAdmin(uid) {
  const ref = db.doc(`users/${uid}`);
  const snap = await ref.get();
  if (snap.exists) {
    await ref.update({ role: 'admin' });
    console.log(`[seed] users/${uid}: role set to admin (updated)`);
  } else {
    await ref.set({ role: 'admin', createdAt: admin.default.firestore.Timestamp.now() });
    console.log(`[seed] users/${uid}: role set to admin (created stub)`);
  }
}

try {
  await seedLanguages();
  await seedSiteSettings();
  await seedScriptSettings();
  await seedShippingMethods();
  if (args.admin) await grantAdmin(args.admin);
  console.log('[seed] done.');
  process.exit(0);
} catch (error) {
  console.error('[seed] failed:', error);
  process.exit(1);
}
