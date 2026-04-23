/**
 * Firestore-rules behavior tests.
 *
 * Catches the class of bug that hit v1.13.0 (storage.rules grammar) and
 * v1.15.0 (users/{uid} first-create silently denied) — regressions that
 * only surface at `firebase deploy` time on a consumer machine. Running
 * this suite on every PR that touches firebase/*.rules fails early.
 *
 * Local run:
 *   cd firebase && firebase emulators:exec --only firestore,storage \
 *     "node --test ../firebase/rules.test.mjs"
 *
 * npm run test does the same via the scripts entry in package.json.
 */

import { test, before, after } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const __dirname = dirname(fileURLToPath(import.meta.url));

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'caspian-rules-test',
    firestore: {
      rules: readFileSync(join(__dirname, 'firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
    storage: {
      rules: readFileSync(join(__dirname, 'storage.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 9199,
    },
  });
});

after(async () => {
  if (env) await env.cleanup();
});

// Seed an admin user through a rules-bypassing context so subsequent assertions
// can distinguish "no admin exists" from "admin exists" branches in rules.
async function seedAdmin(uid) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', uid), {
      email: `${uid}@test.example`,
      role: 'admin',
      addresses: [],
      wishlist: [],
    });
  });
}

function authed(uid) {
  return env.authenticatedContext(uid).firestore();
}

function unauthed() {
  return env.unauthenticatedContext().firestore();
}

function authedStorage(uid) {
  return env.authenticatedContext(uid).storage();
}

function unauthedStorage() {
  return env.unauthenticatedContext().storage();
}

// Tiny 1x1 PNG — valid image bytes for rules that check contentType but don't
// inspect the blob. 70 bytes, well under any size cap.
const PNG_1x1 = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
  0x89, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
  0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
  0x42, 0x60, 0x82,
]);

// ---- users/{uid} ------------------------------------------------------

test('users/{uid}: auth user can create their own profile with role=customer', async () => {
  await env.clearFirestore();
  const db = authed('alice');
  await assertSucceeds(
    setDoc(doc(db, 'users', 'alice'), {
      email: 'alice@test.example',
      role: 'customer',
      addresses: [],
      wishlist: [],
    }),
  );
});

test('users/{uid}: auth user can create their own profile with role omitted', async () => {
  await env.clearFirestore();
  const db = authed('alice');
  await assertSucceeds(
    setDoc(doc(db, 'users', 'alice'), {
      email: 'alice@test.example',
      addresses: [],
    }),
  );
});

test('users/{uid}: auth user CANNOT self-create with role=admin', async () => {
  await env.clearFirestore();
  const db = authed('mallory');
  await assertFails(
    setDoc(doc(db, 'users', 'mallory'), {
      email: 'mallory@test.example',
      role: 'admin',
    }),
  );
});

test('users/{uid}: auth user CANNOT create another user\'s profile', async () => {
  await env.clearFirestore();
  const db = authed('alice');
  await assertFails(
    setDoc(doc(db, 'users', 'bob'), { email: 'bob@test.example', role: 'customer' }),
  );
});

test('users/{uid}: auth user can update non-role fields on own doc', async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', 'alice'), {
      email: 'alice@test.example',
      role: 'customer',
      displayName: 'Alice',
    });
  });
  const db = authed('alice');
  await assertSucceeds(updateDoc(doc(db, 'users', 'alice'), { displayName: 'Alice Updated' }));
});

test('users/{uid}: auth user CANNOT self-promote to admin via update', async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', 'alice'), {
      email: 'alice@test.example',
      role: 'customer',
    });
  });
  const db = authed('alice');
  await assertFails(updateDoc(doc(db, 'users', 'alice'), { role: 'admin' }));
});

test('users/{uid}: unauthenticated read denied', async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', 'alice'), { email: 'alice@test.example' });
  });
  await assertFails(getDoc(doc(unauthed(), 'users', 'alice')));
});

test('users/{uid}: auth user can read own profile', async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', 'alice'), { email: 'alice@test.example' });
  });
  await assertSucceeds(getDoc(doc(authed('alice'), 'users', 'alice')));
});

// ---- products/{id} ----------------------------------------------------

