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
      const res = await fetch('/api/help-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, role: profile.role }),
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
      {/* Floating button */}
      <button
        type="button"
        aria-label="Abrir ayuda"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--red)',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          zIndex: 9998,
          fontSize: 26,
          transition: 'transform 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open ? '✕' : '?'}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 92,
            right: 24,
            width: 'min(380px, calc(100vw - 32px))',
            height: 520,
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9997,
            overflow: 'hidden',
            border: '1px solid var(--gray-200)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--navy)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>Ayuda Redwood PD</p>
              <p style={{ fontSize: 11, opacity: 0.75, margin: 0 }}>
                {profile.role === 'admin' ? 'Vista coordinación' : 'Asistente de navegación'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
                opacity: 0.8,
                padding: 4,
              }}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 12px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {messages.length === 0 && (
              <div style={{ padding: '8px 4px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div
                  style={{
                    background: '#f3f4f6',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontSize: 13,
                    color: '#374151',
                    maxWidth: '85%',
                  }}
                >
                  Hola 👋 Soy tu asistente de Redwood PD. ¿En qué puedo ayudarte hoy?
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Sugerencias:</p>
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void send(q)}
                      style={{
                        textAlign: 'left',
                        background: 'white',
                        border: '1px solid var(--gray-200)',
                        borderRadius: 8,
                        padding: '6px 10px',
                        fontSize: 12,
                        color: '#374151',
                        cursor: 'pointer',
                      }}
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
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '8px 12px',
                    borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: m.role === 'user' ? 'var(--red)' : '#f3f4f6',
                    color: m.role === 'user' ? 'white' : '#374151',
                    fontSize: 13,
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px 12px 12px 2px',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    fontSize: 13,
                  }}
                >
                  <LoadingDots />
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              borderTop: '1px solid var(--gray-200)',
              padding: '8px 10px',
              display: 'flex',
              gap: 6,
              flexShrink: 0,
              background: 'white',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Escribe tu pregunta…"
              disabled={loading}
              style={{
                flex: 1,
                border: '1px solid var(--gray-300)',
                borderRadius: 8,
                padding: '7px 10px',
                fontSize: 13,
                outline: 'none',
                background: loading ? '#f9fafb' : 'white',
              }}
              maxLength={1000}
            />
            <button
              type="button"
              onClick={() => void send(input)}
              disabled={loading || !input.trim()}
              style={{
                background: 'var(--red)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 13,
                fontWeight: 700,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1,
                flexShrink: 0,
              }}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function LoadingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#9ca3af',
            display: 'inline-block',
            animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </span>
  );
}
