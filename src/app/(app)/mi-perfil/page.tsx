'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProgressContext } from '@/components/Providers';
import { useToast } from '@/components/Toast';

export default function MiPerfilPage() {
  const { profile, totalHours, reload } = useProgressContext();
  const router = useRouter();
  const showToast = useToast();
  const [fullName, setFullName] = useState(profile.full_name);
  const [subject, setSubject] = useState(profile.subject);
  const [startDate, setStartDate] = useState(profile.start_date);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFullName(profile.full_name);
    setSubject(profile.subject);
    setStartDate(profile.start_date);
  }, [profile.full_name, profile.subject, profile.start_date]);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          subject,
          start_date: startDate,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'No se pudo guardar el perfil.');
      }
      await reload();
      showToast('Perfil actualizado');
      router.push('/dashboard');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-page mi-perfil-page">
      <header className="mi-perfil-header">
        <h1 className="mi-perfil-title font-condensed">Mi Perfil</h1>
        <p className="mi-perfil-subtitle">Actualiza tu información personal</p>
      </header>

      <div className="mi-perfil-card card-elevation">
        <div className="mi-perfil-grid">
          <div className="mi-perfil-field">
            <label htmlFor="profile-full-name">Nombre completo</label>
            <input
              id="profile-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
            />
          </div>

          <div className="mi-perfil-field">
            <label htmlFor="profile-subject">Materia / área</label>
            <input
              id="profile-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="p.ej. Biología IB"
            />
          </div>

          <div className="mi-perfil-field">
            <label htmlFor="profile-start-date">Fecha de inicio</label>
            <input
              id="profile-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="mi-perfil-field">
            <label htmlFor="profile-hours">Horas verificadas</label>
            <input
              id="profile-hours"
              readOnly
              disabled
              value={`${totalHours.toFixed(1)}h`}
            />
            <p className="mi-perfil-field-note">
              Se calcula automáticamente de tu progreso
            </p>
          </div>
        </div>

        <div className="mi-perfil-actions">
          {error ? (
            <p className="mi-perfil-error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            className="mi-perfil-save btn-primary"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