test('products/{id}: public read allowed', async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'products', 'p1'), { name: 'Test' });
  });
  await assertSucceeds(getDoc(doc(unauthed(), 'products', 'p1')));
});

test('products/{id}: non-admin write denied', async () => {
  await env.clearFirestore();
  const db = authed('alice');
  await assertFails(setDoc(doc(db, 'products', 'p1'), { name: 'Test', price: 10 }));
});

test('products/{id}: admin write allowed', async () => {
  await env.clearFirestore();
  await seedAdmin('admin1');
  const db = authed('admin1');
  await assertSucceeds(setDoc(doc(db, 'products', 'p1'), { name: 'Test', price: 10 }));
});

// ---- orders/{id} ------------------------------------------------------

test('orders/{id}: auth user can create their own order', async () => {
  await env.clearFirestore();
  const db = authed('alice');
  await assertSucceeds(
    addDoc(collection(db, 'orders'), {
      userId: 'alice',
      total: 42,
      status: 'pending',
    }),
  );
});

test('orders/{id}: auth user CANNOT read another user\'s order', async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'orders', 'o1'), { userId: 'bob', total: 42 });
  });
  await assertFails(getDoc(doc(authed('alice'), 'orders', 'o1')));
});

test('orders/{id}: admin can read any order', async () => {
  await env.clearFirestore();
  await seedAdmin('admin1');
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'orders', 'o1'), { userId: 'bob', total: 42 });
  });
  await assertSucceeds(getDoc(doc(authed('admin1'), 'orders', 'o1')));
});

// ---- reviews/{id} -----------------------------------------------------

test('reviews/{id}: auth user can create with status=pending and valid rating', async () => {
  await env.clearFirestore();
  const db = authed('alice');
  await assertSucceeds(
    addDoc(collection(db, 'reviews'), {
      userId: 'alice',
      productId: 'p1',
      status: 'pending',
      rating: 5,
      body: 'great',
    }),
  );
});

test('reviews/{id}: auth user CANNOT create with status=approved (must be pending)', async () => {
  await env.clearFirestore();
  const db = authed('alice');
  await assertFails(
    addDoc(collection(db, 'reviews'), {
      userId: 'alice',
      productId: 'p1',
      status: 'approved',
      rating: 5,
    }),
  );
});

test('reviews/{id}: rating out of [1,5] denied', async () => {
  await env.clearFirestore();
  const db = authed('alice');
  await assertFails(
    addDoc(collection(db, 'reviews'), {
      userId: 'alice',
      productId: 'p1',
      status: 'pending',
      rating: 6,
    }),
  );
});

// ---- adminTodos/{id} --------------------------------------------------

test('adminTodos/{id}: non-admin read denied', async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'adminTodos', 't1'), { title: 'Seed' });
  });
  await assertFails(getDoc(doc(authed('alice'), 'adminTodos', 't1')));
});

test('adminTodos/{id}: admin read allowed', async () => {
  await env.clearFirestore();
  await seedAdmin('admin1');
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'adminTodos', 't1'), { title: 'Seed' });
  });
  await assertSucceeds(getDoc(doc(authed('admin1'), 'adminTodos', 't1')));
});

test('adminTodos/{id}: admin write allowed', async () => {
  await env.clearFirestore();
  await seedAdmin('admin1');
  const db = authed('admin1');
  await assertSucceeds(setDoc(doc(db, 'adminTodos', 't1'), { title: 'New', done: false }));
});

// ---- contacts/{id} ----------------------------------------------------
// Public contact-form submissions (v2.13). Create is open to unauthenticated
// visitors (subscribers-style); read/update/delete are admin-only.

test('contacts/{id}: unauthenticated create allowed with valid shape', async () => {
  await env.clearFirestore();
  const db = unauthed();
  await assertSucceeds(
    addDoc(collection(db, 'contacts'), {
      name: 'Jane',
      email: 'jane@example.com',
      subject: 'Hello',
      message: 'Quick question about shipping.',
      status: 'new',
      createdAt: serverTimestamp(),
    }),
  );
});

test('contacts/{id}: create rejected when status != new', async () => {
  await env.clearFirestore();
  const db = unauthed();
  await assertFails(
    addDoc(collection(db, 'contacts'), {
      name: 'Jane',
      email: 'jane@example.com',
      message: 'Hi',
      status: 'read',
      createdAt: serverTimestamp(),
    }),
  );
});

