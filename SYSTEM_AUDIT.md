# Redwood PD — System Audit

> Generated for handoff to Claude or other agents. Describes the full system: purpose, architecture, data, APIs, routes, and known gaps. **Read-only audit — not a change log.**

---

## 1. Workspace overview

| Path | Role |
|------|------|
| `/Users/memo/Maestras /` | Workspace root |
| `Redwood_High_PD_IA_Docentes.html` (~2,879 lines) | **Legacy single-file app** — original PD curriculum UI, localStorage progress, export/import JSON |
| `redwood-pd/` | **Production app** — Next.js 16 web app that replaces the HTML version |

The project is a **Professional Development (PD) platform** for Redwood High School teachers learning to use AI in IB classrooms (Monterrey, N.L., México). Content cycle: **2025–2026**.

---

## 2. What the system does (user-facing)

Teachers follow a **3-level curriculum** (Fundamentos → Integración → Transformación):

1. Watch **YouTube videos** and complete **written tasks** with evidence.
2. Progress is **sequential and verified** (not simple checkboxes).
3. Accumulate **verified PD hours** toward diplomas at **20h / 24h / 30h**.
4. Keep a **reflection journal** per session.
5. Read **ethics/policy** content.
6. Use **community chat** and see peer progress (leaderboard-style).
7. **Admins** view cohort stats and export CSV.

**Legacy migration:** Teachers who used the HTML file can export progress JSON and import it into the new app.

---

## 3. Tech stack

| Layer | Technology |
|-------|------------|
| Framework | **Next.js 16.2.6** (App Router) |
| UI | **React 19**, **Tailwind CSS 4**, legacy CSS in `src/app/legacy.css` |
| Auth & DB (prod) | **Supabase** (`@supabase/ssr`, `@supabase/supabase-js`) |
| Local dev fallback | File-based JSON at `.data/local-db.json` |
| Content | Static JSON in `content/` (imported at build time) |
| TypeScript | 5.x |

**Scripts:** `npm run dev` | `build` | `start` | `lint`

