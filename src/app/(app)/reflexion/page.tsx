'use client';

import { useEffect, useState } from 'react';
import { reflectionConfig } from '@/lib/content';

type Reflection = {
  id: string | number;
  level: number;
  session_date: string | null;
  session_title: string | null;
  q1: string | null;
  q2: string | null;
  q3: string | null;
  notes: string | null;
  created_at: string;
};

export default function ReflexionPage() {
  const [level, setLevel] = useState(1);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState('');
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<Reflection[]>([]);
  const [expanded, setExpanded] = useState<string | number | null>(null);
  const [saved, setSaved] = useState(false);

  const lvlConfig = reflectionConfig.levels.find((l) => l.level === level);

  const load = async () => {
    try {
      const res = await fetch('/api/reflections');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.reflections || []);
      }
    } catch {
      const raw = localStorage.getItem('redwood_ref_local');
      if (raw) setEntries(JSON.parse(raw));
    }
  };

  useEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, []);

  const save = async () => {
    if (!q1 && !notes) {
      alert('Agrega al menos una respuesta.');
      return;
    }
    const body = {
      level,
      session_date: date,
      session_title: session || 'Sin título',
      q1,
      q2,
      q3,
      notes,
    };
    try {
      const res = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        void load();
        setQ1('');
        setQ2('');
        setQ3('');
        setNotes('');
        setSession('');
      }
    } catch {
      const entry = { ...body, id: Date.now(), created_at: new Date().toISOString() };
      const next = [entry as Reflection, ...entries];
      setEntries(next);
      localStorage.setItem('redwood_ref_local', JSON.stringify(next));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const remove = async (id: string | number) => {
    if (!confirm('¿Eliminar esta reflexión?')) return;
    try {
      await fetch(`/api/reflections?id=${id}`, { method: 'DELETE' });
      void load();
    } catch {
      const next = entries.filter((e) => e.id !== id);
      setEntries(next);
      localStorage.setItem('redwood_ref_local', JSON.stringify(next));
    }
  };

  return (
    <div className="space-y-6">
      <div className="ref-hero">
        <div className="ref-hero-deco">🪞</div>
        <div className="ref-hero-tag">Reflexión docente</div>
        <h2>Tu práctica, en tus propias palabras</h2>
        <p>
          Registra lo que observas en cada sesión. Estas notas son tuyas — te ayudan a
          cerrar el ciclo entre lo que aprendes y lo que haces en el aula.
        </p>
      </div>

      <div className="ref-lvl-tabs" role="tablist">
        {reflectionConfig.levels.map((l) => (
          <button
            key={l.level}
            type="button"
            role="tab"
            aria-selected={level === l.level}
            className={`ref-lvl-tab ${level === l.level ? 'active' : ''}`}
            onClick={() => setLevel(l.level)}
          >
            {l.name}
          </button>
        ))}
      </div>

      <div className="ref-controls">
        <label className="ref-ctrl-lbl">
          Fecha
          <input
            type="date"
            className="ref-date-in"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="ref-ctrl-lbl">
          Sesión / tema
          <input
            className="ref-sess-in"
            value={session}
            onChange={(e) => setSession(e.target.value)}
            placeholder="Título de la sesión"
          />
        </label>
        <button type="button" onClick={save} className={`ref-save-btn ${saved ? 'saved' : ''}`}>
          {saved ? '✅ Guardada' : '💾 Guardar reflexión'}
        </button>
      </div>

      {lvlConfig?.questions.map((q, i) => {
        const setters = [setQ1, setQ2, setQ3];
        const vals = [q1, q2, q3];
        const numClass = i === 0 ? 'n1' : i === 1 ? 'n2' : 'n3';
        return (
          <div key={i} className="ref-qcard">
            <div className="ref-qcard-top">
              <span className={`ref-qnum ${numClass}`}>{i + 1}</span>
              <p className="ref-qtxt">{q}</p>
            </div>
            <textarea
              className="ref-ta"
              value={vals[i]}
              onChange={(e) => setters[i](e.target.value)}
            />
          </div>
        );
      })}

      <div className="ref-obs-card">
        <p className="ref-obs-lbl">Observaciones libres</p>
        <p className="ref-obs-title">Notas que quieras conservar</p>
        <textarea
          className="ref-ta-obs"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <section className="ref-log-wrap">
        <h2 className="ref-log-hdr">Historial</h2>
        {entries.length === 0 ? (
          <p className="ref-empty-state">Aún no hay reflexiones guardadas.</p>
        ) : (
          entries.map((e) => (
            <article key={String(e.id)} className="ref-entry">
              <div className="ref-entry-hdr">
                <p className="ref-entry-meta">
                  📅 {e.session_date} · 📌 {e.session_title}
                  <span className="ref-entry-lvl">Nivel {e.level}</span>
                </p>
                <button
                  type="button"
                  onClick={() => remove(e.id)}
                  className="ref-entry-del"
                  aria-label="Eliminar"
                >
                  🗑
                </button>
              </div>
              <p className="ref-entry-preview">{(e.q1 || e.notes || '').slice(0, 120)}…</p>
              {expanded === e.id && (
                <div className="mt-2 text-sm space-y-2">
                  {[e.q1, e.q2, e.q3].filter(Boolean).map((text, idx) => (
                    <p key={idx} className="whitespace-pre-wrap">
                      {text}
                    </p>
                  ))}
                  {e.notes && <p className="italic">{e.notes}</p>}
                </div>
              )}
              <button
                type="button"
                className="ref-entry-expand"
                onClick={() => setExpanded(expanded === e.id ? null : e.id)}
              >
                {expanded === e.id ? '▲ Ocultar' : '▼ Ver completa'}
              </button>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
