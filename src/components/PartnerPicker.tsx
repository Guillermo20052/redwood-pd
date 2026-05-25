'use client';

import { useState } from 'react';

export type PartnerTeacher = {
  user_id: string;
  full_name: string;
  subject?: string;
};

export type PartnerValue = {
  user_id: string | null;
  name: string;
};

type Props = {
  /** Selection callback. `user_id` is null when the partner is free-text. */
  onSelect: (partner: PartnerValue) => void;
  /** Controlled value of the picker; `null` means "no partner selected yet". */
  currentValue?: PartnerValue | null;
  /** Full list of teachers fetched from /api/community/teachers. The picker
   * filters out the current user automatically. */
  allTeachers: PartnerTeacher[];
  /** Used to exclude the current user from the dropdown. */
  currentUserId: string;
  /** Used to compose the "Buscar compañera" chat message. */
  partNumber: number;
  partTitle: string;
  /** Optional callback when the teacher posts a partner-search message into
   * chat. Receives the posted body so the parent can give feedback. */
  onChatPosted?: (body: string) => void;
  /** Disables the controls (e.g. while submitting the task). */
  disabled?: boolean;
};

type Tab = 'list' | 'manual';

export function PartnerPicker({
  onSelect,
  currentValue,
  allTeachers,
  currentUserId,
  partNumber,
  partTitle,
  onChatPosted,
  disabled = false,
}: Props) {
  const otherTeachers = allTeachers.filter((t) => t.user_id !== currentUserId);
  const initialTab: Tab =
    currentValue?.user_id && otherTeachers.some((t) => t.user_id === currentValue.user_id)
      ? 'list'
      : currentValue?.name
        ? 'manual'
        : otherTeachers.length > 0
          ? 'list'
          : 'manual';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [manualDraft, setManualDraft] = useState('');
  const manualName =
    currentValue?.user_id === null
      ? currentValue.name
      : !currentValue
        ? manualDraft
        : manualDraft;
  const [chatStatus, setChatStatus] = useState<null | { kind: 'ok' | 'err'; message: string }>(
    null
  );
  const [posting, setPosting] = useState(false);

  const selected = currentValue && currentValue.name.trim().length >= 3;

  const handleDropdown = (userId: string) => {
    if (!userId) {
      // "— Selecciona —" cleared.
      onSelect({ user_id: null, name: '' });
      return;
    }
    const t = otherTeachers.find((o) => o.user_id === userId);
    if (!t) return;
    onSelect({ user_id: t.user_id, name: t.full_name });
  };

  const handleManualChange = (next: string) => {
    setManualDraft(next);
    onSelect({ user_id: null, name: next });
  };

  const handleClear = () => {
    setManualDraft('');
    onSelect({ user_id: null, name: '' });
  };

  const postSearchMessage = async () => {
    if (posting) return;
    const body = buildSearchMessage(partNumber, partTitle);
    setPosting(true);
    setChatStatus(null);
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'No se pudo publicar.');
      setChatStatus({
        kind: 'ok',
        message: 'Mensaje publicado en el chat de la comunidad.',
      });
      onChatPosted?.(body);
    } catch (e) {
      setChatStatus({ kind: 'err', message: (e as Error).message });
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="stage-prompt-card stage-prompt-card--teal">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-900">
            🤝 Tarea colaborativa
          </p>
          <p className="mt-1 text-sm text-amber-900">
            Esta es una tarea colaborativa. Indica tu compañera para esta tarea.
          </p>
        </div>
        {selected && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
            ✓ {currentValue?.name}
          </span>
        )}
      </header>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row text-xs">
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 font-semibold transition ${
            tab === 'list'
              ? 'bg-white text-[var(--gray-900)] shadow-sm border border-[var(--teal)]'
              : 'text-[var(--teal)] hover:bg-white/60 border border-transparent'
          }`}
          onClick={() => setTab('list')}
          disabled={disabled}
        >
          Selecciona de la lista
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md px-3 py-2 font-semibold transition ${
            tab === 'manual'
              ? 'bg-white text-[var(--gray-900)] shadow-sm border border-[var(--teal)]'
              : 'text-[var(--teal)] hover:bg-white/60 border border-transparent'
          }`}
          onClick={() => setTab('manual')}
          disabled={disabled}
        >
          Escribir nombre
        </button>
      </div>

      <div className="mt-3">
        {tab === 'list' && (
          <div>
            {otherTeachers.length === 0 ? (
              <p className="rounded-md border border-amber-200 bg-white/70 p-3 text-xs text-amber-900">
                Aún no hay otras docentes registradas — escribe el nombre manualmente.
              </p>
            ) : (
              <select
                className="w-full rounded-md border border-[var(--gray-300)] bg-white px-3 py-2 text-sm"
                value={currentValue?.user_id ?? ''}
                onChange={(e) => handleDropdown(e.target.value)}
                disabled={disabled}
              >
                <option value="">— Selecciona una docente —</option>
                {otherTeachers.map((t) => (
                  <option key={t.user_id} value={t.user_id}>
                    {t.full_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {tab === 'manual' && (
          <div>
            <input
              type="text"
              className="w-full rounded-md border border-[var(--gray-300)] bg-white px-3 py-2 text-sm"
              placeholder="Nombre completo de tu compañera"
              value={manualName}
              onChange={(e) => handleManualChange(e.target.value)}
              maxLength={120}
              disabled={disabled}
            />
            <p
              className={`mt-1 text-[11px] ${
                manualName.trim().length >= 3
                  ? 'text-[var(--gray-500)]'
                  : 'text-red-700 font-semibold'
              }`}
            >
              {manualName.trim().length >= 3
                ? 'Listo: aparecerá al inicio del texto que entregues.'
                : 'Escribe al menos 3 caracteres.'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-900 transition hover:bg-amber-100 disabled:opacity-60"
          onClick={postSearchMessage}
          disabled={disabled || posting}
        >
          {posting ? 'Publicando…' : 'Buscar compañera en chat'}
        </button>
        {selected && (
          <button
            type="button"
            className="rounded-md border border-[var(--gray-300)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--gray-700)] hover:bg-[var(--gray-50)] disabled:opacity-60"
            onClick={handleClear}
            disabled={disabled}
          >
            Cambiar
          </button>
        )}
      </div>

      {chatStatus && (
        <p
          className={`mt-2 text-xs ${
            chatStatus.kind === 'ok' ? 'text-emerald-700' : 'text-red-700'
          }`}
        >
          {chatStatus.message}
        </p>
      )}
    </section>
  );
}

export function buildSearchMessage(partNumber: number, partTitle: string): string {
  return `🤝 Busco compañera para Parte ${partNumber} · ${partTitle}. ¿Alguien interesada?`;
}
