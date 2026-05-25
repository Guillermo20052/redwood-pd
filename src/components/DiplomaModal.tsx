'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import type { Diploma } from '@/lib/diplomas';

type Props = {
  diploma: Diploma;
  teacherName: string;
  teacherSubject: string;
  awardedDate: Date;
  totalHours: number;
  onClose: () => void;
};

const DATE_FMT: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

export function DiplomaModal({
  diploma,
  teacherName,
  teacherSubject,
  awardedDate,
  totalHours,
  onClose,
}: Props) {
  const dateStr = awardedDate.toLocaleDateString('es-MX', DATE_FMT);
  const tierClass = `tier-${diploma.tier}`;

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
      aria-label={`Diploma ${diploma.tier}: ${diploma.name}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="diploma-print-target bg-white rounded-2xl max-w-[820px] w-full overflow-hidden shadow-2xl">
        <div className={`diploma-inner-frame ${tierClass}`}>
          <Image
            src={diploma.iconPath}
            alt=""
            width={80}
            height={80}
            className="mx-auto mb-4"
          />
          <p className="dip-eyebrow">Liceo de Monterrey Redwood · Monterrey, N.L.</p>
          <p className="dip-sublabel-main">
            Reconocimiento por la Ruta de Desarrollo Profesional del Liceo de Monterrey Redwood
          </p>
          <p
            className="dip-teacher-name"
            style={{ color: diploma.palette.accentColor }}
          >
            {teacherName || 'Nombre de la Docente'}
          </p>
          {teacherSubject && (
            <p className="text-xs text-[var(--gray-700)] mb-2">{teacherSubject}</p>
          )}
          <p
            className="dip-tier-title"
            style={{ color: diploma.palette.accentColor }}
          >
            {diploma.name}
          </p>
          <p className="dip-body-text">{diploma.sublabel}</p>
          <span
            className={`dip-hours-pill ${tierClass}`}
            style={{ background: diploma.palette.borderColor }}
          >
            {totalHours.toFixed(1)} HORAS DE FORMACIÓN
          </span>
          <p className="dip-eyebrow mt-6">
            Monterrey, N.L., México · {dateStr}
          </p>
          <div className="dip-sigs-row">
            <div>
              <div className="dip-sig-line" />
              <p className="text-xs font-bold text-[var(--gray-900)]">Director(a) General</p>
              <p className="dip-sig-role">Liceo de Monterrey Redwood</p>
            </div>
            <div>
              <div className="dip-sig-line" />
              <p className="text-xs font-bold text-[var(--gray-900)]">Coordinación Académica</p>
              <p className="dip-sig-role">Desarrollo Profesional</p>
            </div>
          </div>
        </div>
        <div className="diploma-modal-actions flex justify-center gap-3 p-4 no-print">
          <button type="button" onClick={handlePrint} className="btn-primary">
            🖨 Imprimir
          </button>
          <button type="button" onClick={onClose} className="btn-outline">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
