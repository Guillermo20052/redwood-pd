'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

function IconMessageCircle({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

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
    <div className={`chat-panel comunidad-chat-panel ${className}`}>
      <div className="comunidad-chat-channel">
        <span className="comunidad-chat-channel-label">Canal escolar</span>
        {polling && <span className="chat-poll-dot" title="Actualizando" />}
      </div>
      <div className="chat-messages comunidad-chat-messages">
        {messages.length === 0 && (
          <div className="comunidad-chat-empty">
            <IconMessageCircle className="comunidad-chat-empty-icon" />
            <p className="comunidad-chat-empty-title">
              El canal está en silencio — por ahora.
            </p>
            <p className="comunidad-chat-empty-copy">
              Sé la primera en escribir en el canal escolar y abre la conversación para tu cohorte.
            </p>
            <p className="comunidad-chat-empty-hint comunidad-chat-empty-cta">
              Escribe el primer mensaje 👋
            </p>
          </div>
        )}
        {messages.map((m) => {
          const isOwn =
            m.is_own === true ||
            (currentUserName &&
              m.author_name.toLowerCase() === currentUserName.toLowerCase());
          const isAdminMsg = m.author_role === 'admin';
          return (
            <div
              key={m.id}
              className={`comunidad-chat-msg ${isOwn ? 'comunidad-chat-msg--own' : 'comunidad-chat-msg--other'}`}
            >
              <div className="chat-meta comunidad-chat-meta flex items-center gap-1.5 flex-wrap">
                <span className={isAdminMsg ? 'chat-meta-admin' : undefined}>
                  {m.author_name}
                </span>
                {isAdminMsg && (
                  <span className="chat-admin-badge">
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
                className={`chat-bubble comunidad-chat-bubble ${isOwn ? 'chat-bubble--own' : 'chat-bubble--other'}${isAdminMsg && !isOwn ? ' chat-bubble--admin' : ''}`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="chat-input-bar comunidad-chat-input-bar">
        <input
          type="text"
          className="chat-input comunidad-chat-input"
          placeholder="Escribe un mensaje…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
        />
        <button
          type="submit"
          className="btn-primary comunidad-send-btn shrink-0"
          disabled={loading || !body.trim()}
        >
          {loading ? '…' : 'Enviar'}
        </button>
      </form>
      {error && <p className="comunidad-chat-error">{error}</p>}
    </div>
  );
}
