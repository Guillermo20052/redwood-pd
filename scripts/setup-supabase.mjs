#!/usr/bin/env node
/**
 * setup-supabase.mjs
 *
 * One-shot helper for taking the Redwood PD app from local-mode to a fresh
 * Supabase project. Does two things:
 *
 *   1. Walks every SQL file in supabase/migrations/ in order and asks the user
 *      to paste each one into the Supabase SQL editor. (The JS client doesn't
 *      expose a "run raw SQL file" API and the Management API requires a
 *      separate personal access token — paste-the-SQL is simpler and works
 *      every time.)
 *
 *   2. Creates the "uploads" Storage bucket via the service-role JS client
 *      (this part IS scriptable). If the bucket already exists the script
 *      reports it and continues.
 *
 * Run from the project root:
 *
 *   node scripts/setup-supabase.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
 * .env.local (the same vars the app uses at runtime).
 */

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.join(ROOT, 'supabase', 'migrations');
const ENV_FILE = path.join(ROOT, '.env.local');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function c(color, text) {
  return `${colors[color] ?? ''}${text}${colors.reset}`;
}

async function loadEnvLocal() {
  if (!existsSync(ENV_FILE)) {
    console.error(c('red', `.env.local not found at ${ENV_FILE}`));
    process.exit(1);
  }
  const raw = await readFile(ENV_FILE, 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function projectRefFromUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname;
    if (!host.endsWith('.supabase.co')) return null;
    return host.split('.')[0] || null;
  } catch {
    return null;
  }
}

function waitForEnter(promptText) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(promptText, () => {
      rl.close();
      resolve();
    });
  });
}

async function listMigrationFiles() {
  const entries = await readdir(MIGRATIONS_DIR);
  return entries
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => path.join(MIGRATIONS_DIR, name));
}

async function walkMigrations(projectRef) {
  const files = await listMigrationFiles();
  if (files.length === 0) {
    console.log(c('yellow', 'No migration files found in supabase/migrations/'));
    return;
  }

  const sqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : 'https://supabase.com/dashboard (open your project → SQL Editor → New query)';

  console.log(c('bold', '\n=== STEP 1: RUN MIGRATIONS ==='));
  console.log(`Open the SQL editor: ${c('cyan', sqlEditorUrl)}`);
  console.log('For each migration below, copy the SQL, paste it into the editor, click RUN,');
  console.log('then return here and press Enter to continue.\n');

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const basename = path.basename(filePath);
    const sql = await readFile(filePath, 'utf8');
    console.log(c('bold', `\n--- Migration ${i + 1}/${files.length}: ${basename} ---`));
    console.log(c('dim', '─'.repeat(72)));
    console.log(sql);
    console.log(c('dim', '─'.repeat(72)));
    await waitForEnter(
      c('yellow', `Paste the SQL above into ${sqlEditorUrl}, RUN it, then press Enter… `)
    );
    console.log(c('green', `✓ ${basename} marked as run`));
  }

  console.log(c('green', '\n✓ All migrations walked.'));
}

async function createUploadsBucket(supabase) {
  console.log(c('bold', '\n=== STEP 2: CREATE STORAGE BUCKET "uploads" ==='));

  const { data: existing, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error(c('red', `Failed to list buckets: ${listErr.message}`));
    return false;
  }

  const found = (existing || []).find((b) => b.name === 'uploads');
  if (found) {
    console.log(c('yellow', '• Bucket "uploads" already exists — skipping create.'));
    return true;
  }

  const { error } = await supabase.storage.createBucket('uploads', {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'],
  });
  if (error) {
    console.error(c('red', `Failed to create bucket: ${error.message}`));
    return false;
  }
  console.log(c('green', '✓ Created bucket "uploads" (10 MB, png/jpg/pdf, private).'));
  return true;
}

async function printStoragePolicies(projectRef) {
  console.log(c('bold', '\n=== STEP 3: APPLY STORAGE RLS POLICIES ==='));

  const policiesPath = path.join(MIGRATIONS_DIR, '008_storage_policies.sql');
  if (!existsSync(policiesPath)) {
    console.log(c('yellow', '(008_storage_policies.sql missing — already printed above if it exists.)'));
    return;
  }
  const sql = await readFile(policiesPath, 'utf8');
  const sqlEditorUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/sql/new`
    : 'your project → SQL Editor → New query';

  console.log('Storage RLS lives in a separate `storage.objects` table that needs');
  console.log('these policies before teachers can upload files. The script already');
  console.log('printed 008_storage_policies.sql in STEP 1 — if you already pasted');
  console.log('and ran it, you can skip this. Otherwise re-paste it now into:');
  console.log(c('cyan', sqlEditorUrl));
  console.log(c('dim', '─'.repeat(72)));
  console.log(sql);
  console.log(c('dim', '─'.repeat(72)));
  await waitForEnter(c('yellow', 'Press Enter when storage policies are applied… '));
  console.log(c('green', '✓ Storage policies confirmed.'));
}

async function main() {
  console.log(c('bold', '\nRedwood PD — Supabase setup\n'));

  const env = await loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      c(
        'red',
        'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
      )
    );
    process.exit(1);
  }

  if (url.endsWith('/rest/v1/') || url.endsWith('/rest/v1')) {
    console.error(
      c(
        'red',
        'NEXT_PUBLIC_SUPABASE_URL should NOT include /rest/v1/. Use the bare project URL, e.g. https://abc.supabase.co'
      )
    );
    process.exit(1);
  }

  const projectRef = projectRefFromUrl(url);
  console.log(`Project URL : ${c('cyan', url)}`);
  console.log(`Project ref : ${c('cyan', projectRef ?? '(unknown)')}`);

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  await walkMigrations(projectRef);
  const bucketOk = await createUploadsBucket(supabase);
  if (!bucketOk) {
    console.log(c('yellow', 'You can re-run this script after fixing the bucket error.'));
  }
  await printStoragePolicies(projectRef);

  console.log(c('green', c('bold', '\n✓ Supabase setup complete.\n')));
  console.log('Next steps:');
  console.log('  1. Confirm Auth → Providers → Email is enabled, "Confirm email" OFF.');
  console.log('  2. Have your first admin sign up at the deployed site (or /signup locally).');
  console.log(
    `  3. Promote them: ${c('cyan', 'node scripts/promote-admin.mjs admin@example.com')}`
  );
  console.log('');
}

main().catch((err) => {
  console.error(c('red', `\nUnexpected error: ${err.message}`));
  console.error(err);
  process.exit(1);
});
