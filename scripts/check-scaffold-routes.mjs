#!/usr/bin/env node
/**
 * Scaffolder-vs-nav drift smoke test.
 *
 * What: diffs the `/admin/*` hrefs in `DEFAULT_ADMIN_NAV` ([src/admin/admin-shell.tsx](src/admin/admin-shell.tsx))
 * against the `adminRoutes` array in [scaffold/create.mjs](scaffold/create.mjs). Any nav item without a
 * matching scaffolder route is a 404-on-fresh-scaffold; any scaffolder route
 * without a nav item is dead code.
 *
 * Why: v2.4 shipped with AdminSearchTermsPage missing from the main barrel;
 * v2.11 shipped with AdminEmailsPage missing a scaffolder route. Both are the
 * same class of "add X to one side, forget the other" regression. This script
 * is cheap to run on every PR touching either file.
 *
 * Allowed exceptions: sub-routes (e.g. `appearance/preview`) live under an
 * existing nav item and don't need their own nav entry.
 *
 * Usage:
 *   node scripts/check-scaffold-routes.mjs       # exit 0 on match, 1 on drift
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const SHELL_FILE = join(repoRoot, 'src', 'admin', 'admin-shell.tsx');
const SCAFFOLD_FILE = join(repoRoot, 'scaffold', 'create.mjs');

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

const shellSrc = readFileSync(SHELL_FILE, 'utf8');
const scaffoldSrc = readFileSync(SCAFFOLD_FILE, 'utf8');

const navHrefs = new Set(extractNavHrefs(shellSrc));
const scaffoldRoutes = extractScaffoldRoutes(scaffoldSrc);
const scaffoldPaths = new Set(scaffoldRoutes.map((r) => toAdminPath(r.sub)));

const missingScaffoldRoutes = [...navHrefs].filter((href) => !scaffoldPaths.has(href));
const orphanScaffoldRoutes = [...scaffoldPaths].filter(
  (path) => !navHrefs.has(path) && !SUBROUTE_ALLOWLIST.has(path),
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

if (!ok) {
  process.exit(1);
}

console.log(
  `[check-scaffold-routes] OK — ${navHrefs.size} nav entries, ` +
  `${scaffoldRoutes.length} scaffolder routes, ` +
  `${SUBROUTE_ALLOWLIST.size} allowed sub-route(s).`,
);
