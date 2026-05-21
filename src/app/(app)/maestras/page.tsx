import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/auth-helpers';
import { buildInitialCompletions, sumVerifiedHours } from '@/lib/verification';
import { curriculumPath } from '@/lib/curriculum-path';
import type { CompletionRow } from '@/lib/local-db';
import { isLocalMode, localDb } from '@/lib/local-db';

export const dynamic = 'force-dynamic';

type TeacherStat = {
  user_id: string;
  email: string;
  full_name: string | null;
  subject: string | null;
  totalHours: number;
  partsCompleted: number;
  lastActivity: string | null;
};

export default async function MaestrasPage() {
  // Local mode — no-auth access for dev only; show a placeholder
  if (!isSupabaseConfigured() || isLocalMode()) {
    const teachers = buildLocalTeacherStats();
    return <MaestrasView teachers={teachers} />;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = await isAdminUser(user.id);
  if (!admin) return <Forbidden />;

  const adminClient = createAdminClient();
  if (!adminClient) {
    return <div className="p-8 text-sm text-[var(--red)]">Admin client no configurado.</div>;
  }

  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, email, full_name, subject')
    .eq('role', 'teacher')
    .order('full_name', { ascending: true });

  const { data: allCompletions } = await adminClient
    .from('item_completions')
    .select('user_id, item_key, status, verified_at');

  const teachers: TeacherStat[] = (profiles || []).map((p) => {
    const userRows = ((allCompletions || []).filter((c) => c.user_id === p.id)) as CompletionRow[];
    return buildTeacherStat(p, userRows);
  });

  return <MaestrasView teachers={teachers} />;
}

function buildTeacherStat(
  profile: { id: string; email: string; full_name?: string | null; subject?: string | null },
  rows: CompletionRow[]
): TeacherStat {
  const completionMap = buildInitialCompletions(rows);
  const totalHours = sumVerifiedHours(completionMap);

  const verifiedKeys = new Set(rows.filter((r) => r.status === 'verified').map((r) => r.item_key));
  const completedPartIds = new Set<string>();
  const STAGES_PER_PART = 3;
  const partCounts = new Map<string, number>();
  for (const item of curriculumPath) {
    if (!verifiedKeys.has(item.itemKey)) continue;
    const partId = item.partId ?? item.itemKey;
    partCounts.set(partId, (partCounts.get(partId) ?? 0) + 1);
  }
  for (const [partId, count] of partCounts) {
    if (count >= STAGES_PER_PART) completedPartIds.add(partId);
  }

  const lastActivity = rows.reduce<string | null>((acc, r) => {
    if (!r.verified_at) return acc;
    if (!acc || r.verified_at > acc) return r.verified_at;
    return acc;
  }, null);

  return {
    user_id: profile.id,
    email: profile.email,
    full_name: profile.full_name ?? null,
    subject: profile.subject ?? null,
    totalHours,
    partsCompleted: completedPartIds.size,
    lastActivity,
  };
}

function buildLocalTeacherStats(): TeacherStat[] {
  const profiles = localDb.listProfiles().filter((p) => p.role === 'teacher');
  return profiles.map((p) => {
    const rows = localDb.getCompletions(p.id);
    return buildTeacherStat({ id: p.id, email: p.email, full_name: p.full_name, subject: p.subject }, rows);
  });
}

function formatRelativeDate(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  if (days < 30) return `hace ${Math.floor(days / 7)} sem`;
  return new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function MaestrasView({ teachers }: { teachers: TeacherStat[] }) {
  const totalHours = teachers.reduce((s, t) => s + t.totalHours, 0);
  const avgHours = teachers.length > 0 ? totalHours / teachers.length : 0;
  const withProgress = teachers.filter((t) => t.partsCompleted > 0).length;

  const sorted = [...teachers].sort((a, b) => b.totalHours - a.totalHours);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="level-hero lh-b">
        <div className="level-hero-tag">Coordinación · Liceo Redwood</div>
        <h2 className="font-condensed text-3xl font-extrabold">Maestras del cohorte</h2>
        <p className="opacity-80 text-sm">
          Vista rápida del progreso individual. Haz clic en una maestra para ver su detalle completo.
        </p>
      </div>

      {/* Cohort stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Maestras registradas" value={String(teachers.length)} />
        <StatCard label="Horas totales acumuladas" value={`${totalHours.toFixed(1)}h`} />
        <StatCard label="Promedio por maestra" value={`${avgHours.toFixed(1)}h`} />
        <StatCard label="Con al menos 1 parte" value={String(withProgress)} />
      </div>

      {/* Teacher table */}
      {teachers.length === 0 ? (
        <div className="rounded-xl border border-[var(--gray-200)] bg-white p-10 text-center">
          <p className="text-sm text-[var(--gray-500)]">
            Aún no hay maestras registradas. Comparte el link de registro con ellas.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[var(--gray-200)] bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--gray-100)] text-left">
                <th className="p-3 font-bold font-condensed text-[var(--gray-700)]">Maestra</th>
                <th className="p-3 font-bold font-condensed text-[var(--gray-700)]">Materia</th>
                <th className="p-3 font-bold font-condensed text-[var(--gray-700)]">Horas</th>
                <th className="p-3 font-bold font-condensed text-[var(--gray-700)]">Partes completas</th>
                <th className="p-3 font-bold font-condensed text-[var(--gray-700)]">Última actividad</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((t, idx) => (
                <tr
                  key={t.user_id}
                  className="border-t align-middle"
                  style={{ background: idx % 2 === 0 ? 'white' : '#f9f9f9' }}
                >
                  <td className="p-3">
                    <p className="font-semibold text-[var(--gray-900)]">
                      {t.full_name || '—'}
                    </p>
                    <p className="text-xs text-[var(--gray-500)]">{t.email}</p>
                  </td>
                  <td className="p-3 text-[var(--gray-700)]">{t.subject || '—'}</td>
                  <td className="p-3">
                    <span className="font-bold text-[var(--red)]">{t.totalHours.toFixed(1)}h</span>
                  </td>
                  <td className="p-3">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{
                        background: t.partsCompleted > 0 ? 'var(--green-light)' : 'var(--gray-100)',
                        color: t.partsCompleted > 0 ? 'var(--teal)' : 'var(--gray-500)',
                      }}
                    >
                      {t.partsCompleted} / 15
                    </span>
                  </td>
                  <td className="p-3 text-xs text-[var(--gray-500)]">
                    {formatRelativeDate(t.lastActivity)}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/admin/teacher/${t.user_id}`}
                      className="inline-block rounded-lg border border-[var(--navy)] px-3 py-1 text-xs font-bold text-[var(--navy)] hover:bg-[var(--navy)] hover:text-white transition-colors whitespace-nowrap"
                    >
                      Ver detalle →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--gray-200)] bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--gray-500)] mb-1">
        {label}
      </p>
      <p className="font-condensed text-2xl font-extrabold text-[var(--navy)]">{value}</p>
    </div>
  );
}

function Forbidden() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center bg-white rounded-2xl border p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--red-pale)] text-[var(--red)] text-2xl font-bold">
          403
        </div>
        <h1 className="font-condensed text-2xl font-extrabold mb-2">Sin acceso</h1>
        <p className="text-sm text-[var(--gray-500)] mb-6">
          Esta sección es solo para coordinación.
        </p>
        <Link href="/dashboard" className="btn-primary px-6">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