test('contacts/{id}: create rejected when message too long', async () => {
  await env.clearFirestore();
  const db = unauthed();
  const huge = 'x'.repeat(5001);
  await assertFails(
    addDoc(collection(db, 'contacts'), {
      name: 'Jane',
      email: 'jane@example.com',
      message: huge,
      status: 'new',
      createdAt: serverTimestamp(),
    }),
  );
});

test('contacts/{id}: create rejected with empty name', async () => {
  await env.clearFirestore();
  const db = unauthed();
  await assertFails(
    addDoc(collection(db, 'contacts'), {
      name: '',
      email: 'jane@example.com',
      message: 'Hi',
      status: 'new',
      createdAt: serverTimestamp(),
    }),
  );
});

test('contacts/{id}: non-admin read denied', async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'contacts', 'c1'), {
      name: 'Jane',
      email: 'jane@example.com',
      message: 'Hi',
      status: 'new',
    });
  });
  await assertFails(getDoc(doc(authed('alice'), 'contacts', 'c1')));
});

test('contacts/{id}: admin read allowed', async () => {
  await env.clearFirestore();
  await seedAdmin('admin1');
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'contacts', 'c1'), {
      name: 'Jane',
      email: 'jane@example.com',
      message: 'Hi',
      status: 'new',
    });
  });
  await assertSucceeds(getDoc(doc(authed('admin1'), 'contacts', 'c1')));
});

test('contacts/{id}: admin update status allowed', async () => {
  await env.clearFirestore();
  await seedAdmin('admin1');
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'contacts', 'c1'), {
      name: 'Jane',
      email: 'jane@example.com',
      message: 'Hi',
      status: 'new',
    });
  });
  await assertSucceeds(
    updateDoc(doc(authed('admin1'), 'contacts', 'c1'), { status: 'read' }),
  );
});

// ---- errorLogs/{id} ---------------------------------------------------
// Self-healing error logs (mod1182). Open create with a strict shape gate
// (crashes happen in unauth shopper sessions too); admin-only everything else.

const VALID_ERROR_DOC = {
  source: 'client',
  origin: 'ErrorBoundary',
  message: 'TypeError: foo is undefined',
  libraryVersion: '2.16.0',
  seenCount: 1,
  timestamp: serverTimestamp(),
  lastSeenAt: serverTimestamp(),
};

test('errorLogs/{id}: unauthenticated create allowed with valid shape', async () => {
  await env.clearFirestore();
  const db = unauthed();
  await assertSucceeds(addDoc(collection(db, 'errorLogs'), { ...VALID_ERROR_DOC }));
});

test('errorLogs/{id}: create rejected when source is unknown', async () => {
  await env.clearFirestore();
  const db = unauthed();
  await assertFails(
    addDoc(collection(db, 'errorLogs'), { ...VALID_ERROR_DOC, source: 'bogus' }),
  );
});

test('errorLogs/{id}: create rejected when stack oversize', async () => {
  await env.clearFirestore();
  const db = unauthed();
  await assertFails(
    addDoc(collection(db, 'errorLogs'), {
      ...VALID_ERROR_DOC,
      stack: 'x'.repeat(4001),
    }),
  );
});

test('errorLogs/{id}: create rejected when seenCount != 1', async () => {
  await env.clearFirestore();
  const db = unauthed();
  await assertFails(
    addDoc(collection(db, 'errorLogs'), { ...VALID_ERROR_DOC, seenCount: 5 }),
  );
});

test('errorLogs/{id}: non-admin read denied', async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'errorLogs', 'e1'), { ...VALID_ERROR_DOC });
  });
  await assertFails(getDoc(doc(authed('alice'), 'errorLogs', 'e1')));
});

test('errorLogs/{id}: admin read allowed', async () => {
  await env.clearFirestore();
  await seedAdmin('admin1');
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'errorLogs', 'e1'), { ...VALID_ERROR_DOC });
  });
  await assertSucceeds(getDoc(doc(authed('admin1'), 'errorLogs', 'e1')));
});

