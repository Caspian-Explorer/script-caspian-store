#!/usr/bin/env node
/**
 * deploy-functions.mjs — consumer-side wrapper around `firebase deploy --only functions:<codebase>`.
 *
 * Solves two first-deploy papercuts reported by field-install customers:
 *
 * 1. **Eventarc Service Agent propagation.** On a brand-new Firebase project the
 *    first 2nd-gen deploy frequently fails with "Permission denied while using
 *    the Eventarc Service Agent — Retry the deployment in a few minutes".
 *    The retry always succeeds within 60-120s; we detect the error class and
 *    retry automatically with a visible countdown so customers don't panic.
 *
 * 2. **Artifact Registry cleanup-policy warning.** After a successful deploy,
 *    `firebase deploy` often emits `Error: Functions successfully deployed but
 *    could not set up cleanup policy in location us-central1`. The function
 *    itself deployed fine — this is about container-image retention. We run
 *    `firebase functions:artifacts:setpolicy --force` after a successful deploy
 *    and reframe the output so customers don't see red `Error:` lines.
 *
 * Usage:
 *   node deploy-functions.mjs --codebase <name> [--retries <n>] [--countdown <seconds>]
 *
 * Defaults: --codebase caspian-admin, --retries 2, --countdown 60.
 *
 * Exit code: the exit code of the underlying `firebase deploy` (0 on success,
 * non-zero on final failure). Post-deploy cleanup-policy failures never fail
 * the script — they're informational.
 */

import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import { platform } from 'node:os';

const { values: args } = parseArgs({
  options: {
    codebase: { type: 'string', default: 'caspian-admin' },
    retries: { type: 'string', default: '2' },
    countdown: { type: 'string', default: '60' },
    help: { type: 'boolean', default: false },
  },
});

if (args.help) {
  console.log('Usage: node deploy-functions.mjs [--codebase <name>] [--retries <n>] [--countdown <seconds>]');
  console.log('');
  console.log('Wraps `firebase deploy --only functions:<codebase>` with Eventarc-propagation retry');
  console.log('and post-deploy Artifact Registry cleanup-policy setup.');
  console.log('');
  console.log('Defaults: --codebase caspian-admin, --retries 2, --countdown 60');
  process.exit(0);
}

const codebase = args.codebase;
const maxRetries = Number.parseInt(args.retries, 10);
const countdownSeconds = Number.parseInt(args.countdown, 10);
const isWindows = platform() === 'win32';
const firebaseCmd = isWindows ? 'firebase.cmd' : 'firebase';

const EVENTARC_PATTERNS = [
  /Permission denied while using the Eventarc Service Agent/i,
  /Eventarc.*propagat/i,
  /eventarc.*service.*agent/i,
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function countdown(seconds) {
  for (let i = seconds; i > 0; i--) {
    process.stderr.write(`\r⏳ First-deploy Eventarc propagation detected — retrying in ${i}s…  `);
    await sleep(1000);
  }
  process.stderr.write('\r⏳ Retrying now…                                           \n');
}

function runFirebaseDeploy(codebaseName) {
  return new Promise((resolve) => {
    let stderrBuffer = '';
    const child = spawn(firebaseCmd, ['deploy', '--only', `functions:${codebaseName}`], {
      stdio: ['inherit', 'inherit', 'pipe'],
      shell: isWindows,
    });
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderrBuffer += text;
      process.stderr.write(text);
    });
    child.on('error', (err) => {
      resolve({ code: 1, stderr: String(err) });
    });
    child.on('exit', (code) => {
      resolve({ code: code ?? 1, stderr: stderrBuffer });
    });
  });
}

function isEventarcError(stderr) {
  return EVENTARC_PATTERNS.some((pattern) => pattern.test(stderr));
}

function runSetCleanupPolicy() {
  return new Promise((resolve) => {
    const child = spawn(firebaseCmd, ['functions:artifacts:setpolicy', '--force'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: isWindows,
    });
    child.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      for (const line of lines) process.stdout.write(`[cleanup-policy] ${line}\n`);
    });
    child.stderr.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(Boolean);
      for (const line of lines) process.stdout.write(`[cleanup-policy] ${line}\n`);
    });
    child.on('error', () => resolve(1));
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

async function main() {
  let attempt = 0;
  let lastCode = 1;

  while (attempt <= maxRetries) {
    if (attempt > 0) {
      await countdown(countdownSeconds);
    }
    const { code, stderr } = await runFirebaseDeploy(codebase);
    lastCode = code;

    if (code === 0) break;

    if (isEventarcError(stderr) && attempt < maxRetries) {
      attempt++;
      continue;
    }

    process.exit(code);
  }

  if (lastCode !== 0) process.exit(lastCode);

  console.log('');
  console.log('[cleanup-policy] Setting up Artifact Registry cleanup policy (30-day image retention)…');
  const policyCode = await runSetCleanupPolicy();
  if (policyCode !== 0) {
    console.log('[cleanup-policy] Skipped — not critical. Re-run `firebase functions:artifacts:setpolicy` manually if you want image retention.');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
