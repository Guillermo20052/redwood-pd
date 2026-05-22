import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/auth-helpers';
import { buildInitialCompletions, sumVerifiedHours } from '@/lib/verification';
import { getEarnedTiers } from '@/lib/diplomas';
import { getExtraTasksForLevel } from '@/lib/extra-tasks';
import {
  countCompletedExtras,
  DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL,
} from '@/lib/extras-gating';
import { curriculumPath, getPartsByLevel } from '@/lib/curriculum-path';
import type { CompletionRow, EvaluationRow } from '@/lib/local-db';
import { Q12_LABEL } from '@/lib/evaluation';
import { SUPABASE_BUCKET } from '@/lib/upload-storage';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

export default async function TeacherDetailPage({ params }: PageProps) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    redirect('/admin');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = await isAdminUser(user.id);
  if (!admin) {
    return <Forbidden />;
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return <ErrorPage message="Admin client no configurado" />;
  }

  const { data: teacher } = await adminClient
    .from('profiles')
    .select('id, email, full_name, subject, role, start_date, created_at')
    .eq('id', id)
    .single();

  if (!teacher || teacher.role !== 'teacher') notFound();

  const { data: rawCompletions } = await adminClient
    .from('item_completions')
    .select('*')
    .eq('user_id', id);

  const { data: reflections } = await adminClient
    .from('reflections')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false });

  const { data: diplomaEvents } = await adminClient
    .from('diploma_events')
    .select('tier, awarded_at, hours_at_award')
    .eq('user_id', id)
    .order('awarded_at', { ascending: true });

  const { data: evaluation } = await adminClient
    .from('evaluations')
    .select('*')
    .eq('user_id', id)
    .maybeSingle();

  // List uploaded files from Storage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let storageFiles: any[] = [];
  try {
    const { data: files } = await adminClient.storage
      .from(SUPABASE_BUCKET)
      .list(id, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    storageFiles = files || [];
  } catch {
    storageFiles = [];
  }

  const completionRows: CompletionRow[] = (rawCompletions || []).map((c) => ({
    item_key: c.item_key,
    status: c.status,
    verified_at: c.verified_at,
    evidence_text: c.evidence_text,
    video_watch_pct: c.video_watch_pct,
    task_score: typeof c.task_score === 'number' ? c.task_score : undefined,
    task_feedback: typeof c.task_feedback === 'string' ? c.task_feedback : undefined,
    partner_user_id: typeof c.partner_user_id === 'string' ? c.partner_user_id : undefined,
    partner_name: typeof c.partner_name === 'string' ? c.partner_name : undefined,
    task_input_type: c.task_input_type,
    task_file_url: typeof c.task_file_url === 'string' ? c.task_file_url : undefined,
  }));

  const completionMap = buildInitialCompletions(completionRows);
  const totalHours = sumVerifiedHours(completionMap);
  const earnedTiers = diplomaEvents && diplomaEvents.length > 0
    ? Array.from(new Set(diplomaEvents.map((d) => d.tier as 1 | 2 | 3))).sort((a, b) => a - b)
    : getEarnedTiers(totalHours, completionMap);

  const verifiedItems = completionRows.filter((r) => r.status === 'verified');
  const partsCompleted = new Set(
    verifiedItems
      .map((r) => {
        const item = curriculumPath.find((p) => p.itemKey === r.item_key);
        return item?.partId;
      })
      .filter((p): p is string => Boolean(p))
  );

  const lastActivity = verifiedItems.reduce<string | null>((acc, r) => {
    if (!r.verified_at) return acc;
    if (!acc || r.verified_at > acc) return r.verified_at;
    return acc;
  }, null);

  const partGroups = [
    ...getPartsByLevel('b'),
    ...getPartsByLevel('i'),
    ...getPartsByLevel('a'),
  ];

  // Generate signed URLs for uploaded files (60-second expiry)
  const signedFiles = await Promise.all(
    storageFiles.map(async (f) => {
      try {
        const { data } = await adminClient.storage
          .from(SUPABASE_BUCKET)
          .createSignedUrl(`${id}/${f.name}`, 60);
        return {
          name: f.name,
          created_at: f.created_at ?? '',
          size: (f.metadata as { size?: number } | undefined)?.size,
          signedUrl: data?.signedUrl ?? null,
        };
      } catch {
        return { name: f.name, created_at: f.created_at ?? '', size: undefined, signedUrl: null };
      }
    })
  );

  const LEVEL_LABELS: Record<string, string> = { b: 'Nivel 1 · Básico', i: 'Nivel 2 · Intermedio', a: 'Nivel 3 · Avanzado' };

  return (
    <div className="space-y-8 pb-16">
      {/* Back + header */}
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm text-[var(--gray-500)] hover:text-[var(--gray-800)] mb-4"
        >
          ← Volver al panel
        </Link>

        <div className="level-hero lh-b">
          <div className="level-hero-tag">Perfil docente</div>
          <h2 className="font-condensed text-3xl font-extrabold">
            {teacher.full_name || teacher.email}
          </h2>
          <p className="text-sm opacity-80">
            {teacher.email}
            {teacher.subject ? ` · ${teacher.subject}` : ''}
            {teacher.start_date ? ` · Inicio: ${new Date(teacher.start_date).toLocaleDateString('es-MX')}` : ''}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Horas verificadas" value={`${totalHours.toFixed(1)}h`} />
        <StatCard label="Partes completadas" value={`${partsCompleted.size} / ${partGroups.length}`} />
        <StatCard
          label="Diplomas obtenidos"
          value={earnedTiers.length > 0 ? earnedTiers.map((t) => `D${t}`).join(' · ') : '—'}
        />
        <StatCard
          label="Última actividad"
          value={lastActivity ? new Date(lastActivity).toLocaleDateString('es-MX') : '—'}
        />
      </div>

      {/* Progress by level */}
      <section>
        <h3 className="font-condensed text-xl font-extrabold mb-4">Progreso por nivel</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(['b', 'i', 'a'] as const).map((level) => {
            const levelParts = partGroups.filter((pg) => pg.items[0]?.level === level);
            return (
              <div
                key={level}
                className="rounded-xl border border-[var(--gray-200)] bg-white p-4 space-y-3"
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--gray-500)]">
                  {LEVEL_LABELS[level]}
                </p>
                {levelParts.map((pg) => {
                  const videoItem = pg.items.find((i) => i.type === 'video');
                  const taskItem = pg.items.find((i) => i.type === 'task');
                  const refItem = pg.items.find((i) => i.type === 'reflection');
                  return (
                    <div key={pg.partId} className="space-y-1">
                      <p className="text-xs font-semibold text-[var(--gray-800)]">
                        {pg.partNumber}. {pg.partTitle}
                      </p>
                      <div className="flex items-center gap-2">
                        {[videoItem, taskItem, refItem].map((item, idx) => {
                          if (!item) return null;
                          const row = completionMap[item.itemKey];
                          const done = row?.status === 'verified';
                          const labels = ['Video', 'Tarea', 'Reflexión'];
                          const dateStr = done && row?.verified_at
                            ? new Date(row.verified_at).toLocaleDateString('es-MX')
                            : null;
                          return (
                            <div key={idx} title={done ? `${labels[idx]}: ${dateStr}` : `${labels[idx]}: pendiente`}>
                              <span
                                className="inline-block w-3 h-3 rounded-full border"
                                style={{
                                  background: done ? 'var(--teal)' : 'white',
                                  borderColor: done ? 'var(--teal)' : 'var(--gray-300)',
                                }}
                              />
                            </div>
                          );
                        })}
                        <span className="text-[10px] text-[var(--gray-500)]">
                          {[videoItem, taskItem, refItem].filter((i) => i && completionMap[i.itemKey]?.status === 'verified').length}/3
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="font-condensed text-xl font-extrabold mb-4">Tareas Extra</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(['b', 'i', 'a'] as const).map((level) => {
            const done = countCompletedExtras(level, completionMap);
            const tasks = getExtraTasksForLevel(level);
            const diplomaNote =
              level !== 'a'
                ? ` · ${done >= DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL ? `${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL}/${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL} hacia Diploma 1 ✓` : `${done}/${DIPLOMA_EXTRAS_REQUIRED_PER_LEVEL} hacia Diploma 1`}`
                : ' · opcionales';
            return (
              <div
                key={level}
                className="rounded-xl border border-[var(--gray-200)] bg-white p-4 space-y-3"
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--gray-500)]">
                  {LEVEL_LABELS[level]}
                </p>
                <p className="text-sm font-semibold text-[var(--navy)]">
                  {done} / 10 completadas
                  <span className="text-xs font-normal text-[var(--gray-500)]">{diplomaNote}</span>
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {tasks.map((t) => {
                    const verified = completionMap[t.id]?.status === 'verified';
                    return (
                      <div
                        key={t.id}
                        title={`#${t.number} ${t.tool}${verified ? ' ✓' : ''}`}
                        className="flex flex-col items-center gap-0.5"
                      >
                        <span
                          className="inline-flex w-7 h-7 items-center justify-center rounded-full text-[10px] font-bold border"
                          style={{
                            background: verified ? 'var(--teal)' : 'white',
                            color: verified ? 'white' : 'var(--gray-500)',
                            borderColor: verified ? 'var(--teal)' : 'var(--gray-300)',
                          }}
                        >
                          {verified ? '✓' : t.number}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Uploaded files */}
      {signedFiles.length > 0 && (
        <section>
          <h3 className="font-condensed text-xl font-extrabold mb-4">
            Archivos subidos ({signedFiles.length})
          </h3>
          <div className="rounded-xl border bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[var(--gray-100)] text-left">
                <tr>
                  <th className="p-3 font-bold">Archivo</th>
                  <th className="p-3 font-bold">Fecha</th>
                  <th className="p-3 font-bold">Tamaño</th>
                  <th className="p-3 font-bold"></th>
                </tr>
              </thead>
              <tbody>
                {signedFiles.map((f) => (
                  <tr key={f.name} className="border-t">
                    <td className="p-3 font-mono text-xs text-[var(--gray-800)]">{f.name}</td>
                    <td className="p-3 text-xs text-[var(--gray-500)]">
                      {f.created_at ? new Date(f.created_at).toLocaleDateString('es-MX') : '—'}
                    </td>
                    <td className="p-3 text-xs text-[var(--gray-500)]">
                      {f.size != null ? `${(f.size / 1024).toFixed(0)} KB` : '—'}
                    </td>
                    <td className="p-3">
                      {f.signedUrl ? (
                        <a
                          href={f.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-[var(--teal)] hover:underline"
                        >
                          Ver
                        </a>
                      ) : (
                        <span className="text-xs text-[var(--gray-400)]">No disponible</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Item-level completions with evidence */}
      {verifiedItems.filter((r) => r.evidence_text || r.task_feedback).length > 0 && (
        <section>
          <h3 className="font-condensed text-xl font-extrabold mb-4">Reflexiones entregadas</h3>
          <div className="space-y-3">
            {verifiedItems
              .filter((r) => r.evidence_text && r.item_key.endsWith('-reflection'))
              .sort((a, b) => (b.verified_at ?? '').localeCompare(a.verified_at ?? ''))
              .map((r) => {
                const item = curriculumPath.find((p) => p.itemKey === r.item_key);
                return (
                  <div
                    key={r.item_key}
                    className="rounded-xl border border-[var(--gray-200)] bg-white p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--gray-800)]">
                        {item?.partTitle ?? r.item_key}
                      </p>
                      <p className="text-xs text-[var(--gray-500)] shrink-0">
                        {r.verified_at ? new Date(r.verified_at).toLocaleDateString('es-MX') : ''}
                      </p>
                    </div>
                    <p className="text-sm text-[var(--gray-700)] whitespace-pre-wrap rounded-lg bg-[var(--gray-50)] p-3 border border-[var(--gray-200)]">
                      {r.evidence_text}
                    </p>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Reflections (from reflections table) */}
      {reflections && reflections.length > 0 && (
        <section>
          <h3 className="font-condensed text-xl font-extrabold mb-4">
            Reflexiones de sesión ({reflections.length})
          </h3>
          <div className="space-y-3">
            {reflections.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-[var(--gray-200)] bg-white p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--gray-800)]">
                    {r.session_title ?? `Nivel ${r.level}`}
                    {r.session_date ? ` · ${new Date(r.session_date).toLocaleDateString('es-MX')}` : ''}
                  </p>
                  <p className="text-xs text-[var(--gray-500)] shrink-0">
                    {new Date(r.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
                {r.q1 && <p className="text-xs text-[var(--gray-600)] whitespace-pre-wrap"><strong>¿Qué aprendiste?</strong><br />{r.q1}</p>}
                {r.q2 && <p className="text-xs text-[var(--gray-600)] whitespace-pre-wrap"><strong>¿Cómo lo aplicarás?</strong><br />{r.q2}</p>}
                {r.q3 && <p className="text-xs text-[var(--gray-600)] whitespace-pre-wrap"><strong>¿Qué preguntas te quedan?</strong><br />{r.q3}</p>}
                {r.notes && <p className="text-xs text-[var(--gray-600)] whitespace-pre-wrap"><strong>Notas:</strong><br />{r.notes}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Evaluation */}
      <section>
        <h3 className="font-condensed text-xl font-extrabold mb-4">Evaluación final</h3>
        {evaluation ? (
          <EvaluationPanel eval={evaluation as EvaluationRow} />
        ) : (
          <p className="rounded-xl border border-[var(--gray-200)] bg-white p-6 text-sm text-[var(--gray-500)]">
            No ha completado la evaluación final aún.
          </p>
        )}
      </section>
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

function EvaluationPanel({ eval: e }: { eval: EvaluationRow }) {
  return (
    <div className="rounded-xl border border-[var(--gray-200)] bg-white p-5 space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Valor del programa (Q1)">{e.q1_value}/5</Field>
        <Field label="AI-ready (Q2)">{e.q2_value}/5</Field>
        <Field label="Continuará usando IA (Q3)">{e.q3_value}/5</Field>
        <Field label="Duración (Q7)">{e.q7_value}/5</Field>
        <Field label="Exigencia (Q8)">{e.q8_value}/5</Field>
        <Field label="Recomendaría (Q12)">{Q12_LABEL[e.q12_value]}</Field>
      </div>
      <TextField label="Lo más útil del Nivel 1 (Q4)">{e.q4_text}</TextField>
      <TextField label="Lo más útil del Nivel 2 (Q5)">{e.q5_text}</TextField>
      {e.q6_text && <TextField label="Nivel 3 (Q6)">{e.q6_text}</TextField>}
      <TextField label="Plan de implementación (Q10)">{e.q10_text}</TextField>
      {e.q11_text && <TextField label="Sugerencias (Q11)">{e.q11_text}</TextField>}
      {e.q9_selections.length > 0 && (
        <TextField label="Partes que funcionaron (Q9)">
          {e.q9_selections.join(', ')}
        </TextField>
      )}
      <p className="text-xs text-[var(--gray-400)]">
        Enviada: {new Date(e.submitted_at).toLocaleDateString('es-MX')}
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--gray-500)]">{label}</p>
      <p className="font-semibold text-[var(--gray-800)]">{children}</p>
    </div>
  );
}

function TextField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--gray-500)]">{label}</p>
      <p className="mt-1 whitespace-pre-wrap rounded-lg border border-[var(--gray-200)] bg-[var(--gray-50)] p-3 text-sm text-[var(--gray-800)]">
        {children}
      </p>
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

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="p-8 text-center text-sm text-[var(--red)]">
      Error: {message}
    </div>
  );
}
