'use client';

import { useEffect, useState } from 'react';
import type { CompletionMap } from '@/lib/verification';
import {
  getCollaborativeTasksForLevel,
  type CollaborativeTask,
} from '@/lib/collaborative-tasks';
import { PartnerPicker, type PartnerTeacher, type PartnerValue } from './PartnerPicker';
import { verificationConfig } from '@/lib/curriculum-path';

const MIN_CHARS = verificationConfig.taskEvidenceMinChars;

type Props = {
  level: 'b' | 'i' | 'a';
  completions: CompletionMap;
  isAdmin?: boolean;
  onUpdated: () => void;
};

type ApiTeacher = { id: string; full_name: string; subject?: string };

export function CollaborativeTasksSection({ level, completions, isAdmin = false, onUpdated }: Props) {
  const tasks = getCollaborativeTasksForLevel(level);

  return (
    <div className="sec-content active space-y-5">
      <div className="sec-hdr">
        <h2 className="sec-title">Tareas Colaborativas</h2>
        <span className="sec-pill" style={{ background: 'color-mix(in srgb, var(--gold) 25%, white)' }}>
          En pareja
        </span>
      </div>
      <p className="text-sm text-[var(--gray-600)]" style={{ fontSize: 13, lineHeight: 1.55 }}>
        Trabaja con una o más colegas. La tarea se marca verificada cuando ambas partes confirman con
        evidencia y se declaran mutuamente como compañeras.
      </p>
      {tasks.map((task) => (
        <CollaborativeTaskCard
          key={task.id}
          task={task}
          completions={completions}
          isAdmin={isAdmin}
          onUpdated={onUpdated}
        />
      ))}
    </div>
  );
}

function CollaborativeTaskCard({
  task,
  completions,
  isAdmin,
  onUpdated,
}: {
  task: CollaborativeTask;
  completions: CompletionMap;
  isAdmin: boolean;
  onUpdated: () => void;
}) {
  const [currentUserId, setCurrentUserId] = useState('local-dev-user');
  const row = completions[task.id];
  const verified = row?.status === 'verified';
  const waitingPartner =
    row?.status === 'available' && !!(row.evidence_text || row.task_file_url);
  const [evidence, setEvidence] = useState('');
  const [partner, setPartner] = useState<PartnerValue | null>(null);
  const [allTeachers, setAllTeachers] = useState<PartnerTeacher[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/community/teachers');
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (typeof data.currentUserId === 'string' && data.currentUserId) {
          setCurrentUserId(data.currentUserId);
        }
        const mapped: PartnerTeacher[] = (data.teachers || []).map((t: ApiTeacher) => ({
          user_id: t.id,
          full_name: t.full_name,
          subject: t.subject,
        }));
        if (!cancelled) setAllTeachers(mapped);
      } catch {
        /* optional */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const partnerOk = partner !== null && partner.name.trim().length >= 3;
  const evidenceOk = evidence.trim().length >= MIN_CHARS;
  const canSubmit = (isAdmin || (!verified && !waitingPartner)) && partnerOk && evidenceOk;

  const submit = async () => {
    setError(null);
    setFeedback(null);
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/verify/task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemKey: task.id,
          evidenceText: evidence.trim(),
          inputType: 'text',
          partner,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo enviar.');
        return;
      }
      if (data.passed === false) {
        setFeedback(data.feedback);
        return;
      }
      setFeedback(data.feedback || data.partnerPending || null);
      setEvidence('');
      onUpdated();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <article
      className="rounded-xl border-2 p-4 space-y-3"
      style={{
        borderColor: 'var(--gold)',
        background: 'color-mix(in srgb, var(--gold) 8%, white)',
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
          style={{ background: 'var(--gold)', color: 'var(--navy)' }}
        >
          TAREA COLABORATIVA
        </span>
        {task.smallGroup && (
          <span className="text-[10px] font-semibold text-[var(--gray-600)]">Grupo pequeño (2–3)</span>
        )}
        {verified && (
          <span className="text-xs font-semibold text-[var(--green)]">✓ Verificada (ambas confirmaron)</span>
        )}
        {waitingPartner && (
          <span className="text-xs font-semibold text-[var(--gold)]">
            ⏳ Esperando confirmación de {row?.partner_name || 'tu compañera'}
          </span>
        )}
      </div>
      <h3 className="font-condensed text-lg font-extrabold text-[var(--navy)]">{task.title}</h3>
      <p className="text-sm text-[var(--gray-700)] leading-relaxed">{task.description}</p>
      <p className="text-xs text-[var(--gray-500)]">~{task.estimatedMinutes} min</p>

      {!verified && (
        <>
          <PartnerPicker
            onSelect={setPartner}
            currentValue={partner}
            allTeachers={allTeachers}
            currentUserId={currentUserId}
            partNumber={0}
            partTitle={task.title}
            disabled={submitting || verified}
          />
          <textarea
            className="rw-textarea min-h-[120px] w-full"
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
            placeholder="Describe lo que hicieron juntas y qué aprendiste…"
            disabled={waitingPartner && !isAdmin}
          />
          <div className="char-counter text-xs text-[var(--gray-500)]">
            {evidence.trim().length} / {MIN_CHARS} caracteres mín.
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          {feedback && <p className="text-xs text-[var(--teal)]">{feedback}</p>}
          <button
            type="button"
            className="btn-primary text-sm"
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}
            disabled={!canSubmit || submitting}
            onClick={() => void submit()}
          >
            {submitting ? 'Enviando…' : waitingPartner ? 'Actualizar evidencia' : 'Enviar y notificar a tu compañera'}
          </button>
        </>
      )}
      {verified && row?.task_feedback && (
        <p className="text-sm text-[var(--gray-700)]">{row.task_feedback}</p>
      )}
    </article>
  );
}
