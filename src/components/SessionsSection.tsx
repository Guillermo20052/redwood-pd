'use client';

import { getPartsByLevel, type PartGroup } from '@/lib/curriculum-path';
import {
  getCollaborativeTaskForLevel,
  type CollaborativeTask,
} from '@/lib/collaborative-tasks';
import toolsData from '../../content/tools.json';

type Props = { level: string };

const TOOL_ALIASES: Record<string, string> = {
  magicschool: '🏫',
  'napkin ai': '📐',
  brisk: '⚡',
};

const LEVEL_COLLAB_LABEL: Record<string, string> = {
  b: 'NIVEL 1',
  i: 'NIVEL 2',
  a: 'NIVEL 3',
};

function matchToolIcon(toolName: string): string {
  const key = toolName.toLowerCase().trim();
  for (const [alias, icon] of Object.entries(TOOL_ALIASES)) {
    if (key.includes(alias)) return icon;
  }
  const found = toolsData.tools.find((t) => {
    const n = t.name.toLowerCase();
    return key.includes(n) || n.includes(key);
  });
  return found?.icon ?? '🔧';
}

/** Truncate by character count; break at last space before limit when possible. */
function truncatePreview(text: string | undefined, maxLen = 180): string {
  if (!text?.trim()) return '';
  const plain = text.replace(/\*\*/g, '').replace(/\n+/g, ' ').trim();
  if (plain.length <= maxLen) return plain;
  let cut = plain.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  if (lastSpace > maxLen * 0.6) {
    cut = cut.slice(0, lastSpace);
  }
  return `${cut.trim()}…`;
}

function levelAccent(level: string): string {
  if (level === 'i') return 'var(--teal)';
  if (level === 'a') return 'var(--red)';
  return 'var(--navy)';
}

function SessionPartCard({ part, level }: { part: PartGroup; level: string }) {
  const accent = levelAccent(level);
  const tool = part.primaryTools[0] ?? 'IA';
  const toolIcon = matchToolIcon(tool);
  const video = part.stages.video;
  const task = part.stages.task;
  const reflection = part.stages.reflection;

  const videoSummary = truncatePreview(video?.videoDescription);
  const taskSummary = truncatePreview(task?.taskPrompt);

  return (
    <article
      className="session-part-card"
      style={{
        border: '1px solid var(--gray-200)',
        borderLeft: `4px solid ${accent}`,
        borderRadius: 10,
        background: '#fff',
        padding: '14px 16px',
      }}
    >
      <header className="mb-2">
        <p
          className="font-condensed font-extrabold uppercase tracking-wide"
          style={{ fontSize: 13, color: accent, lineHeight: 1.2 }}
        >
          Parte {part.partNumber} · {part.partTitle}
        </p>
        {part.partSubtitle?.trim() ? (
          <p
            className="mt-1 italic text-[var(--gray-600)]"
            style={{ fontSize: 12, lineHeight: 1.4 }}
          >
            {part.partSubtitle.trim()}
          </p>
        ) : null}
        <p className="mt-2 text-xs font-semibold" style={{ color: 'var(--gold)' }}>
          {toolIcon} Herramienta: {tool}
        </p>
      </header>

      <div
        className="grid gap-2 text-[var(--gray-800)]"
        style={{ fontSize: 12, lineHeight: 1.5 }}
      >
        {videoSummary ? (
          <p>
            <span className="font-bold text-[var(--gray-700)]">▶ Video:</span>{' '}
            {videoSummary}
          </p>
        ) : null}
        {taskSummary ? (
          <p>
            <span className="font-bold text-[var(--gray-700)]">✎ Tarea:</span>{' '}
            {taskSummary}
          </p>
        ) : null}
        {reflection?.reflectionPrompt ? (
          <p>
            <span className="font-bold text-[var(--gray-700)]">💭 Reflexión:</span>{' '}
            {reflection.reflectionPrompt}
          </p>
        ) : null}
      </div>

      <footer className="mt-3 flex justify-end border-t border-[var(--gray-100)] pt-2">
        <div className="flex items-center gap-1.5" aria-label="Video, tarea y reflexión">
          {(['video', 'task', 'reflection'] as const).map((stage) => (
            <span
              key={stage}
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: accent, opacity: 0.45 }}
              title={stage === 'video' ? 'Video' : stage === 'task' ? 'Tarea' : 'Reflexión'}
            />
          ))}
        </div>
      </footer>
    </article>
  );
}

function SessionCollabCard({ task, level }: { task: CollaborativeTask; level: string }) {
  const summary = truncatePreview(task.description, 220);
  const partnerHint = task.allowMultiplePartners
    ? 'Indica los nombres de tus compañeras al enviar la tarea.'
    : 'Indica el nombre de tu compañera al enviar la tarea.';

  return (
    <article
      className="session-part-card session-collab-card"
      style={{
        border: '2px solid var(--gold)',
        borderRadius: 10,
        background: 'color-mix(in srgb, var(--gold) 8%, white)',
        padding: '14px 16px',
      }}
    >
      <header className="mb-2 space-y-2">
        <span
          className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
          style={{ background: 'var(--gold)', color: 'var(--navy)' }}
        >
          TAREA COLABORATIVA · {LEVEL_COLLAB_LABEL[level] ?? task.levelLabel}
        </span>
        <p
          className="font-condensed font-extrabold text-[var(--navy)]"
          style={{ fontSize: 15, lineHeight: 1.25 }}
        >
          {task.title}
        </p>
      </header>

      <div className="text-[var(--gray-800)] space-y-2" style={{ fontSize: 12, lineHeight: 1.5 }}>
        {summary ? <p>{summary}</p> : null}
        <p>
          <span className="font-bold text-[var(--gray-700)]">👥 Compañera:</span> {partnerHint}
        </p>
      </div>
    </article>
  );
}

export function SessionsSection({ level }: Props) {
  const parts = getPartsByLevel(level);
  const collab = getCollaborativeTaskForLevel(level as 'b' | 'i' | 'a');

  if (!parts.length) {
    return (
      <div className="sec-content active">
        <p className="text-sm text-[var(--gray-600)]">
          El plan de sesiones para este nivel aún no está disponible. Usa la Ruta verificada en
          Plan de Trabajo para avanzar.
        </p>
      </div>
    );
  }

  const cardCount = parts.length + (collab ? 1 : 0);

  return (
    <div className="sec-content active">
      <div className="sec-hdr">
        <h2 className="sec-title">Plan de Sesiones</h2>
        <span className="sec-pill">
          {cardCount} {cardCount === 1 ? 'parte' : 'partes'} · vista de planeación
        </span>
      </div>

      <p className="mb-4 text-sm text-[var(--gray-600)]" style={{ fontSize: 13, lineHeight: 1.55 }}>
        Vista previa de las 5 partes del nivel más la tarea colaborativa al final: herramienta,
        video, tarea y reflexión. Aquí puedes planificar tu semestre sin esperar a desbloquear cada
        parte en la ruta verificada.
      </p>

      <div className="flex flex-col gap-3">
        {parts.map((part) => (
          <SessionPartCard key={part.partId} part={part} level={level} />
        ))}
        {collab ? <SessionCollabCard task={collab} level={level} /> : null}
      </div>
    </div>
  );
}
