'use client';

import { getPartsByLevel, type PartGroup } from '@/lib/curriculum-path';
import toolsData from '../../content/tools.json';

type Props = { level: string };

const TOOL_ALIASES: Record<string, string> = {
  magicschool: '🏫',
  'napkin ai': '📐',
  brisk: '⚡',
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
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  let cut = trimmed.slice(0, maxLen);
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

export function SessionsSection({ level }: Props) {
  const parts = getPartsByLevel(level);

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

  return (
    <div className="sec-content active">
      <div className="sec-hdr">
        <h2 className="sec-title">Plan de Sesiones</h2>
        <span className="sec-pill">{parts.length} partes · vista de planeación</span>
      </div>

      <p className="mb-4 text-sm text-[var(--gray-600)]" style={{ fontSize: 13, lineHeight: 1.55 }}>
        Vista previa de las 5 partes del nivel: herramienta, video, tarea y reflexión. Aquí puedes
        planificar tu semestre sin esperar a desbloquear cada parte en la ruta verificada.
      </p>

      <div className="flex flex-col gap-3">
        {parts.map((part) => (
          <SessionPartCard key={part.partId} part={part} level={level} />
        ))}
      </div>
    </div>
  );
}
