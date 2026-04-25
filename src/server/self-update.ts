/**
 * Server-side helper for the consumer's `/api/caspian-store/update` route.
 *
 * Pre-v7.4.0, every scaffolded app got a hand-rolled route.ts that did its
 * own firebase-admin init + admin-token verification + spawn(npm install).
 * That meant every fix to project-ID detection, credential fallback, or
 * npm-spawn quoting required consumers to re-scaffold or hand-edit their
 * route.ts — exactly the friction the v7 single-mount architecture was
 * supposed to eliminate everywhere else. v7.4.0 moves the logic into the
 * library; v8.0.0 hardens it.
 *
 * Threat model: this endpoint is, by design, an arbitrary-code-execution
 * path — it shells out to `npm install <github-tarball>`. We mitigate with
 * five layers (any of which is a hard refusal):
 *   1. `CASPIAN_ALLOW_SELF_UPDATE=true` env var must be set. Opt-in in *all*
 *      environments, not just production. Stops accidental enablement.
 *   2. Caller must present a valid Firebase Auth ID token with the `admin`
 *      custom claim. Tokens are short-lived (1h) and rotated.
 *   3. The `version` field is restricted to `X.Y.Z` (no slashes, no
 *      protocol injection, no `..`).
 *   4. The GitHub owner/repo allowlist is regex-validated; the default
 *      points at `Caspian-Explorer/script-caspian-store`. Forks may
 *      override but cannot inject special characters.
 *   5. npm runs with `--ignore-scripts` so a compromised tarball cannot
 *      run a postinstall hook. We also rate-limit to 1 install per
 *      10 minutes per process.
 *
 * Stderr returned to the caller is redacted of patterns that look like
 * environment-variable references, since npm errors sometimes include
 * tokens like `$GITHUB_TOKEN` in the message.
 *
 * This module is server-only (uses `node:child_process`, `firebase-admin`,
 * `process.exit`). Don't import from client/storefront code.
 */

import { spawn } from 'node:child_process';

const ALLOWED_OWNER = 'Caspian-Explorer';
const ALLOWED_REPO = 'script-caspian-store';
const VERSION_RE = /^[0-9]+\.[0-9]+\.[0-9]+$/;
// GitHub's documented owner/repo character class — alphanumerics, dot,
// hyphen, underscore. We use this to validate consumer-provided overrides
// so a fork can self-update against its own GitHub repo without opening a
// shell-injection or path-traversal hole.
const GITHUB_NAME_RE = /^[A-Za-z0-9._-]{1,100}$/;

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
let lastInvocationAt = 0;

export interface CaspianHandleSelfUpdateOptions {
  /**
   * Override the GitHub owner/repo the route is allowed to install from.
   * Defaults to `Caspian-Explorer/script-caspian-store`. Useful for forks
   * that ship their own derivative library — set this and consumers can
   * self-update against your fork rather than upstream. Both fields must
   * match `[A-Za-z0-9._-]{1,100}` or the request is rejected with a 400.
   */
  allowedOwner?: string;
  allowedRepo?: string;
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
 * Redact patterns that look like env-var references from a captured stream
 * before returning it in an HTTP response. Examples redacted: `$FOO`,
 * `${BAR}`, `$BAZ_QUX`. npm errors occasionally echo unset tokens; this
 * stops the route from acting as an env-var oracle.
 */
function redactEnvRefs(s: string): string {
  return s.replace(/\$\{?[A-Z_][A-Z0-9_]*\}?/g, '[REDACTED_ENV_REF]');
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
 *
 * Requires `CASPIAN_ALLOW_SELF_UPDATE=true` on the server — opt-in in all
 * environments, not just production. Without it, every POST is a 403.
 */
export async function caspianHandleSelfUpdate(
  req: Request,
  opts: CaspianHandleSelfUpdateOptions = {},
): Promise<Response> {
  if (process.env.CASPIAN_ALLOW_SELF_UPDATE !== 'true') {
    return jsonResponse(
      {
        ok: false,
        error:
          'Self-update is disabled. Set CASPIAN_ALLOW_SELF_UPDATE=true on the server to enable.',
      },
      403,
    );
  }

  // Per-process rate limit: at most one install per 10 minutes. Serverless
  // platforms (Vercel, Firebase App Hosting) may run multiple warm instances
  // concurrently — each gets its own counter. That's acceptable for an
  // admin operation; the alternative (Firestore-backed counter) adds
  // round-trip latency to every request and a new failure mode if Firestore
  // is unavailable.
  const now = Date.now();
  if (now - lastInvocationAt < RATE_LIMIT_WINDOW_MS) {
    const retryInSec = Math.ceil(
      (RATE_LIMIT_WINDOW_MS - (now - lastInvocationAt)) / 1000,
    );
    return jsonResponse(
      {
        ok: false,
        error: `Self-update rate limited. Try again in ${retryInSec}s.`,
      },
      429,
    );
  }

  const allowedOwner = opts.allowedOwner ?? ALLOWED_OWNER;
  const allowedRepo = opts.allowedRepo ?? ALLOWED_REPO;
  if (!GITHUB_NAME_RE.test(allowedOwner) || !GITHUB_NAME_RE.test(allowedRepo)) {
    return jsonResponse(
      {
        ok: false,
        error:
          'Invalid allowedOwner/allowedRepo override — must match GitHub naming rules.',
      },
      400,
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

  // Claim the rate-limit slot before spawning npm. If the install crashes
  // we still want to block another caller from immediately retrying.
  lastInvocationAt = now;

  const spec = `github:${allowedOwner}/${allowedRepo}#v${version}`;
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  let stdout = '';
  let stderr = '';
  const exitCode: number | null = await new Promise((resolve) => {
    // `--ignore-scripts` blocks any pre/post/install scripts in the fetched
    // tarball or its transitive deps from running. Without it, a
    // compromised dep could execute arbitrary code under the server's
    // process identity. Our own package has no install scripts that need
    // to run on consumer sites, so this is safe.
    const child = spawn(
      npmCmd,
      ['install', spec, '--ignore-scripts', '--no-audit', '--no-fund'],
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
        stdout: redactEnvRefs(stdout),
        stderr: redactEnvRefs(stderr),
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

  return jsonResponse(
    {
      ok: true,
      stdout: redactEnvRefs(stdout),
      stderr: redactEnvRefs(stderr),
      restarting: true,
    },
    200,
  );
}

function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
