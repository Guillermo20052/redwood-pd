#!/usr/bin/env node
/**
 * promote-admin.mjs
 *
 * Usage:
 *   node scripts/promote-admin.mjs <email>
 *
 * Finds the auth.users row for <email> via the Supabase admin API and updates
 * the matching profiles row to role='admin'. If the user has not signed up
 * yet, prints an instruction and exits non-zero.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env.local');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};
const c = (color, text) => `${colors[color] ?? ''}${text}${colors.reset}`;

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

async function findUserByEmail(supabase, email) {
  // listUsers is paginated. We page through up to 50 pages (5,000 users)
  // looking for an email match. Far overkill for this app, but keeps the
  // script honest if the cohort grows.
  const target = email.trim().toLowerCase();
  const perPage = 100;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`auth.admin.listUsers failed: ${error.message}`);
    }
    const users = data?.users ?? [];
    if (users.length === 0) return null;
    const match = users.find((u) => (u.email || '').toLowerCase() === target);
    if (match) return match;
    if (users.length < perPage) return null;
  }
  return null;
}

async function main() {
  const email = process.argv[2];
  if (!email || !email.includes('@')) {
    console.error(
      c('red', 'Usage: node scripts/promote-admin.mjs <email@example.com>')
    );
    process.exit(1);
  }

  const env = await loadEnvLocal();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      c('red', 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`Looking up ${c('cyan', email)}…`);
  const user = await findUserByEmail(supabase, email);
  if (!user) {
    console.error(
      c(
        'yellow',
        `\nUser not found in auth.users.\n` +
          `Have them sign up at the deployed site first, then re-run:\n` +
          `  node scripts/promote-admin.mjs ${email}\n`
      )
    );
    process.exit(2);
  }

  console.log(`Found user ${c('cyan', user.id)}`);

  // The trigger from migration 007 may already have inserted the profile, but
  // we upsert defensively in case the trigger wasn't installed on the auth
  // schema (e.g. an older project that hadn't run 007 yet).
  const { error: upsertErr } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email ?? '',
        full_name:
          user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? '',
        subject:
          user.user_metadata?.subject ?? user.user_metadata?.subject_area ?? '',
        role: 'admin',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (upsertErr) {
    console.error(c('red', `Failed to upsert profile: ${upsertErr.message}`));
    process.exit(1);
  }

  console.log(c('green', c('bold', `\n✓ ${email} is now an admin.`)));
  console.log(`They can now access ${c('cyan', '/admin')} after signing in.\n`);
}

main().catch((err) => {
  console.error(c('red', `\nUnexpected error: ${err.message}`));
  console.error(err);
  process.exit(1);
});
