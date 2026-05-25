'use client';

import { useEffect, useRef, useState } from 'react';
import { useProgressContext } from './Providers';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

const SUGGESTED = [
  '¿Cómo subo una captura?',
  '¿Qué es una rúbrica IB?',
  'Estoy atorada, no sé qué hacer',
];

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return String(idCounter);
}

export function HelpChatbot() {
  const { profile } = useProgressContext();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [open, messages.length]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: nextId(), role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const currentPage =
        typeof window !== 'undefined' ? window.location.pathname : '/';

      const res = await fetch('/api/help-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, currentPage }),
      });
      const data = await res.json().catch(() => ({}));
      const reply = res.ok
        ? (data.response as string) || 'Sin respuesta.'
        : data.error || 'Hubo un error. Intenta de nuevo.';
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', text: 'No se pudo conectar. Intenta de nuevo.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Abrir ayuda"
        className={`help-fab ${open ? 'help-fab--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '✕' : '?'}
      </button>

      {open && (
        <div className="help-panel">
          <div className="help-panel-header">
            <div>
              <p className="help-panel-title">Ayuda · Ruta de Desarrollo Profesional</p>
              <p className="help-panel-sub">
                {profile.role === 'admin' ? 'Vista coordinación' : 'Asistente de navegación'}
              </p>
            </div>
            <button
              type="button"
              className="help-panel-close"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          <div className="help-messages">
            {messages.length === 0 && (
              <div className="help-welcome-wrap">
                <div className="help-bubble-assistant">
                  Hola 👋 Soy tu asistente de la Ruta de Desarrollo Profesional del Liceo de Monterrey Redwood. ¿En qué puedo ayudarte hoy?
                </div>
                <div className="help-suggest-list">
                  <p className="help-suggest-label">Sugerencias:</p>
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="help-suggest-btn"
                      onClick={() => void send(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`help-msg-row ${m.role === 'user' ? 'help-msg-row--user' : ''}`}
              >
                <div className={m.role === 'user' ? 'help-bubble-user' : 'help-bubble-assistant'}>
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="help-msg-row">
                <div className="help-loading-dots" aria-label="Escribiendo">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="help-input-bar">
            <input
              ref={inputRef}
              type="text"
              className="help-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Escribe tu pregunta…"
              disabled={loading}
              maxLength={1000}
            />
            <button
              type="button"
              className="help-send-btn"
              onClick={() => void send(input)}
              disabled={loading || !input.trim()}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
