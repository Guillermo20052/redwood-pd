import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'local-db.json');

type LocalDb = {
  completions: Record<string, Record<string, CompletionRow>>;
  profiles: Record<string, ProfileRow>;
  chat: ChatMessage[];
  diploma_events?: DiplomaEvent[];
  /**
   * Unified reflection store (Prompt #4). Optional on disk so older
   * local-db.json files without this key still load; readDb() defaults
   * it to [] on read.
   */
  reflections?: ReflectionRow[];
  /**
   * Final program evaluation, one per user (Prompt #5). Keyed by user_id.
   * Optional on disk so older local-db.json files without this key still load.
   */
  evaluations?: Record<string, EvaluationRow>;
};

export type DiplomaEvent = {
  user_id: string;
  tier: 1 | 2 | 3;
  hours_at_award: number;
  awarded_at: string;
};

/**
 * Mirror of the future Supabase `reflections` table. `id` is a uuid string
 * in local mode (Supabase will use bigserial); the consuming UI compares
 * with `===` so either type works at runtime.
 */
export type ReflectionRow = {
  id: string;
  user_id: string;
  level: number;
  session_date: string | null;
  session_title: string | null;
  q1: string | null;
  q2: string | null;
  q3: string | null;
  notes: string | null;
  created_at: string;
};

export type CompletionRow = {
  item_key: string;
  status: 'locked' | 'available' | 'verified';
  verified_at?: string;
  evidence_text?: string;
  video_watch_pct?: number;
  /** AI grading score (1–100) for the most recent passing task submission. */
  task_score?: number;
  /** AI grading feedback (2–3 sentences) for the most recent passing task submission. */
  task_feedback?: string;
  /** How the teacher submitted this task (text, screenshot, or document). */
  task_input_type?: 'text' | 'screenshot' | 'document';
  /** Public URL path returned by /api/upload for file-based submissions. */
  task_file_url?: string | null;
  /**
   * Collaborative pairing (Prompt #6). Only meaningful for completions of
   * `collaborative: true` task items (b-p4, i-p4, a-p3, a-p5). Both fields
   * are optional so legacy rows load fine.
   */
  partner_user_id?: string;
  partner_name?: string;
};

export type ProfileRow = {
  id: string;
  email: string;
  full_name?: string;
  subject?: string;
  start_date?: string;
  role: 'teacher' | 'admin';
  updated_at?: string;
};

export type ChatMessage = {
  id: number;
  user_id: string;
  body: string;
  created_at: string;
  author_name?: string;
};

export type EvaluationQ12 = 'yes' | 'yes-with-reservations' | 'no';

/**
 * Mirror of the future Supabase `evaluations` table. One row per user.
 * Numeric scales are 1–5; text fields with `_min` requirement are validated
 * by the API route, not at the type level.
 */
export type EvaluationRow = {
  user_id: string;
  q1_value: number;
  q2_value: number;
  q3_value: number;
  q4_text: string;
  q5_text: string;
  q6_text: string | null;
  q7_value: number;
  q8_value: number;
  q9_selections: string[];
  q10_text: string;
  q11_text: string | null;
  q12_value: EvaluationQ12;
  submitted_at: string;
  updated_at: string;
};

/** Payload accepted by upsertEvaluation — everything except server-managed fields. */
export type EvaluationInput = Omit<
  EvaluationRow,
  'user_id' | 'submitted_at' | 'updated_at'
>;

function emptyDb(): LocalDb {
  return {
    completions: {},
    profiles: {},
    chat: [],
    diploma_events: [],
    reflections: [],
    evaluations: {},
  };
}

function readDb(): LocalDb {
  try {
    if (!fs.existsSync(DB_FILE)) return emptyDb();
    const raw = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as LocalDb;
    // Defensive defaults so older local-db.json files (pre-Prompt #4/#5) load.
    if (!raw.completions) raw.completions = {};
    if (!raw.profiles) raw.profiles = {};
    if (!Array.isArray(raw.chat)) raw.chat = [];
    if (!Array.isArray(raw.diploma_events)) raw.diploma_events = [];
    if (!Array.isArray(raw.reflections)) raw.reflections = [];
    if (!raw.evaluations || typeof raw.evaluations !== 'object') raw.evaluations = {};
    return raw;
  } catch {
    return emptyDb();
  }
}

function writeDb(db: LocalDb) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

export function isLocalMode() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

