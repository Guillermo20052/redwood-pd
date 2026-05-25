'use client';

import { useEffect } from 'react';
import type { EducatorPerk } from '@/lib/educator-perks';

type Props = {
  toolName: string;
  toolIcon: string;
  toolUrl: string;
  toolDesc: string;
  perk: EducatorPerk;
  open: boolean;
  onClose: () => void;
};

export function EducatorPerkModal({
  toolName,
  toolIcon,
  toolUrl,
  toolDesc,
  perk,
  open,
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="educator-perk-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="educator-perk-modal-title"
      onClick={onClose}
    >
      <div className="educator-perk-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="educator-perk-modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        <div className="educator-perk-modal-header">
          <span className="educator-perk-modal-icon" aria-hidden>
            {toolIcon}
          </span>
          <div>
            <p className="educator-perk-modal-eyebrow">{perk.type}</p>
            <h2 id="educator-perk-modal-title" className="educator-perk-modal-title">
              {toolName}
            </h2>
          </div>
        </div>

        <p className="educator-perk-modal-perk-title">{perk.title}</p>
        <p className="educator-perk-modal-desc">{perk.description}</p>
        {toolDesc ? <p className="educator-perk-modal-tool-desc">{toolDesc}</p> : null}

        <div className="educator-perk-modal-actions">
          <a
            href={perk.link}
            target="_blank"
            rel="noopener noreferrer"
            className="educator-perk-modal-cta"
          >
            {perk.ctaLabel} ↗
          </a>
          <a
            href={toolUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="educator-perk-modal-tool-link"
          >
            Ir a {toolName} ↗
          </a>
          <button type="button" className="educator-perk-modal-dismiss" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
