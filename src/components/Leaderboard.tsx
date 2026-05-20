'use client';

import { useMemo } from 'react';

export type LeaderboardTeacher = {
  user_id: string;
  full_name: string;
  subject?: string;
  totalHours: number;
  level: string;
  levelName?: string;
  progressPct: number;
  lastActivity: string | null;
};

type Props = {
  teachers: LeaderboardTeacher[];
  currentUserId?: string | null;
};

const LEVEL_DOT_COLOR: Record<string, string> = {
  b: '#1A2E4A',
  i: '#1A7A6E',
  a: '#B22234',
};

const LEVEL_LABEL: Record<string, string> = {
  b: 'Nivel 1 · Fundamentos',
  i: 'Nivel 2 · Integración',
  a: 'Nivel 3 · Transformación',
};

export function Leaderboard({ teachers, currentUserId }: Props) {
  const sorted = useMemo(() => teachers, [teachers]);

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--gray-200)] bg-white p-8 text-center">
        <p className="text-sm text-[var(--gray-500)]">No hay docentes registradas aún.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--gray-200)] bg-white">
      <table className="lb-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Docente</th>
            <th>Nivel actual</th>
            <th className="text-right">Horas</th>
            <th>Progreso</th>
            <th>Última actividad</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((t, idx) => (
            <LbRow
              key={t.user_id}
              rank={idx + 1}
              teacher={t}
              isCurrent={currentUserId === t.user_id}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LbRow({
  rank,
  teacher,
  isCurrent,
}: {
  rank: number;
  teacher: LeaderboardTeacher;
  isCurrent: boolean;
}) {
  const levelDot = LEVEL_DOT_COLOR[teacher.level] || '#94a3b8';
  const levelLabel = teacher.levelName || LEVEL_LABEL[teacher.level] || teacher.level;
  const hours = teacher.totalHours.toFixed(1);
  const pct = Math.max(0, Math.min(100, teacher.progressPct));
  const lastActivity = formatRelative(teacher.lastActivity);
  const initial = (teacher.full_name || 'D').charAt(0).toUpperCase();
  const rowClass = isCurrent ? 'lb-row--me' : '';

  return (
    <tr className={rowClass}>
      <td data-label="#">{rank}</td>
      <td data-label="Docente">
        <div className="flex items-center gap-3">
          <span
            className="lb-avatar"
            style={{ background: levelDot }}
            aria-hidden
          >
            {initial}
          </span>
          <div>
            <div className="font-semibold text-[var(--gray-900)]">
              {teacher.full_name}
              {isCurrent && (
                <span className="ml-2 text-[10px] font-bold uppercase text-[var(--red)]">
                  (tú)
                </span>
              )}
            </div>
            <div className="text-[10px] text-[var(--gray-500)]">
              {teacher.subject || 'Sin materia'}
            </div>
          </div>
        </div>
      </td>
      <td data-label="Nivel">
        <span className="inline-flex items-center gap-2 text-xs">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: levelDot }}
          />
          {levelLabel}
        </span>
      </td>
      <td data-label="Horas" className="lb-hours">
        {hours}h
      </td>
      <td data-label="Progreso">
        <div className="flex items-center gap-2">
          <div className="lb-progress-track flex-1 max-w-[100px]">
            <div className="lb-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-semibold">{Math.round(pct)}%</span>
        </div>
      </td>
      <td data-label="Actividad" className="text-xs text-[var(--gray-500)]">
        {lastActivity}
      </td>
    </tr>
  );
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'Sin actividad';
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return 'Sin actividad';
  const diffMs = Date.now() - then;
  if (diffMs < 0) return 'hace un momento';
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? 'hace 1 hora' : `hace ${hours} horas`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return weeks === 1 ? 'hace 1 semana' : `hace ${weeks} semanas`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? 'hace 1 mes' : `hace ${months} meses`;
  const years = Math.floor(days / 365);
  return years === 1 ? 'hace 1 año' : `hace ${years} años`;
}
