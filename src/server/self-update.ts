/**
 * Server-side helper for the consumer's `/api/caspian-store/update` route.
 *
 * Pre-v7.4.0, every scaffolded app got a hand-rolled route.ts that did its
 * own firebase-admin init + admin-token verification + spawn(npm install).
 * That meant every fix to project-ID detection, credential fallback, or
 * npm-spawn quoting required consumers to re-scaffold or hand-edit their
 * route.ts — exactly the friction the v7 single-mount architecture was
 * supposed to eliminate everywhere else.
 *
 * v7.4.0 moves the logic into the library. The scaffold now emits a
 * five-line route.ts that just calls `caspianHandleSelfUpdate(req)`.
 * Future fixes here land via `npm install` — no consumer code changes.
 *
 * This module is server-only (uses `node:child_process`, `firebase-admin`,
 * `process.exit`). Don't import from client/storefront code; tree-shaking
 * won't help if `firebase-admin` ends up in the browser bundle.
 */

import { spawn } from 'node:child_process';

const ALLOWED_OWNER = 'Caspian-Explorer';
const ALLOWED_REPO = 'script-caspian-store';
const VERSION_RE = /^[0-9]+\.[0-9]+\.[0-9]+$/;

export interface CaspianHandleSelfUpdateOptions {
  /**
   * Override the GitHub owner/repo the route is allowed to install from.
   * Defaults to `Caspian-Explorer/script-caspian-store`. Useful for forks
   * that ship their own derivative library — set this and consumers can
   * self-update against your fork rather than the upstream.
   */
  allowedOwner?: string;
  allowedRepo?: string;
  /**
   * Disable the production self-update guard. By default the route refuses
   * POSTs in production unless `CASPIAN_ALLOW_SELF_UPDATE=true`. Set this
   * to `true` if you have a different gating mechanism (e.g. a feature flag).
   */
  disableProductionGuard?: boolean;
}

/**
 * Resolve the Firebase project ID from environment variables, in priority
 * order. firebase-admin's `applicationDefault()` only auto-detects from
 * `GOOGLE_CLOUD_PROJECT` / `GCLOUD_PROJECT`, not from the consumer's
 * `NEXT_PUBLIC_FIREBASE_PROJECT_ID` — so we read both and pass the result
 * explicitly to `initializeApp({ projectId })`.
 */
function resolveProjectId(): string | undefined {
  return (
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.CASPIAN_FIREBASE_PROJECT_ID ||
    undefined
  );
}

async function ensureAdminApp(projectId: string): Promise<void> {
  // Lazy import so this module can be statically analyzed without
  // firebase-admin in the dep tree. Consumers MUST have firebase-admin
  // installed (the scaffold pins it).
  const { getApps, initializeApp, applicationDefault } = await import(
    'firebase-admin/app'
  );
  if (getApps().length > 0) return;
  // Setting GOOGLE_CLOUD_PROJECT here is belt-and-suspenders: some internals
  // of firebase-admin re-read process.env even after init. Idempotent.
  process.env.GOOGLE_CLOUD_PROJECT = projectId;
  try {
    initializeApp({ credential: applicationDefault(), projectId });
  } catch {
    initializeApp({ projectId });
  }
}

interface AuthOk {
  ok: true;
}
interface AuthFail {
  ok: false;
  status: number;
  error: string;
}

async function requireAdmin(req: Request): Promise<AuthOk | AuthFail> {
  const projectId = resolveProjectId();
  if (!projectId) {
    return {
      ok: false,
      status: 500,
      error:
        'Unable to detect a Project Id in the current environment. To learn more about authentication and Google APIs, visit: https://cloud.google.com/docs/authentication/getting-started',
    };
  }
  const authHeader = req.headers.get('authorization') ?? '';
  const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!idToken) {
    return { ok: false, status: 401, error: 'Missing Authorization header' };
  }
  try {
    await ensureAdminApp(projectId);
    const { getAuth } = await import('firebase-admin/auth');
    const decoded = await getAuth().verifyIdToken(idToken);
    if (!(decoded as { admin?: boolean }).admin) {
      return { ok: false, status: 403, error: 'Caller is not an admin' };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      status: 401,
      error: err instanceof Error ? err.message : 'Token verification failed',
    };
  }
}

/**
 * The whole route. Mount from a Next.js App Router route handler:
 *
 * ```ts
 * // src/app/api/caspian-store/update/route.ts
 * import { caspianHandleSelfUpdate } from '@caspian-explorer/script-caspian-store/server';
 * export const runtime = 'nodejs';
 * export const dynamic = 'force-dynamic';
 * export const maxDuration = 300;
 * export async function POST(req: Request) {
 *   return caspianHandleSelfUpdate(req);
 * }
 * ```
 */
export async function caspianHandleSelfUpdate(
  req: Request,
  opts: CaspianHandleSelfUpdateOptions = {},
): Promise<Response> {
  const allowedOwner = opts.allowedOwner ?? ALLOWED_OWNER;
  const allowedRepo = opts.allowedRepo ?? ALLOWED_REPO;

  if (
    !opts.disableProductionGuard &&
    process.env.NODE_ENV === 'production' &&
    process.env.CASPIAN_ALLOW_SELF_UPDATE !== 'true'
  ) {
    return jsonResponse(
      {
        ok: false,
        error:
          'Self-update is disabled in production. Set CASPIAN_ALLOW_SELF_UPDATE=true on the server to enable.',
      },
      403,
    );
  }

  const auth = await requireAdmin(req);
  if (!auth.ok) {
    return jsonResponse({ ok: false, error: auth.error }, auth.status);
  }

  const body = (await req.json().catch(() => null)) as {
    version?: unknown;
  } | null;
  const version = typeof body?.version === 'string' ? body.version : '';
  if (!VERSION_RE.test(version)) {
    return jsonResponse(
      { ok: false, error: 'Invalid version. Expected X.Y.Z.' },
      400,
    );
  }

  const spec = `github:${allowedOwner}/${allowedRepo}#v${version}`;
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  let stdout = '';
  let stderr = '';
  const exitCode: number | null = await new Promise((resolve) => {
    const child = spawn(
      npmCmd,
      ['install', spec, '--no-audit', '--no-fund'],
      {
        cwd: process.cwd(),
        env: process.env,
        shell: false,
      },
    );
    child.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString()));
    child.on('error', (err) => {
      stderr += '\n' + (err instanceof Error ? err.message : String(err));
      resolve(-1);
    });
    child.on('close', (code) => resolve(code));
  });

  if (exitCode !== 0) {
    return jsonResponse(
      {
        ok: false,
        error: `npm install exited with code ${exitCode}`,
        stdout,
        stderr,
      },
      500,
    );
  }

  // Schedule a restart so the new code is picked up. In dev, Next respawns
  // on file change; in production, rely on the host's process supervisor
  // (PM2 / systemd / Docker / Firebase App Hosting / Vercel) to restart
  // when the Node process exits.
  setTimeout(() => {
    try {
      process.exit(0);
    } catch {
      /* no-op */
    }
  }, 500);

  return jsonResponse({ ok: true, stdout, stderr, restarting: true }, 200);
}

function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
