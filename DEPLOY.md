# Redwood PD — Deploy Guide

End-to-end checklist for taking the app from local-mode to production on
Vercel + Supabase. Total time: ~30 minutes from clone to live URL.

## Prerequisites (one-time)

1. A Supabase project (already created)
2. The four env vars set in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` (bare project URL, no `/rest/v1/` suffix)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
3. Node 20+ installed locally

> If `NEXT_PUBLIC_SUPABASE_URL` ends in `/rest/v1/`, remove it. The Supabase JS
> client wants just `https://<ref>.supabase.co`.

---

## Step 1 — Disable email confirmation in Supabase

Supabase Dashboard → **Authentication → Providers → Email**

- Enable email provider: **ON**
- "Confirm email": **OFF**

With confirmation off, `supabase.auth.signUp()` returns an active session
immediately and the user lands on `/dashboard` without checking their inbox.

---

## Step 2 — Run database migrations + create storage bucket

From the repo root:

```bash
node scripts/setup-supabase.mjs
```

The script walks every `supabase/migrations/*.sql` file in order. For each one
it prints the SQL and asks you to paste it into Supabase's SQL Editor and run
it, then press Enter to advance. It also creates the `uploads` Storage bucket
via the JS admin API.

Migrations applied (in order):

1. `001_schema.sql` — profiles, progress_items, reflections, diploma_events, RLS, signup trigger
2. `002_verified_progress.sql` — item_completions
3. `003_chat.sql` — chat_messages
4. `004_unified_progress.sql` — task_score/task_feedback columns, diploma uniqueness
5. `005_evaluations.sql` — final program evaluation
6. `006_collaborative.sql` — partner_user_id, partner_name on item_completions
7. `007_auto_profile.sql` — replaces signup trigger, adds task_input_type / task_file_url columns
8. `008_storage_policies.sql` — RLS on storage.objects for the uploads bucket

Don't skip any. They are all idempotent — re-running them on a fresh project is safe.

---

## Step 3 — Push to GitHub

```bash
git init                                   # only if not already a repo
git add .
git commit -m "Initial deploy"
git remote add origin https://github.com/YOUR_USERNAME/redwood-pd.git
git push -u origin main
```

> Make sure `.env.local` is in `.gitignore` (it already is) so you don't leak keys.

---

## Step 4 — Deploy to Vercel (~3 min)

1. Go to <https://vercel.com> → **New Project** → Import from GitHub
2. Pick the `redwood-pd` repo
3. **Framework preset**: Next.js (auto-detected)
4. Click **Environment Variables** and add all four:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`

   Copy the values from `.env.local`. Apply to **Production**, **Preview**, and **Development**.
5. Click **Deploy**. Wait ~3 min.
6. You get a URL like `https://redwood-pd-xxxx.vercel.app`.

---

## Step 5 — Seed the first admin

1. Open the deployed URL and sign up with your admin email (e.g. your mom's email).
2. Locally, promote that user:

   ```bash
   node scripts/promote-admin.mjs mom@example.com
   ```

3. Have her sign back in. `/admin` is now accessible.

> Teachers who don't have `role='admin'` will see a 403 page if they try
> to visit `/admin`.

---

## Step 6 — Smoke test

Visit the deployed URL and confirm:

- [ ] `/` redirects to `/login` when signed out
- [ ] `/signup` creates a new user, lands on `/dashboard`
- [ ] In Supabase Dashboard → **Table editor → profiles**, the new row exists with `role='teacher'`
- [ ] A teacher account hitting `/admin` sees the 403 page
- [ ] After `promote-admin.mjs`, the admin account sees the coordination panel
- [ ] Uploading a screenshot in a task submission succeeds (check **Storage → uploads** in Supabase)
- [ ] AI grading completes on text + image submissions

---

## Custom domain (optional)

Vercel → project → **Settings → Domains → Add**. Point the DNS record at
Vercel as instructed. Domain propagates in minutes.

After adding the domain, also add it to Supabase **Authentication → URL
Configuration → Site URL** so password-reset and OAuth redirects go to the
right place.

---

## Troubleshooting

| Symptom                                              | Fix                                                                                                            |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Signup fails with "Email not confirmed"              | Supabase Auth → Providers → Email → disable "Confirm email".                                                   |
| `/login` keeps redirecting                           | Browser still has stale cookies. Clear cookies for the domain.                                                 |
| "No se encontró el bucket uploads"                   | Re-run `node scripts/setup-supabase.mjs`; the bucket-create step is idempotent.                                |
| Upload returns 500                                   | Supabase 008_storage_policies.sql wasn't run, or `SUPABASE_SERVICE_ROLE_KEY` is missing on Vercel.             |
| Admin page shows 403 for an admin account            | Run `node scripts/promote-admin.mjs <email>` and have them sign in again so the session picks up the new role. |
| File preview / signed URL 404                        | Bucket exists but the file isn't there. Check Storage → uploads in the dashboard.                              |
| `getUser()` returns null in production               | `SUPABASE_URL` may have a trailing `/rest/v1/`. Use bare project URL.                                          |
| Migration says "column already exists"               | Safe to ignore — migrations are idempotent. Continue to next migration.                                        |

---

## Reverting to local mode (for dev)

Unset (or comment out) `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`. The app falls back to
`.data/local-db.json` for state and `.data/uploads/` for files. No auth gate
is applied.

---

## Architecture quick-ref

- **Auth**: Supabase Auth, email+password only. Confirmation disabled.
- **DB**: Postgres tables (profiles, item_completions, reflections, diploma_events, evaluations, chat_messages) with RLS — owners read/write own rows; admins read all.
- **Files**: Supabase Storage bucket `uploads`, path convention `<userId>/<timestamp>-<filename>`, RLS on storage.objects.
- **AI grading**: Anthropic Claude Sonnet 4.5 via `@anthropic-ai/sdk`. The server downloads the file from Storage (service-role) and sends it inline as base64.
- **Local fallback**: When env vars are absent the same code paths use a JSON file + local disk, so dev still works offline.
