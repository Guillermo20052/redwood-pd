'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CommunityChat } from '@/components/CommunityChat';
import { Leaderboard, type LeaderboardTeacher } from '@/components/Leaderboard';
import { useProgressContext } from '@/components/Providers';

type ApiTeacher = LeaderboardTeacher & {
  diplomaTier?: number;
  hours?: number;
  id?: string;
};

type Tab = 'leaderboard' | 'chat';

export default function ComunidadPage() {
  const { profile } = useProgressContext();
  const [teachers, setTeachers] = useState<LeaderboardTeacher[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('chat');
  const [loading, setLoading] = useState(true);

  const loadTeachers = useCallback(async () => {
    try {
      const res = await fetch('/api/community/teachers');
      if (!res.ok) return;
      const data = await res.json();
      const mapped: LeaderboardTeacher[] = (data.teachers || []).map((t: ApiTeacher) => ({
        user_id: t.user_id ?? t.id ?? '',
        full_name: t.full_name ?? 'Docente',
        subject: t.subject,
        totalHours: typeof t.totalHours === 'number' ? t.totalHours : (t.hours ?? 0),
        level: t.level ?? 'b',
        levelName: t.levelName,
        progressPct: typeof t.progressPct === 'number' ? t.progressPct : 0,
        lastActivity: t.lastActivity ?? null,
      }));
      setTeachers(mapped);
      if (typeof data.currentUserId === 'string') setCurrentUserId(data.currentUserId);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (!cancelled) void loadTeachers();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [loadTeachers]);

  const summary = useMemo(() => {
    const total = teachers.length;
    const totalHours = teachers.reduce((s, t) => s + t.totalHours, 0);
    const avgProgress =
      total > 0
        ? Math.round((teachers.reduce((s, t) => s + t.progressPct, 0) / total) * 10) / 10
        : 0;
    return {
      total,
      totalHours: Math.round(totalHours * 10) / 10,
      avgProgress,
    };
  }, [teachers]);

  return (
    <div className="app-page">
      <div className="level-hero lh-com">
        <div className="level-hero-tag">Aprendemos mejor juntas</div>
        <h2>La comunidad Redwood</h2>
        <p>
          Comparte ideas, celebra avances y encuentra compañeras para las tareas colaborativas.
          Aquí todas avanzamos con el mismo propósito.
        </p>
      </div>

      <div className="comunidad-stat-grid grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Stat label="Docentes registradas" value={loading ? '…' : String(summary.total)} />
        <Stat
          label="Horas verificadas (cohorte)"
          value={loading ? '…' : `${summary.totalHours.toFixed(1)}h`}
        />
        <Stat
          label="Progreso promedio"
          value={loading ? '…' : `${summary.avgProgress.toFixed(1)}%`}
        />
      </div>

      <div className="week-tabs md:hidden">
        <button
          type="button"
          className={`wtab ${tab === 'chat' ? 'active' : ''}`}
          onClick={() => setTab('chat')}
        >
          Chat
        </button>
        <button
          type="button"
          className={`wtab ${tab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setTab('leaderboard')}
        >
          Leaderboard
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section
          className={`space-y-2 ${tab === 'leaderboard' ? '' : 'hidden md:block'}`}
          aria-label="Leaderboard"
        >
          <div className="sec-hdr">
            <h3 className="sec-title">Leaderboard</h3>
            <span className="sec-pill">Más horas primero</span>
          </div>
          <Leaderboard teachers={teachers} currentUserId={currentUserId} />
        </section>

        <section
          className={`space-y-2 ${tab === 'chat' ? '' : 'hidden md:block'}`}
          aria-label="Chat de la comunidad"
        >
          <div className="sec-hdr">
            <h3 className="sec-title">Chat de la comunidad</h3>
            <span className="sec-pill">Actualiza cada 8s</span>
          </div>
          <CommunityChat currentUserName={profile.full_name} />
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--gray-500)]">
        {label}
      </p>
      <p className="font-condensed text-2xl font-extrabold text-[var(--gray-900)]">
        {value}
      </p>
    </div>
  );
}
