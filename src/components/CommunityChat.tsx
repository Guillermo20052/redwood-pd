'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ChatMessage = {
  id: number | string;
  body: string;
  created_at: string;
  author_name: string;
  /** When true, message was sent by the current user (if provided by API). */
  is_own?: boolean;
  author_role?: 'teacher' | 'admin';
};

type Props = {
  prefill?: string | null;
  onPrefillConsumed?: () => void;
  pollMs?: number;
  className?: string;
  currentUserName?: string;
};

export function CommunityChat({
  prefill,
  onPrefillConsumed,
  pollMs = 8000,
  className = '',
  currentUserName,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [polling, setPolling] = useState(false);
  const consumedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setPolling(true);
    try {
      const res = await fetch('/api/chat/messages');
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      /* retry on next poll */
    } finally {
      setPolling(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [load]);

  useEffect(() => {
    if (!pollMs) return;
    const t = setInterval(() => void load(), pollMs);
    return () => clearInterval(t);
  }, [load, pollMs]);

  useEffect(() => {
    if (!prefill || consumedRef.current) return;
    consumedRef.current = true;
    setBody(prefill);
    onPrefillConsumed?.();
  }, [prefill, onPrefillConsumed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Error al enviar');
      setBody('');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`chat-panel ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--gray-200)]">
        <span className="text-[10px] font-bold uppercase text-[var(--gray-500)]">
          Canal escolar
        </span>
        {polling && <span className="chat-poll-dot" title="Actualizando" />}
      </div>
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-[var(--gray-500)]">
            Sé la primera en escribir en el canal escolar.
          </p>
        )}
        {messages.map((m) => {
          const isOwn =
            m.is_own === true ||
            (currentUserName &&
              m.author_name.toLowerCase() === currentUserName.toLowerCase());
          const isAdminMsg = m.author_role === 'admin';
          return (
            <div key={m.id} className={isOwn ? 'flex flex-col items-end' : ''}>
              <div className="chat-meta flex items-center gap-1.5 flex-wrap">
                <span style={isAdminMsg ? { color: 'var(--red)', fontWeight: 700 } : undefined}>
                  {m.author_name}
                </span>
                {isAdminMsg && (
                  <span
                    className="inline-block text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                    style={{ background: 'var(--red)' }}
                  >
                    ADMIN
                  </span>
                )}
                <span>·{' '}
                {new Date(m.created_at).toLocaleString('es-MX', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: 'numeric',
                  month: 'short',
                })}</span>
              </div>
              <div
                className={`chat-bubble ${isOwn ? 'chat-bubble--own' : 'chat-bubble--other'}`}
                style={isAdminMsg && !isOwn ? { borderLeft: '4px solid var(--red)' } : undefined}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="chat-input-bar">
        <input
          type="text"
          className="chat-input"
          placeholder="Escribe un mensaje…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={loading || !body.trim()}>
          {loading ? '…' : 'Enviar'}
        </button>
      </form>
      {error && <p className="px-4 pb-2 text-xs text-[var(--red)]">{error}</p>}
    </div>
  );
}
