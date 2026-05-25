'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CommunityChat } from '@/components/CommunityChat';
import { Leaderboard, type LeaderboardTeacher } from '@/components/Leaderboard';
import { useProgressContext } from '@/components/Providers';

function IconUsers({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconClock({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconTrendingUp({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

type ApiTeacher = LeaderboardTeacher & {
  diplomaTier?: number;
  hours?: number;
  id?: string;
  role?: 'teacher' | 'admin';
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
      const mapped: LeaderboardTeacher[] = (data.teachers || [])
        .filter((t: ApiTeacher) => t.role !== 'admin')
        .map((t: ApiTeacher) => ({
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
    <div className="app-page comunidad-page">
      <header className="comunidad-header">
        <p className="comunidad-header-eyebrow">Aprendemos mejor juntas</p>
        <h1 className="comunidad-header-title">Comunidad</h1>
        <p className="comunidad-header-subtitle">
          Tu cohorte de docentes del Liceo de Monterrey Redwood — comparte, pregunta, celebra.
        </p>
      </header>

      <div className="comunidad-stats-row">
        <Stat
          icon={<IconUsers className="comunidad-stat-icon" />}
          label="Docentes registradas"
          value={loading ? '…' : String(summary.total)}
        />
        <Stat
          icon={<IconClock className="comunidad-stat-icon" />}
          label="Horas verificadas (cohorte)"
          value={loading ? '…' : `${summary.totalHours.toFixed(1)}h`}
        />
        <Stat
          icon={<IconTrendingUp className="comunidad-stat-icon" />}
          label="Progreso promedio"
          value={loading ? '…' : `${summary.avgProgress.toFixed(1)}%`}
        />
      </div>

      <div className="comunidad-segment md:hidden" role="tablist" aria-label="Vista de comunidad">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'chat'}
          className={`comunidad-segment-btn ${tab === 'chat' ? 'comunidad-segment-btn--active' : ''}`}
          onClick={() => setTab('chat')}
        >
          Chat
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'leaderboard'}
          className={`comunidad-segment-btn ${tab === 'leaderboard' ? 'comunidad-segment-btn--active' : ''}`}
          onClick={() => setTab('leaderboard')}
        >
          Leaderboard
        </button>
      </div>

      <div className="comunidad-social-grid">
        <section
          className={`comunidad-panel ${tab === 'leaderboard' ? '' : 'hidden md:flex'}`}
          aria-label="Leaderboard"
        >
          <div className="comunidad-panel-hdr">
            <h2 className="comunidad-panel-title">Leaderboard</h2>
            <span className="comunidad-panel-pill comunidad-panel-pill--brand">Más horas primero</span>
          </div>
          <Leaderboard teachers={teachers} currentUserId={currentUserId} />
        </section>

        <section
          className={`comunidad-panel ${tab === 'chat' ? '' : 'hidden md:flex'}`}
          aria-label="Chat de la comunidad"
        >
          <div className="comunidad-panel-hdr">
            <h2 className="comunidad-panel-title">Chat de la comunidad</h2>
            <span className="comunidad-panel-pill comunidad-panel-pill--muted">Actualiza cada 8s</span>
          </div>
          <CommunityChat currentUserName={profile.full_name} />
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="comunidad-stat-card">
      <p className="comunidad-stat-label">
        {icon}
        <span>{label}</span>
      </p>
      <p className="comunidad-stat-value font-condensed">{value}</p>
    </div>
  );
}