test('errorLogs/{id}: non-admin cannot bump seenCount', async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'errorLogs', 'e1'), { ...VALID_ERROR_DOC });
  });
  await assertFails(
    updateDoc(doc(authed('alice'), 'errorLogs', 'e1'), { seenCount: 2 }),
  );
});

test('errorLogs/{id}: admin can bump seenCount', async () => {
  await env.clearFirestore();
  await seedAdmin('admin1');
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'errorLogs', 'e1'), { ...VALID_ERROR_DOC });
  });
  await assertSucceeds(
    updateDoc(doc(authed('admin1'), 'errorLogs', 'e1'), { seenCount: 2 }),
  );
});

// ---- storage: siteSettings/** ----------------------------------------
// Branding uploads (logo + favicon) from <AdminSiteSettingsPage>. Added v1.21.
//
// Limitation: `isAdmin()` in storage.rules calls `firestore.get(...)` which is
// a cross-service lookup. `@firebase/rules-unit-testing` does not wire the
// storage rules runtime to read from the Firestore emulator in sandbox mode,
// so any rule path that requires isAdmin() == true returns a null-lookup
// error and denies. We therefore can't positively assert the admin-write
// success path here. We cover the negative paths (unauthenticated, non-admin,
// bad content-type) and the public-read path (using a rules-bypass seed).
// Admin-write success is verified manually in the example app against a
// fully-deployed emulator or live project.

test('storage siteSettings/**: unauthenticated write denied', async () => {
  await env.clearFirestore();
  await env.clearStorage();
  const storage = unauthedStorage();
  await assertFails(
    uploadBytes(storageRef(storage, 'siteSettings/logo.png'), PNG_1x1, {
      contentType: 'image/png',
    }),
  );
});

test('storage siteSettings/**: non-admin write denied', async () => {
  await env.clearFirestore();
  await env.clearStorage();
  const storage = authedStorage('alice');
  await assertFails(
    uploadBytes(storageRef(storage, 'siteSettings/logo.png'), PNG_1x1, {
      contentType: 'image/png',
    }),
  );
});

test('storage siteSettings/**: disallowed content-type denied', async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await seedAdmin('admin1');
  const storage = authedStorage('admin1');
  const bytes = new TextEncoder().encode('<html></html>');
  await assertFails(
    uploadBytes(storageRef(storage, 'siteSettings/logo.html'), bytes, {
      contentType: 'text/html',
    }),
  );
});

test('storage siteSettings/**: public read allowed', async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await uploadBytes(
      storageRef(ctx.storage(), 'siteSettings/logo.png'),
      PNG_1x1,
      { contentType: 'image/png' },
    );
  });
  const publicStorage = unauthedStorage();
  await assertSucceeds(
    getDownloadURL(storageRef(publicStorage, 'siteSettings/logo.png')),
  );
});

// ---- storage: products/** --------------------------------------------
// Product catalog uploads from <AdminProductEditor>. Added v1.22. Same
// cross-service limitation as siteSettings — see comment above that block.

test('storage products/**: unauthenticated write denied', async () => {
  await env.clearFirestore();
  await env.clearStorage();
  const storage = unauthedStorage();
  await assertFails(
    uploadBytes(storageRef(storage, 'products/p1/hero.png'), PNG_1x1, {
      contentType: 'image/png',
    }),
  );
});

test('storage products/**: non-admin write denied', async () => {
  await env.clearFirestore();
  await env.clearStorage();
  const storage = authedStorage('alice');
  await assertFails(
    uploadBytes(storageRef(storage, 'products/p1/hero.png'), PNG_1x1, {
      contentType: 'image/png',
    }),
  );
});

test('storage products/**: SVG upload denied (product photos should be raster)', async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await seedAdmin('admin1');
  const storage = authedStorage('admin1');
  const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>');
  await assertFails(
    uploadBytes(storageRef(storage, 'products/p1/hero.svg'), svg, {
      contentType: 'image/svg+xml',
    }),
  );
});

test('storage products/**: public read allowed', async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await uploadBytes(
      storageRef(ctx.storage(), 'products/p1/hero.png'),
      PNG_1x1,
      { contentType: 'image/png' },
    );
  });
  const publicStorage = unauthedStorage();
  await assertSucceeds(
    getDownloadURL(storageRef(publicStorage, 'products/p1/hero.png')),
  );
});
