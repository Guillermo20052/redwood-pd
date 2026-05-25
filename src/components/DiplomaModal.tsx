'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import type { DiplomaTier } from '@/lib/diplomas';
import { getDiplomaTheme } from '@/lib/diploma-themes';

type Props = {
  tier: DiplomaTier;
  teacherName: string;
  teacherEmail?: string;
  awardedDate: Date;
  totalHours: number;
  celebrate?: boolean;
  onClose: () => void;
};

const DATE_FMT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

function displayName(fullName: string, email?: string): string {
  const trimmed = fullName.trim();
  if (trimmed) return trimmed;
  if (email) {
    const local = email.split('@')[0]?.trim();
    if (local) return local;
  }
  return 'Nombre de la Docente';
}

export function DiplomaModal({
  tier,
  teacherName,
  teacherEmail,
  awardedDate,
  totalHours,
  celebrate = false,
  onClose,
}: Props) {
  const theme = getDiplomaTheme(tier);
  const dateStr = awardedDate.toLocaleDateString('es-MX', DATE_FMT);
  const name = displayName(teacherName, teacherEmail);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.classList.add('diploma-modal-open');
    return () => {
      document.body.classList.remove('diploma-modal-open');
      document.body.classList.remove('diploma-printing');
    };
  }, []);

  const handlePrint = () => {
    document.body.classList.add('diploma-printing');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('diploma-printing');
    }, 0);
  };

  return (
    <div
      className="diploma-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Diploma ${tier}: ${theme.name}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`diploma-print-target diploma-print ${celebrate ? 'diploma-celebrate' : ''}`}
      >
        <div
          className="dip-shell"
          style={{ background: `linear-gradient(135deg, ${theme.accentColor}, ${theme.accentColor}dd)` }}
        >
          <div
            className={`diploma-inner-frame diploma-cert tier-${tier}`}
            style={{
              background: theme.backgroundTint,
              borderColor: theme.accentColor,
              ['--dip-accent' as string]: theme.accentColor,
            }}
          >
            <div className="dip-corner tl" aria-hidden />
            <div className="dip-corner tr" aria-hidden />
            <div className="dip-corner bl" aria-hidden />
            <div className="dip-corner br" aria-hidden />
            <div className={`dip-watermark dip-watermark--${theme.cornerMotif}`} aria-hidden>
              {theme.icon}
            </div>

            <div className="dip-header">
              <Image
                src="/assets/logo-header.png"
                alt=""
                width={120}
                height={40}
                className="dip-logo"
              />
              <span className="dip-brand">REDWOOD HIGH</span>
            </div>

            <p className="dip-school">LICEO DE MONTERREY · REDWOOD HIGH SCHOOL</p>
            <p className="dip-cert">certifica con orgullo que</p>

            <h2 className="dip-teacher-name">{name}</h2>

            <span className="dip-tier-pill" style={{ borderColor: theme.accentColor, color: theme.accentColor }}>
              {theme.label}
            </span>

            <h3 className={`dip-title-name tier-${tier}`}>
              {theme.icon} {theme.name}
            </h3>

            <p className="dip-description">{theme.description}</p>

            <span className="dip-hours-pill">{totalHours.toFixed(1)} HORAS DE FORMACIÓN</span>

            <p className="dip-program">
              Programa de Desarrollo Profesional con IA · {theme.subtitle}
            </p>

            <hr className="dip-divider" />

            <div className="dip-sigs-row">
              <div className="dip-sig">
                <div className="dip-sig-line" />
                <p className="dip-sig-name">Cynthia Patuel</p>
                <p className="dip-sig-role">Directora Redwood High</p>
              </div>
              <div className="dip-sig">
                <div className="dip-sig-line" />
                <p className="dip-sig-name">Cecilia Leal</p>
                <p className="dip-sig-role">Coordinadora Académica Redwood High</p>
              </div>
            </div>

            <p className="dip-date">Monterrey, N.L., México · {dateStr}</p>

            {theme.nextTierHint && (
              <p className="dip-next-hint no-print">🔥 {theme.nextTierHint}</p>
            )}
          </div>
        </div>

        <div className="diploma-modal-actions no-print">
          <button type="button" onClick={handlePrint} className="btn-primary">
            Imprimir Diploma
          </button>
          <button type="button" onClick={onClose} className="btn-outline">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