**Env vars** (`.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (admin APIs only)

---

## 4. Architecture diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (React client components)                               │
│  Providers → useProgress → fetch /api/*                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│  Next.js App Router                                              │
│  middleware.ts (auth gate if Supabase configured)                │
│  pages: (app)/*  |  login/signup  |  API routes                  │
└───────────────┬─────────────────────────────┬─────────────────────┘
                │                             │
     isLocalMode() = true              isLocalMode() = false
                │                             │
┌───────────────▼──────────────┐  ┌──────────▼──────────────────────┐
│  .data/local-db.json         │  │  Supabase Postgres + Auth       │
│  completions, profiles, chat │  │  profiles, item_completions,    │
│                              │  │  reflections, chat_messages,    │
│                              │  │  progress_items (legacy import) │
└──────────────────────────────┘  └─────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────────────────┐
│  content/*.json (curriculum, hours, sessions, tools, path)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Dual operating modes

### Local mode (default without `.env.local`)

- **Trigger:** missing `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **User ID:** fixed `local-dev-user`
- **Storage:** `.data/local-db.json` (completions, profiles, chat)
- **Auth:** middleware skips redirect; login page sends user straight to `/dashboard`
- **UI badge:** "Modo local" in header

### Supabase mode (production)

- **Auth:** email/password or magic link; callback at `/auth/callback`
- **Middleware:** unauthenticated users redirected to `/login` (except public paths)
- **RLS:** row-level security on all tables; `is_admin()` helper for admin reads

---

## 6. Curriculum & progress model

### Three levels (`content/levels.json`)

| Slug | Name | Color | Sessions |
|------|------|-------|----------|
| `b` | Nivel 1 · Fundamentos | #5B8DD9 | 3 |
| `i` | Nivel 2 · Integración | #2AB09A | 4 |
| `a` | Nivel 3 · Transformación | #E8455A | 3 |

### Level unlock rules (`content/meta.json`)

- **Nivel 2 (`i`):** ≥ **3h** verified in Nivel 1
- **Nivel 3 (`a`):** ≥ **9h** combined in Niveles 1+2 (3h in `b` + enough in `i`)

### Verified learning path (`content/curriculum-path.json`)

- **81 items total:** 37 videos + 44 tasks
- Each item: `itemKey`, `type` (`video` | `task`), `level`, `hours`, `label`, optional `youtubeUrl`
- **Sequential:** must complete previous item before next unlocks
- **Video verification:** ≥ **80%** watch time (`videoWatchThreshold: 0.8`)
- **Task verification:** evidence text ≥ **120** characters (`taskEvidenceMinChars: 120`)

### Completion states (`item_completions` / local DB)

| Status | Meaning |
|--------|---------|
| `locked` | Previous step not verified |
| `available` | Ready to complete |
| `verified` | Completed with timestamp + evidence or watch % |

### Hours & diplomas

| Tier | Hours | Name |
|------|-------|------|
| 1 | 20 | Docente IA Consciente |
| 2 | 24 | Docente IA Innovadora |
| 3 | 30 | Docente IA Transformadora |

- **Goal bar:** 20h minimum diploma; program max ~30h
- Hours summed only from **verified** items on `curriculumPath`

**Core logic files:**

- `src/lib/curriculum-path.ts` — path items, config
- `src/lib/verification.ts` — `buildInitialCompletions`, `verifyVideo`, `verifyTask`, unlock chain
- `src/lib/progress.ts` — hour sums, diploma tier, level unlock helpers
- `src/lib/content.ts` — JSON loaders, checklist/videos/sessions by level
- `src/lib/completions-service.ts` — load/save completions + profile (local vs Supabase)

---

## 7. Content directory (`content/`)

| File | Purpose |
|------|---------|
| `meta.json` | Title, school, hour goals, level locks, verification rules |
| `curriculum-path.json` | Ordered 81-step verified path |
| `checklist.json` | Checklist items + `hours` map |
| `videos.json` | Video metadata by level |
| `levels.json` | Level display config |
| `sessions-b.json`, `sessions-i.json`, `sessions-a.json` | Weekly session plans |
| `tools.json` | AI tool links (dashboard grid) |
| `reflection.json` | Reflection prompts per level |
| `sections-tools.json` | Section/tool references |
| `schema.json` | Content schema reference |

**Regenerate from legacy HTML:**

```bash
node scripts/extract-content.mjs
```

Reads `../Redwood_High_PD_IA_Docentes.html` and writes `content/*.json` + copies logos to `public/assets/`.

---

## 8. Database schema (Supabase)

### Migration `001_schema.sql`

- `profiles` — linked to `auth.users`, fields: email, full_name, subject, start_date, role (`teacher` | `admin`)
- `progress_items` — **legacy** boolean checklist (`user_id`, `item_key`, `checked`)
- `reflections` — journal entries (level 1–3, session date/title, q1–q3, notes)
- `diploma_events` — tier awards (defined; lightly used in app)
- RLS policies + `handle_new_user()` trigger to auto-create profile on signup

### Migration `002_verified_progress.sql`

- `item_completions` — **current** progress model (`status`, `verified_at`, `evidence_text`, `video_watch_pct`)

### Migration `003_chat.sql`

- `chat_messages` — community chat (read all authenticated, insert own, admin delete)

---

## 9. Routes & pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `src/app/page.tsx` | Redirects to `/dashboard` |
| `/dashboard` | `(app)/dashboard/page.tsx` | Welcome, level cards, AI tools grid |
| `/nivel/b`, `/nivel/i`, `/nivel/a` | `(app)/nivel/[slug]/page.tsx` | `LevelWorkspace` — sidebar sections, verified path |
| `/logros` | `(app)/logros/page.tsx` | Diploma tiers + printable `DiplomaModal` |
| `/etica` | `(app)/etica/page.tsx` | Ethics/policy static content |
| `/reflexion` | `(app)/reflexion/page.tsx` | Reflection journal |
| `/comunidad` | `(app)/comunidad/page.tsx` | Chat + teacher leaderboard tabs |
| `/importar` | `(app)/importar/page.tsx` | Import legacy JSON export |
| `/admin` | `(app)/admin/page.tsx` | Cohort table + CSV export link (admin role) |
| `/login` | `login/page.tsx` | Password or magic link; local → dashboard |
| `/signup` | `signup/page.tsx` | Registration |
| `/auth/callback` | `auth/callback/route.ts` | Supabase OAuth/magic-link callback |

**App shell:** `(app)/layout.tsx` wraps children in `Providers` + `AppShell` (header, progress banner, nav tabs).

### Level workspace sections (`LevelWorkspace.tsx`)

Sidebar: Visión General, Plan de Sesiones, Videos, Herramientas, Modalidades Nair, Alineación IB, Aplicaciones por Materia, Lista de Verificación, Habilidades.

Verified path rendered via `VerifiedPathSection` + `VideoPlayer` for videos.

---

## 10. API reference

| Endpoint | Methods | Auth | Purpose |
|----------|---------|------|---------|
| `/api/progress` | GET, PATCH | session | Load/save completions map + profile fields |
| `/api/verify/video` | POST | session | `{ itemKey, watchPct }` → verify video step |
| `/api/verify/task` | POST | session | `{ itemKey, evidenceText }` → verify task step |
| `/api/reflections` | GET, POST, DELETE | Supabase user | Reflection CRUD (no local fallback in API) |
| `/api/import` | POST | Supabase user | Import legacy `pd` + `ref` JSON → `progress_items` + `reflections` |
| `/api/progress/bulk` | POST | session | Bulk progress update |
| `/api/chat/messages` | GET, POST | session | Community chat (local or Supabase) |
| `/api/community/teachers` | GET | session | Leaderboard from `item_completions` (verified hours) |
| `/api/admin/cohort` | GET | admin | Cohort list — uses **legacy** `progress_items` + `sumHours` |
| `/api/admin/export` | GET | admin | CSV export — uses **legacy** `progress_items` |

**Session resolution:** `getSessionUserId()` in `completions-service.ts` — local user or Supabase `auth.getUser()`.

---

## 11. Key React components

| Component | Role |
|-----------|------|
| `Providers` | Context wrapping `useProgress` hook |
| `AppShell` | Header, nav, progress banner, logout |
| `ProgressBanner` | Total hours + % toward diploma |
| `LevelWorkspace` | Level page layout + section switching |
| `VerifiedPathSection` | Sequential video/task UI, calls verify APIs |
| `VideoPlayer` | YouTube embed + watch % tracking |
| `LevelLockBanner` | Shows lock message for levels 2/3 |
| `SessionsSection` | Weekly session plan from JSON |
| `DiplomaModal` | Printable diploma view |

**Client hook:** `useProgress` — fetches `/api/progress`, exposes `completions`, `profile`, `totalHours`, `diplomaTier`, `refreshCompletions`.

---

## 12. Authentication flow

1. User visits protected route.
2. `middleware.ts`: if no Supabase env → pass through (local mode).
3. If Supabase configured → `createServerClient`, `getUser()`; redirect to `/login` if absent.
4. Public paths: `/login`, `/signup`, `/auth/callback`, `/api/*`, static assets.
5. Login: password (`signInWithPassword`) or magic link (`signInWithOtp`).
6. Callback route exchanges code for session cookies.

**Admin:** manually set `profiles.role = 'admin'` in Supabase SQL.

---

## 13. Legacy HTML app

`Redwood_High_PD_IA_Docentes.html` is a self-contained SPA:

- All curriculum UI in one file (~2,879 lines)
- Progress in **localStorage** (`pd` state = checkbox map, `ref` = reflections)
- Export button produces JSON for migration
- Styling: Barlow fonts, Redwood red/navy brand

**Migration path (new app):**

1. Export JSON from legacy HTML
2. `/importar` → POST `/api/import`
3. Import writes to `progress_items` (boolean) and `reflections` — **not** automatically to `item_completions` verified path

---

## 14. Source file map

```
redwood-pd/
├── content/              # Curriculum JSON (static)
├── public/assets/        # Logos from legacy extract
├── scripts/
│   └── extract-content.mjs
├── supabase/migrations/  # 001_schema, 002_verified_progress, 003_chat
├── .data/local-db.json   # Local mode persistence (gitignored)
├── src/
│   ├── middleware.ts
│   ├── app/
│   │   ├── layout.tsx, globals.css, legacy.css
│   │   ├── page.tsx                    # → /dashboard
│   │   ├── login/, signup/
│   │   ├── auth/callback/route.ts
│   │   ├── (app)/                      # Authenticated shell
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/, nivel/[slug]/, logros/, etica/
│   │   │   ├── reflexion/, comunidad/, importar/, admin/
│   │   └── api/                        # See §10
│   ├── components/       # AppShell, LevelWorkspace, VerifiedPathSection, etc.
│   ├── hooks/useProgress.ts
│   └── lib/
│       ├── content.ts, curriculum-path.ts, verification.ts, progress.ts
│       ├── completions-service.ts, local-db.ts
│       └── supabase/{client,server,admin}.ts
├── README.md
├── AGENTS.md             # Next.js 16 agent notes
└── package.json
```

---

## 15. How to run

```bash
cd redwood-pd
cp .env.example .env.local   # optional — add Supabase keys for prod mode
npm install
npm run dev
```

- **Local:** http://localhost:3000/dashboard (no login required)
- **Supabase:** configure project, run migrations 001–003, enable email auth, set admin role

---

## 16. Known gaps & inconsistencies (important for maintainers)

1. **Two progress systems coexist**
   - **New:** `item_completions` with `locked` / `available` / `verified` — used by UI, verify APIs, community leaderboard
   - **Legacy:** `progress_items` with boolean `checked` — used by `/api/import`, **admin cohort**, **admin CSV export**
   - Admin reports may **not match** what teachers see on dashboard if they only use verified path.

2. **Import does not seed verified path**
   - Legacy import populates `progress_items`, not `item_completions`. Teachers may need to re-complete steps or need a migration script.

3. **Reflections API is Supabase-only**
   - `/api/reflections` requires Supabase auth; reflexion page falls back to `localStorage` key `redwood_ref_local` on fetch failure.

4. **Reflections not in local-db**
   - Local mode journal uses browser localStorage, not `.data/local-db.json`.

5. **`diploma_events` table**
   - Defined in schema; app computes tiers client-side from hours — events may not be persisted on unlock.

6. **Admin requires service role**
   - `createAdminClient()` needs `SUPABASE_SERVICE_ROLE_KEY` for cohort/export bypassing RLS.

---

## 17. Dependencies (package.json)

**Runtime:** next@16.2.6, react@19.2.4, @supabase/ssr, @supabase/supabase-js

**Dev:** tailwindcss@4, typescript@5, eslint-config-next

---

## 18. Quick reference for agents

- **Do not assume Next.js 14 patterns** — project uses Next.js 16; see `AGENTS.md`.
- **Content changes:** edit JSON in `content/` or re-run `extract-content.mjs`.
- **Progress logic changes:** start in `verification.ts` and `completions-service.ts`.
- **New API routes:** follow existing pattern in `src/app/api/*/route.ts`.
- **Test locally first** without Supabase; then test with RLS + real users.
- **User language:** Spanish UI throughout.

---

*End of audit.*
