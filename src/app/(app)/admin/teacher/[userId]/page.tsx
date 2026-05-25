'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { DiplomaModal } from '@/components/DiplomaModal';
import type { AdminTeacherDetailResponse } from '@/app/api/admin/teacher/[userId]/route';
import { getCollaborativeTask, isCollabItemKey } from '@/lib/collaborative-tasks';
import { curriculumPath, getPathItem } from '@/lib/curriculum-path';
import { DIPLOMAS, isDiplomaTierEarned, type DiplomaTier } from '@/lib/diplomas';
import {
  getDiploma3MissingReason,
  type Diploma3ProgramRequirements,
} from '@/lib/diploma3-requirements';
import { Q12_LABEL } from '@/lib/evaluation';
import { getExtraTask, isExtraItemKey } from '@/lib/extra-tasks';
import { getDiploma1Progress } from '@/lib/extras-gating';
import type { EvaluationRow, ReflectionRow } from '@/lib/local-db';
import { buildInitialCompletions, type CompletionMap } from '@/lib/verification';
import { parseTaskFileUrls } from '@/lib/task-file-urls';

const LEVEL_NUM: Record<string, number> = { b: 1, i: 2, a: 3 };
const LEVEL_LABELS: Record<string, string> = {
  b: 'Nivel 1 · Básico',
  i: 'Nivel 2 · Intermedio',
  a: 'Nivel 3 · Avanzado',
};
const DIPLOMA_NAMES: Record<DiplomaTier, string> = {
  1: 'Bronce',
  2: 'Plata',
  3: 'Oro',
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function reflectionFullText(r: ReflectionRow): string {
  const parts: string[] = [];
  if (r.q1?.trim()) parts.push(r.q1.trim());
  if (r.q2?.trim()) parts.push(r.q2.trim());
  if (r.q3?.trim()) parts.push(r.q3.trim());
  if (r.notes?.trim()) parts.push(r.notes.trim());
  return parts.join('\n\n');
}

function getDiplomaLockedReason(
  tier: DiplomaTier,
  totalHours: number,
  completionMap: CompletionMap,
  program: Diploma3ProgramRequirements,
  earnedTiers: DiplomaTier[]
): string {
  if (earnedTiers.includes(tier)) return '';
  const d1 = getDiploma1Progress(totalHours, completionMap);

  if (tier === 1) {
    const missing: string[] = [];
    if (!d1.hoursOk) missing.push('20h verificadas en Niveles 1 y 2');
    if (!d1.extrasL1Ok) missing.push(`4 Level Up del Nivel 1 (${d1.extrasL1}/4)`);
    if (!d1.extrasL2Ok) missing.push(`4 Level Up del Nivel 2 (${d1.extrasL2}/4)`);
    return missing.length > 0 ? missing.join(' · ') : 'Requisitos pendientes';
  }

  if (tier === 2) {
    if (!isDiplomaTierEarned(1, totalHours, completionMap)) {
      return 'Primero hay que ganar el Diploma Bronce';
    }
    if (totalHours < 24) {
      return `${totalHours.toFixed(1)}/24h verificadas`;
    }
    return 'Requisitos pendientes';
  }

  if (!isDiplomaTierEarned(2, totalHours, completionMap)) {
    return 'Primero hay que ganar el Diploma Plata';
  }
  const d3Reason = getDiploma3MissingReason(totalHours, completionMap, program);
  if (d3Reason) return d3Reason;
  if (totalHours < 30) return `${totalHours.toFixed(1)}/30h verificadas`;
  if (!d1.extrasL3Ok) return `4 Level Up del Nivel 3 (${d1.extrasL3}/4)`;
  return 'Requisitos pendientes';
}

export default function AdminTeacherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;

  const [data, setData] = useState<AdminTeacherDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTier, setActiveTier] = useState<DiplomaTier | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    welcome: true,
    etica: true,
    reflections: true,
    evaluation: true,
    tasks: true,
    levelup: true,
    diplomas: true,
  });

  const toggleSection = (key: string) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/teacher/${userId}`);
      const json = await res.json().catch(() => ({}));
      if (res.status === 403) {
        router.replace('/dashboard');
        return;
      }
      if (!res.ok) throw new Error(json.error || 'No se pudo cargar el detalle');
      setData(json as AdminTeacherDetailResponse);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId, router]);

  useEffect(() => {
    void load();
  }, [load]);

  const completionMap = useMemo(
    () => (data ? buildInitialCompletions(data.completions) : {}),
    [data]
  );

  const partReflectionsByLevel = useMemo(() => {
    if (!data) return { 1: [], 2: [], 3: [] } as Record<number, Array<{
      title: string;
      text: string;
      aiFeedback?: string;
      date: string;
    }>>;
    const grouped: Record<number, Array<{ title: string; text: string; aiFeedback?: string; date: string }>> = {
      1: [],
      2: [],
      3: [],
    };
    for (const row of data.completions) {
      if (row.status !== 'verified' || !row.item_key.endsWith('-reflection')) continue;
      const item = getPathItem(row.item_key);
      if (!item) continue;
      const levelNum = LEVEL_NUM[item.level] ?? 1;
      grouped[levelNum].push({
        title: item.partTitle ?? item.label,
        text: row.evidence_text ?? '',
        aiFeedback: row.reflection_ai_feedback,
        date: row.verified_at ?? '',
      });
    }
    return grouped;
  }, [data]);

  const tasksByLevel = useMemo(() => {
    if (!data) return [];
    return (['b', 'i', 'a'] as const).map((level) => {
      const items: Array<{
        kind: 'mandatory' | 'collab';
        title: string;
        verifiedAt: string;
        content: string;
        fileUrls?: string[];
        taskScore?: number;
        taskFeedback?: string;
        partnerName?: string;
      }> = [];

      for (const row of data.completions) {
        if (row.status !== 'verified') continue;

        if (row.item_key.endsWith('-task')) {
          const item = getPathItem(row.item_key);
          if (!item || item.level !== level) continue;
          const tool = item.primaryTools?.[0];
          items.push({
            kind: 'mandatory',
            title: `Nivel ${LEVEL_NUM[level]} · Parte ${item.partNumber} · ${tool ?? item.partTitle ?? item.label}`,
            verifiedAt: row.verified_at ?? '',
            content: row.evidence_text ?? '',
            fileUrls: parseTaskFileUrls(row.task_file_url),
            taskScore: row.task_score,
            taskFeedback: row.task_feedback,
          });
        }

        if (isCollabItemKey(row.item_key)) {
          const collab = getCollaborativeTask(row.item_key);
          if (!collab || collab.level !== level) continue;
          items.push({
            kind: 'collab',
            title: `Nivel ${LEVEL_NUM[level]} · ${collab.title}`,
            verifiedAt: row.verified_at ?? '',
            content: row.evidence_text ?? '',
            fileUrls: parseTaskFileUrls(row.task_file_url),
            taskScore: row.task_score,
            taskFeedback: row.task_feedback,
            partnerName: row.partner_name,
          });
        }
      }

      items.sort((a, b) => b.verifiedAt.localeCompare(a.verifiedAt));
      return { level, label: LEVEL_LABELS[level], items };
    });
  }, [data]);

  const levelUpByLevel = useMemo(() => {
    if (!data) return [];
    return (['b', 'i', 'a'] as const).map((level) => {
      const items: Array<{
        title: string;
        verifiedAt: string;
        content: string;
        fileUrls?: string[];
        taskScore?: number;
        taskFeedback?: string;
      }> = [];

      for (const row of data.completions) {
        if (row.status !== 'verified' || !isExtraItemKey(row.item_key)) continue;
        const extra = getExtraTask(row.item_key);
        if (!extra || extra.level !== level) continue;
        items.push({
          title: extra.title,
          verifiedAt: row.verified_at ?? '',
          content: row.evidence_text ?? '',
          fileUrls: parseTaskFileUrls(row.task_file_url),
          taskScore: row.task_score,
          taskFeedback: row.task_feedback,
        });
      }

      items.sort((a, b) => b.verifiedAt.localeCompare(a.verifiedAt));
      const done = data.summary.extrasByLevel[level].done;
      return { level, label: LEVEL_LABELS[level], done, items };
    });
  }, [data]);

  if (loading) {
    return (
      <div className="admin-teacher-page">
        <div className="demo-mode-loading">Cargando detalle de docente…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="admin-teacher-page">
        <div className="admin-teacher-error">
          <p>{error ?? 'Docente no encontrada'}</p>
          <Link href="/maestras" className="admin-teacher-back">
            ← Regresar a /maestras
          </Link>
        </div>
      </div>
    );
  }

  const { teacher, summary, diplomaEvents, diploma3Program, reflections, evaluation } = data;
  const diplomaEventMap = Object.fromEntries(diplomaEvents.map((d) => [d.tier, d]));

  return (
    <div className="admin-teacher-page">
      <header className="demo-mode-hero admin-teacher-hero">
        <div className="demo-mode-hero-glow" aria-hidden />
        <div className="demo-mode-hero-top">
          <span className="demo-mode-eyebrow">VISTA ADMIN · DETALLE DE DOCENTE</span>
          <span className="demo-mode-badge">ADMIN</span>
        </div>
        <h1 className="font-condensed">{teacher.full_name || teacher.email}</h1>
        <p className="demo-mode-subtitle">
          {teacher.subject ? `${teacher.subject} · ` : ''}
          {teacher.start_date
            ? `Inicio ${formatDate(teacher.start_date)} · `
            : ''}
          {summary.totalHours.toFixed(1)}h verificadas
        </p>
        <p className="admin-teacher-email">{teacher.email}</p>
        <div className="admin-teacher-meta">
          <span>
            {LEVEL_LABELS[summary.currentLevel] ?? summary.currentLevel} · {summary.progressPct}%
            progreso
          </span>
        </div>
        <div className="admin-teacher-diploma-badges">
          {([1, 2, 3] as const).map((tier) => {
            const earned = summary.earnedTiers.includes(tier);
            const event = diplomaEventMap[tier];
            return (
              <span
                key={tier}
                className={`admin-teacher-diploma-badge ${earned ? 'admin-teacher-diploma-badge--earned' : ''}`}
              >
                {DIPLOMA_NAMES[tier]} {earned ? '· ganado' : '· pendiente'}
                {earned && event ? ` ${formatDate(event.awarded_at)}` : ''}
              </span>
            );
          })}
        </div>
        <Link href="/maestras" className="admin-teacher-back">
          ← Regresar a /maestras
        </Link>
      </header>

      <CollapsibleSection
        id="welcome"
        title="Flujo de Bienvenida"
        open={openSections.welcome}
        onToggle={() => toggleSection('welcome')}
      >
        <WelcomeChecklist teacher={teacher} />
      </CollapsibleSection>

      <CollapsibleSection
        id="etica"
        title="Política de Ética"
        open={openSections.etica}
        onToggle={() => toggleSection('etica')}
      >
        {teacher.etica_read_at ? (
          <CheckItem done label={`Leída el ${formatDate(teacher.etica_read_at)}`} />
        ) : (
          <CheckItem done={false} label="No leída" />
        )}
      </CollapsibleSection>

      <CollapsibleSection
        id="reflections"
        title="Reflexiones"
        open={openSections.reflections}
        onToggle={() => toggleSection('reflections')}
      >
        {([1, 2, 3] as const).map((level) => {
          const sessionRefs = reflections.filter((r) => r.level === level);
          const partRefs = partReflectionsByLevel[level] ?? [];
          const total = sessionRefs.length + partRefs.length;
          return (
            <div key={level} className="admin-teacher-subsection">
              <h3 className="admin-teacher-subsection-title">
                NIVEL {level} · {total} reflexiones
              </h3>
              {total === 0 ? (
                <p className="admin-teacher-empty">Sin reflexiones registradas.</p>
              ) : (
                <div className="admin-teacher-cards">
                  {sessionRefs.map((r) => (
                    <ReflectionCard
                      key={r.id}
                      title={r.session_title ?? `Sesión Nivel ${level}`}
                      date={r.created_at}
                      text={reflectionFullText(r)}
                    />
                  ))}
                  {partRefs.map((r, i) => (
                    <ReflectionCard
                      key={`part-${level}-${i}`}
                      title={r.title}
                      date={r.date}
                      text={r.text}
                      aiFeedback={r.aiFeedback}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </CollapsibleSection>

      <CollapsibleSection
        id="evaluation"
        title="Evaluación"
        open={openSections.evaluation}
        onToggle={() => toggleSection('evaluation')}
      >
        {evaluation ? (
          <EvaluationReadOnly evaluation={evaluation} />
        ) : (
          <p className="admin-teacher-empty">Sin evaluación registrada.</p>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        id="tasks"
        title="Tareas Completadas (mandatory + collab)"
        open={openSections.tasks}
        onToggle={() => toggleSection('tasks')}
      >
        {tasksByLevel.every((g) => g.items.length === 0) ? (
          <p className="admin-teacher-empty">Sin tareas completadas registradas.</p>
        ) : (
          tasksByLevel.map((group) =>
            group.items.length === 0 ? null : (
              <div key={group.level} className="admin-teacher-subsection">
                <h3 className="admin-teacher-subsection-title">{group.label}</h3>
                <div className="admin-teacher-cards">
                  {group.items.map((item, i) => (
                    <TaskCard key={`${group.level}-${i}`} item={item} />
                  ))}
                </div>
              </div>
            )
          )
        )}
      </CollapsibleSection>

      <CollapsibleSection
        id="levelup"
        title="Tareas Level Up Completadas"
        open={openSections.levelup}
        onToggle={() => toggleSection('levelup')}
      >
        {levelUpByLevel.every((g) => g.items.length === 0) ? (
          <p className="admin-teacher-empty">Sin tareas Level Up completadas.</p>
        ) : (
          levelUpByLevel.map((group) => (
            <div key={group.level} className="admin-teacher-subsection">
              <h3 className="admin-teacher-subsection-title">
                {group.label} · {group.done}/10 completadas
              </h3>
              {group.items.length === 0 ? (
                <p className="admin-teacher-empty">Sin Level Up completadas en este nivel.</p>
              ) : (
                <div className="admin-teacher-cards">
                  {group.items.map((item, i) => (
                    <TaskCard key={`${group.level}-lu-${i}`} item={item} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </CollapsibleSection>

      <CollapsibleSection
        id="diplomas"
        title="Diplomas"
        open={openSections.diplomas}
        onToggle={() => toggleSection('diplomas')}
      >
        <div className="admin-teacher-diploma-list">
          {([1, 2, 3] as const).map((tier) => {
            const earned = summary.earnedTiers.includes(tier);
            const event = diplomaEventMap[tier];
            const diploma = DIPLOMAS.find((d) => d.tier === tier)!;
            const lockedReason = earned
              ? ''
              : getDiplomaLockedReason(
                  tier,
                  summary.totalHours,
                  completionMap,
                  diploma3Program,
                  summary.earnedTiers
                );

            return (
              <div
                key={tier}
                className={`admin-teacher-diploma-row ${earned ? 'admin-teacher-diploma-row--earned' : ''}`}
              >
                <div>
                  <p className="admin-teacher-diploma-name">
                    Diploma {tier} ({DIPLOMA_NAMES[tier]}) · {diploma.name}
                  </p>
                  {earned && event ? (
                    <p className="admin-teacher-diploma-date">Ganado {formatDate(event.awarded_at)}</p>
                  ) : (
                    <p className="admin-teacher-diploma-locked">🔒 {lockedReason}</p>
                  )}
                </div>
                {earned && event && (
                  <button
                    type="button"
                    className="admin-teacher-cert-btn"
                    onClick={() => setActiveTier(tier)}
                  >
                    Ver certificado
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleSection>

      {activeTier != null && diplomaEventMap[activeTier] && (
        <DiplomaModal
          tier={activeTier}
          teacherName={teacher.full_name ?? ''}
          teacherEmail={teacher.email}
          awardedDate={new Date(diplomaEventMap[activeTier].awarded_at)}
          totalHours={diplomaEventMap[activeTier].hours_at_award}
          onClose={() => setActiveTier(null)}
        />
      )}
    </div>
  );
}

function CollapsibleSection({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-teacher-section" aria-labelledby={`section-${id}`}>
      <button
        type="button"
        id={`section-${id}`}
        className="admin-teacher-section-head"
        onClick={onToggle}
        aria-expanded={open}
      >
        <h2>{title}</h2>
        <span className="admin-teacher-section-chevron" aria-hidden>
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open && <div className="admin-teacher-section-body">{children}</div>}
    </section>
  );
}

function WelcomeChecklist({
  teacher,
}: {
  teacher: AdminTeacherDetailResponse['teacher'];
}) {
  const items = [
    { label: 'Mensaje de Cynthia', at: teacher.welcome_cynthia_read_at },
    { label: 'Mensaje del Papa', at: teacher.welcome_pope_read_at },
    { label: 'About del programa', at: teacher.welcome_about_read_at },
    { label: 'Tour guiado', at: teacher.tour_completed_at, optional: false },
  ];

  return (
    <ul className="admin-teacher-checklist">
      {items.map((item) => (
        <li key={item.label}>
          <CheckItem
            done={Boolean(item.at)}
            label={
              item.at
                ? `${item.label} · ${item.label === 'Tour guiado' ? 'completado' : 'leído'} ${formatDate(item.at)}`
                : item.label
            }
          />
        </li>
      ))}
    </ul>
  );
}

function CheckItem({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={done ? 'admin-teacher-check admin-teacher-check--done' : 'admin-teacher-check'}>
      {done ? '✓' : '○'} {label}
    </span>
  );
}

function AiFeedbackCard({ feedback }: { feedback: string }) {
  return (
    <div
      className="admin-teacher-ai-feedback"
      style={{
        borderColor: 'rgba(200, 151, 42, 0.45)',
        background: 'linear-gradient(180deg, var(--gold-light), #fff)',
      }}
    >
      <p className="admin-teacher-ai-feedback-label">Mensaje de tu coach IA</p>
      <p className="admin-teacher-ai-feedback-text">{feedback}</p>
    </div>
  );
}

function ReflectionCard({
  title,
  date,
  text,
  aiFeedback,
}: {
  title: string;
  date: string;
  text: string;
  aiFeedback?: string;
}) {
  return (
    <article className="admin-teacher-card">
      <div className="admin-teacher-card-head">
        <h4>{title}</h4>
        <time className="admin-teacher-card-date">{formatDate(date)}</time>
      </div>
      {text.trim() ? (
        <div className="admin-teacher-card-content">{text}</div>
      ) : (
        <p className="admin-teacher-empty">Sin contenido</p>
      )}
      {aiFeedback && <AiFeedbackCard feedback={aiFeedback} />}
    </article>
  );
}

function TaskCard({
  item,
}: {
  item: {
    title: string;
    verifiedAt: string;
    content: string;
    fileUrls?: string[];
    taskScore?: number;
    taskFeedback?: string;
    partnerName?: string;
  };
}) {
  const fileUrls = item.fileUrls ?? [];
  return (
    <article className="admin-teacher-card">
      <div className="admin-teacher-card-head">
        <h4>{item.title}</h4>
        <time className="admin-teacher-card-date">{formatDate(item.verifiedAt)}</time>
      </div>
      <p className="admin-teacher-task-status">✓ Verificada</p>
      {item.partnerName && (
        <p className="admin-teacher-partner">Compañera: {item.partnerName}</p>
      )}
      {item.content.trim() && fileUrls.length === 0 ? (
        <div className="admin-teacher-card-content">{item.content}</div>
      ) : fileUrls.length > 0 ? null : (
        <p className="admin-teacher-empty">Sin respuesta de texto</p>
      )}
      {fileUrls.map((url, index) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-teacher-file-link"
        >
          {fileUrls.length > 1
            ? `Archivo ${index + 1} (nivel ${index + 1}) →`
            : 'Ver archivo subido →'}
        </a>
      ))}
      {item.taskScore != null && (
        <p className="admin-teacher-score">Puntaje IA: {item.taskScore}/100</p>
      )}
      {item.taskFeedback && <AiFeedbackCard feedback={item.taskFeedback} />}
    </article>
  );
}

const EVAL_QUESTIONS: Array<{
  key: keyof EvaluationRow | 'q9_selections';
  label: string;
  type: 'scale' | 'percent' | 'text' | 'multi' | 'choice';
}> = [
  { key: 'q1_value', label: 'En general, ¿qué tan valioso te resultó este programa?', type: 'scale' },
  {
    key: 'q2_value',
    label: '¿Qué tan AI-ready te sientes ahora, en comparación con antes del programa?',
    type: 'scale',
  },
  {
    key: 'q3_value',
    label: '¿Qué tan probable es que sigas usando IA en tu práctica docente?',
    type: 'scale',
  },
  { key: 'q4_text', label: '¿Qué fue lo más útil del Nivel 1 (Fundamentos)?', type: 'text' },
  { key: 'q5_text', label: '¿Qué fue lo más útil del Nivel 2 (Integración)?', type: 'text' },
  { key: 'q6_text', label: '¿Qué fue lo más útil del Nivel 3 (Transformación)?', type: 'text' },
  { key: 'q7_value', label: 'La duración (≈30h totales) fue:', type: 'scale' },
  {
    key: 'q8_value',
    label: '¿Cómo calificarías el programa en general?',
    type: 'percent',
  },
  { key: 'q9_selections', label: '¿Qué partes funcionaron mejor para ti?', type: 'multi' },
  {
    key: 'q10_text',
    label: '¿Qué planeas implementar concretamente en tu salón en las próximas 4 semanas?',
    type: 'text',
  },
  {
    key: 'q11_text',
    label: '¿Algo que sugieras mejorar para la próxima edición del programa?',
    type: 'text',
  },
  { key: 'q12_value', label: '¿Recomendarías este programa a una colega?', type: 'choice' },
];

function EvaluationReadOnly({ evaluation: e }: { evaluation: EvaluationRow }) {
  const q8Display =
    e.q8_value <= 5 && e.q8_value >= 1 ? e.q8_value * 20 : e.q8_value;

  return (
    <div className="admin-teacher-eval">
      {e.score != null && (
        <div className="admin-teacher-eval-score">
          <p className="admin-teacher-eval-score-label">Puntaje IA</p>
          <p className="admin-teacher-eval-score-value">{e.score}/100</p>
          {e.score_feedback && <AiFeedbackCard feedback={e.score_feedback} />}
        </div>
      )}
      <div className="admin-teacher-eval-questions">
        {EVAL_QUESTIONS.map((q) => {
          const raw = e[q.key as keyof EvaluationRow];
          if (raw == null || (Array.isArray(raw) && raw.length === 0)) {
            return (
              <div key={String(q.key)} className="admin-teacher-eval-q">
                <p className="admin-teacher-eval-q-label">{q.label}</p>
                <p className="admin-teacher-empty">Sin respuesta</p>
              </div>
            );
          }

          return (
            <div key={String(q.key)} className="admin-teacher-eval-q">
              <p className="admin-teacher-eval-q-label">{q.label}</p>
              {q.type === 'scale' && (
                <p className="admin-teacher-eval-q-answer">{String(raw)}/5</p>
              )}
              {q.type === 'percent' && (
                <div className="admin-teacher-percent">
                  <div className="admin-teacher-percent-bar">
                    <div
                      className="admin-teacher-percent-fill"
                      style={{ width: `${q8Display}%` }}
                    />
                  </div>
                  <span>{q8Display}%</span>
                </div>
              )}
              {q.type === 'text' && (
                <div className="admin-teacher-card-content">{String(raw)}</div>
              )}
              {q.type === 'multi' && (
                <p className="admin-teacher-eval-q-answer">
                  {(raw as string[]).join(', ')}
                </p>
              )}
              {q.type === 'choice' && (
                <p className="admin-teacher-eval-q-answer">
                  {Q12_LABEL[e.q12_value]}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="admin-teacher-eval-date">
        Enviada: {formatDate(e.submitted_at)}
      </p>
    </div>
  );
}
