import type { User } from 'firebase/auth';

export interface SelfUpdateResult {
  ok: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
  restarting?: boolean;
  /** HTTP status from the endpoint; 0 when the request never reached the server. */
  status: number;
}

/**
 * POST to a companion Next.js API route (default `/api/caspian-store/update`)
 * that runs `npm install github:<owner>/<repo>#v<version>` on the host.
 *
 * The library ships the **client** side; the scaffolder emits the server route.
 * Consumers on non-scaffolded setups (Vite, CRA, custom Next layouts) are
 * expected to mount a compatible POST endpoint at the same path or override
 * via the `endpoint` option.
 *
 * Auth: sends the current Firebase ID token as `Authorization: Bearer …`. The
 * server must verify the token resolves to a user with the `admin` custom
 * claim before shelling out.
 */
export async function triggerSelfUpdate(
  user: User,
  version: string,
  options: { endpoint?: string; signal?: AbortSignal } = {},
): Promise<SelfUpdateResult> {
  const endpoint = options.endpoint ?? '/api/caspian-store/update';
  let idToken: string;
  try {
    idToken = await user.getIdToken();
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to get auth token',
      status: 0,
    };
  }

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ version }),
      signal: options.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err;
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'Network error — is the /api/caspian-store/update route mounted?',
      status: 0,
    };
  }

  let payload: Partial<SelfUpdateResult> = {};
  try {
    payload = (await res.json()) as Partial<SelfUpdateResult>;
  } catch {
    return {
      ok: false,
      error: `Unexpected non-JSON response (HTTP ${res.status})`,
      status: res.status,
    };
  }

  return {
    ok: Boolean(payload.ok) && res.ok,
    stdout: payload.stdout,
    stderr: payload.stderr,
    error: payload.error,
    restarting: payload.restarting,
    status: res.status,
  };
}
