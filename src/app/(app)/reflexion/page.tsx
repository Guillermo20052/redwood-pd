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

function packNotes(freeNotes: string, extraAnswers: string[], startIndex: number): string {
  const parts: string[] = [];
  if (freeNotes.trim()) parts.push(freeNotes.trim());
  extraAnswers.forEach((a, i) => {
    if (a.trim()) parts.push(`[Pregunta ${startIndex + i}]\n${a.trim()}`);
  });
  return parts.join('\n\n');
}

function unpackNotes(notes: string | null): { free: string; extras: Record<number, string> } {
  if (!notes) return { free: '', extras: {} };
  const extras: Record<number, string> = {};
  let free = notes;
  if (notes.includes('[Pregunta ')) {
    const firstIdx = notes.indexOf('[Pregunta ');
    free = notes.slice(0, firstIdx).trim();
    const rest = notes.slice(firstIdx);
    const re = /\[Pregunta (\d+)\]\n([\s\S]*?)(?=\n\n\[Pregunta \d+\]\n|$)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rest)) !== null) {
      extras[parseInt(m[1], 10)] = m[2].trim();
    }
  }
  return { free, extras };
}

export default function ReflexionPage() {
  const [level, setLevel] = useState(1);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState('');
  const [answers, setAnswers] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<Reflection[]>([]);
  const [expanded, setExpanded] = useState<string | number | null>(null);
  const [saved, setSaved] = useState(false);

  const lvlConfig = reflectionConfig.levels.find((l) => l.level === level);
  const questionCount = lvlConfig?.questions.length ?? 3;

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

  useEffect(() => {
    setAnswers(Array(questionCount).fill(''));
  }, [level, questionCount]);

  const save = async () => {
    const hasAnswer = answers.some((a) => a.trim()) || notes.trim();
    if (!hasAnswer) {
      alert('Agrega al menos una respuesta.');
      return;
    }
    const q1 = answers[0] ?? '';
    const q2 = answers[1] ?? '';
    const q3 = answers[2] ?? '';
    const extraFrom4 = answers.slice(3);
    const body = {
      level,
      session_date: date,
      session_title: session || 'Sin título',
      q1,
      q2,
      q3,
      notes: packNotes(notes, extraFrom4, 4),
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
        setAnswers(Array(questionCount).fill(''));
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
    <div className="app-page">
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
        const numClass = i === 0 ? 'n1' : i === 1 ? 'n2' : 'n3';
        return (
          <div key={i} className="ref-qcard">
            <div className="ref-qcard-top">
              <span className={`ref-qnum ${numClass}`}>{i + 1}</span>
              <p className="ref-qtxt">{q}</p>
            </div>
            <textarea
              className="ref-ta"
              value={answers[i] ?? ''}
              onChange={(e) =>
                setAnswers((prev) => {
                  const next = [...prev];
                  next[i] = e.target.value;
                  return next;
                })
              }
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
          entries.map((e) => {
            const { free, extras } = unpackNotes(e.notes);
            const extraLines = Object.entries(extras)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([, text]) => text);
            const allAnswers = [e.q1, e.q2, e.q3, ...extraLines].filter(Boolean);
            return (
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
                <p className="ref-entry-preview">{(allAnswers[0] || free || '').slice(0, 120)}…</p>
                {expanded === e.id && (
                  <div className="mt-2 text-sm space-y-2">
                    {allAnswers.map((text, idx) => (
                      <p key={idx} className="whitespace-pre-wrap">
                        {text}
                      </p>
                    ))}
                    {free && <p className="italic whitespace-pre-wrap">{free}</p>}
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
            );
          })
        )}
      </section>
    </div>
  );
}
