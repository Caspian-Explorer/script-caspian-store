#!/usr/bin/env node
/**
 * Scaffolder-vs-nav-vs-example drift smoke test.
 *
 * What: cross-checks three sources of admin routes:
 *   1. `DEFAULT_ADMIN_NAV` in [src/admin/admin-shell.tsx](src/admin/admin-shell.tsx) — the sidebar links a user can click.
 *   2. `adminRoutes` in [scaffold/create.mjs](scaffold/create.mjs) — what fresh scaffolds get.
 *   3. `app/admin/.../page.tsx` files under [examples/nextjs/](examples/nextjs/) — what `cd examples/nextjs && next dev` actually serves.
 * Any sidebar link without a scaffolder route 404s on fresh scaffolds; any
 * scaffolder route without a nav item is dead code; any scaffolder route
 * without an example route file 404s in `examples/nextjs/`.
 *
 * Why: v2.4 shipped with AdminSearchTermsPage missing from the main barrel;
 * v2.11 shipped with AdminEmailsPage missing a scaffolder route; v3.1 shipped
 * with 9 sidebar links 404ing in the example app (mod1189). All three are the
 * same class of "add X to one side, forget the other" regression. This script
 * is cheap to run on every PR touching admin routing.
 *
 * Allowed exceptions: sub-routes (e.g. `appearance/preview`) live under an
 * existing nav item and don't need their own nav entry.
 *
 * Usage:
 *   node scripts/check-scaffold-routes.mjs       # exit 0 on match, 1 on drift
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const SHELL_FILE = join(repoRoot, 'src', 'admin', 'admin-shell.tsx');
const SCAFFOLD_FILE = join(repoRoot, 'scaffold', 'create.mjs');
const EXAMPLE_ADMIN_DIR = join(repoRoot, 'examples', 'nextjs', 'app', 'admin');

// Sub-routes that nest under a parent nav item — valid scaffolder entries
// without their own nav link. Keep this list tiny and explicit.
const SUBROUTE_ALLOWLIST = new Set([
  '/admin/appearance/preview',
]);

function extractNavHrefs(src) {
  // Match `{ href: '/admin...', label: ... }` entries inside DEFAULT_ADMIN_NAV.
  // We rely on the array being declared as a literal — if that changes, this
  // script will fail loudly and someone will need to update it.
  const navBlockMatch = src.match(
    /export const DEFAULT_ADMIN_NAV[^=]*=\s*\[([\s\S]*?)\];/,
  );
  if (!navBlockMatch) {
    throw new Error(
      'Could not find `DEFAULT_ADMIN_NAV = [ ... ]` literal in admin-shell.tsx. ' +
      'If the shape changed, update scripts/check-scaffold-routes.mjs.',
    );
  }
  const hrefs = [];
  const hrefRegex = /href:\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = hrefRegex.exec(navBlockMatch[1])) !== null) hrefs.push(m[1]);
  return hrefs;
}

function extractScaffoldRoutes(src) {
  // Match `const adminRoutes = [ ... ];` and pull every ['sub', 'Component'] tuple.
  const arrayMatch = src.match(/const adminRoutes\s*=\s*\[([\s\S]*?)\];/);
  if (!arrayMatch) {
    throw new Error(
      'Could not find `const adminRoutes = [ ... ]` literal in scaffold/create.mjs. ' +
      'If the shape changed, update scripts/check-scaffold-routes.mjs.',
    );
  }
  const routes = [];
  const tupleRegex = /\[\s*['"]([^'"]*)['"]\s*,\s*['"]([^'"]+)['"]\s*\]/g;
  let m;
  while ((m = tupleRegex.exec(arrayMatch[1])) !== null) {
    routes.push({ sub: m[1], component: m[2] });
  }
  return routes;
}

function toAdminPath(sub) {
  return sub ? `/admin/${sub}` : '/admin';
}

// Map a scaffolder sub-route to the file path the example app must contain.
// `settings` is special — the scaffolder writes it as a `[[...slug]]` catch-all
// (see scaffold/create.mjs around the AdminSettingsShell write), so the example
// file lives at `settings/[[...slug]]/page.tsx`, not `settings/page.tsx`.
function exampleFileFor(sub) {
  if (sub === 'settings') {
    return join(EXAMPLE_ADMIN_DIR, 'settings', '[[...slug]]', 'page.tsx');
  }
  if (sub === '') {
    return join(EXAMPLE_ADMIN_DIR, 'page.tsx');
  }
  return join(EXAMPLE_ADMIN_DIR, ...sub.split('/'), 'page.tsx');
}

const shellSrc = readFileSync(SHELL_FILE, 'utf8');
const scaffoldSrc = readFileSync(SCAFFOLD_FILE, 'utf8');

const navHrefs = new Set(extractNavHrefs(shellSrc));
const scaffoldRoutes = extractScaffoldRoutes(scaffoldSrc);
const scaffoldPaths = new Set(scaffoldRoutes.map((r) => toAdminPath(r.sub)));

const missingScaffoldRoutes = [...navHrefs].filter((href) => !scaffoldPaths.has(href));
const orphanScaffoldRoutes = [...scaffoldPaths].filter(
  (path) => !navHrefs.has(path) && !SUBROUTE_ALLOWLIST.has(path),
);
const missingExampleRoutes = scaffoldRoutes.filter(
  (r) => !existsSync(exampleFileFor(r.sub)),
);

let ok = true;

if (missingScaffoldRoutes.length > 0) {
  ok = false;
  console.error('\n[check-scaffold-routes] DRIFT — nav entries without scaffolder routes:\n');
  for (const href of missingScaffoldRoutes) {
    console.error(`  ${href}   (in DEFAULT_ADMIN_NAV, missing from adminRoutes)`);
  }
  console.error(
    '\n  Fresh scaffolds will 404 on these hrefs. Add a matching entry to the\n' +
    '  `adminRoutes` array in scaffold/create.mjs:\n\n' +
    '    [\'<subpath>\', \'<ComponentName>\'],\n',
  );
}

if (orphanScaffoldRoutes.length > 0) {
  ok = false;
  console.error('\n[check-scaffold-routes] DRIFT — scaffolder routes without nav entries:\n');
  for (const path of orphanScaffoldRoutes) {
    console.error(`  ${path}   (in adminRoutes, missing from DEFAULT_ADMIN_NAV)`);
  }
  console.error(
    '\n  Either add the matching `{ href, label }` to DEFAULT_ADMIN_NAV in\n' +
    '  src/admin/admin-shell.tsx, or — if the route is a sub-route that nests\n' +
    '  under an existing nav item — add it to SUBROUTE_ALLOWLIST in this script.\n',
  );
}

if (missingExampleRoutes.length > 0) {
  ok = false;
  console.error('\n[check-scaffold-routes] DRIFT — scaffolder routes missing from examples/nextjs:\n');
  for (const r of missingExampleRoutes) {
    console.error(`  ${toAdminPath(r.sub)}   (expected file: ${exampleFileFor(r.sub).replace(repoRoot + '\\', '').replace(repoRoot + '/', '')})`);
  }
  console.error(
    '\n  Visiting these paths under `cd examples/nextjs && npm run dev` will 404.\n' +
    '  Add a 3-line `\'use client\'` page that renders the matching component, e.g.:\n\n' +
    '    \'use client\';\n' +
    '    import { <Component> } from \'@caspian-explorer/script-caspian-store\';\n' +
    '    export default function Page() { return <<Component /> />; }\n',
  );
}

if (!ok) {
  process.exit(1);
}

console.log(
  `[check-scaffold-routes] OK — ${navHrefs.size} nav entries, ` +
  `${scaffoldRoutes.length} scaffolder routes, ` +
  `${scaffoldRoutes.length} example routes, ` +
  `${SUBROUTE_ALLOWLIST.size} allowed sub-route(s).`,
);