export const localDb = {
  getCompletions(userId: string): CompletionRow[] {
    const db = readDb();
    return Object.values(db.completions[userId] || {});
  },
  setCompletion(userId: string, row: CompletionRow) {
    const db = readDb();
    if (!db.completions[userId]) db.completions[userId] = {};
    db.completions[userId][row.item_key] = row;
    writeDb(db);
  },
  /**
   * Delete every completion row for `userId` whose `item_key` starts with
   * `prefix`. Used by the DEV-only level-reset endpoint.
   */
  deleteCompletionsByPrefix(userId: string, prefix: string): number {
    const db = readDb();
    const userMap = db.completions[userId];
    if (!userMap) return 0;
    let removed = 0;
    for (const key of Object.keys(userMap)) {
      if (key.startsWith(prefix)) {
        delete userMap[key];
        removed++;
      }
    }
    if (removed > 0) writeDb(db);
    return removed;
  },
  getProfile(userId: string): ProfileRow | null {
    const db = readDb();
    return db.profiles[userId] || null;
  },
  upsertProfile(profile: ProfileRow) {
    const db = readDb();
    db.profiles[profile.id] = { ...db.profiles[profile.id], ...profile, updated_at: new Date().toISOString() };
    writeDb(db);
  },
  listProfiles(): ProfileRow[] {
    return Object.values(readDb().profiles);
  },
  getChat(): ChatMessage[] {
    return readDb().chat;
  },
  addChat(msg: Omit<ChatMessage, 'id'>) {
    const db = readDb();
    const id = db.chat.length ? Math.max(...db.chat.map((m) => m.id)) + 1 : 1;
    db.chat.unshift({ ...msg, id });
    writeDb(db);
    return id;
  },
  listDiplomaEvents(userId: string): DiplomaEvent[] {
    const db = readDb();
    return (db.diploma_events ?? []).filter((e) => e.user_id === userId);
  },
  /**
   * Idempotent: if a diploma event for (userId, tier) already exists, this
   * is a no-op. Returns true when a new row was actually written.
   */
  recordDiplomaEvent(userId: string, tier: 1 | 2 | 3, hoursAtAward: number): boolean {
    const db = readDb();
    if (!Array.isArray(db.diploma_events)) db.diploma_events = [];
    const exists = db.diploma_events.some((e) => e.user_id === userId && e.tier === tier);
    if (exists) return false;
    db.diploma_events.push({
      user_id: userId,
      tier,
      hours_at_award: Math.round(hoursAtAward * 10) / 10,
      awarded_at: new Date().toISOString(),
    });
    writeDb(db);
    return true;
  },
  // --- Reflections (Prompt #4) ---
  listReflections(userId: string): ReflectionRow[] {
    const db = readDb();
    return (db.reflections ?? [])
      .filter((r) => r.user_id === userId)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  },
  insertReflection(
    userId: string,
    payload: Omit<ReflectionRow, 'id' | 'user_id' | 'created_at'>
  ): ReflectionRow {
    const db = readDb();
    if (!Array.isArray(db.reflections)) db.reflections = [];
    const row: ReflectionRow = {
      id: newReflectionId(),
      user_id: userId,
      level: payload.level,
      session_date: payload.session_date ?? null,
      session_title: payload.session_title ?? null,
      q1: payload.q1 ?? null,
      q2: payload.q2 ?? null,
      q3: payload.q3 ?? null,
      notes: payload.notes ?? null,
      created_at: new Date().toISOString(),
    };
    db.reflections.unshift(row);
    writeDb(db);
    return row;
  },
  deleteReflection(userId: string, reflectionId: string): boolean {
    const db = readDb();
    if (!Array.isArray(db.reflections)) return false;
    const before = db.reflections.length;
    db.reflections = db.reflections.filter(
      (r) => !(r.user_id === userId && r.id === reflectionId)
    );
    const removed = before !== db.reflections.length;
    if (removed) writeDb(db);
    return removed;
  },
  // --- Evaluations (Prompt #5) ---
  getEvaluation(userId: string): EvaluationRow | null {
    const db = readDb();
    return db.evaluations?.[userId] ?? null;
  },
  /**
   * Insert or update the single evaluation for `userId`. Preserves
   * `submitted_at` on subsequent edits so the timestamp reflects the original
   * submission; `updated_at` is bumped on every call.
   */
  upsertEvaluation(userId: string, payload: EvaluationInput): EvaluationRow {
    const db = readDb();
    if (!db.evaluations || typeof db.evaluations !== 'object') db.evaluations = {};
    const existing = db.evaluations[userId];
    const now = new Date().toISOString();
    const row: EvaluationRow = {
      user_id: userId,
      q1_value: payload.q1_value,
      q2_value: payload.q2_value,
      q3_value: payload.q3_value,
      q4_text: payload.q4_text,
      q5_text: payload.q5_text,
      q6_text: payload.q6_text ?? null,
      q7_value: payload.q7_value,
      q8_value: payload.q8_value,
      q9_selections: [...payload.q9_selections],
      q10_text: payload.q10_text,
      q11_text: payload.q11_text ?? null,
      q12_value: payload.q12_value,
      submitted_at: existing?.submitted_at ?? now,
      updated_at: now,
    };
    db.evaluations[userId] = row;
    writeDb(db);
    return row;
  },
  listEvaluations(): EvaluationRow[] {
    const db = readDb();
    return Object.values(db.evaluations ?? {}).sort((a, b) =>
      a.submitted_at < b.submitted_at ? 1 : -1
    );
  },
};

function newReflectionId(): string {
  // Prefer Web Crypto; fall back to a timestamp+random combo on older runtimes.
  try {
    const g = globalThis as { crypto?: { randomUUID?: () => string } };
    if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `ref-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
