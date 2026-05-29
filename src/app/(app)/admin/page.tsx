import Link from 'next/link';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminPracticaToggle } from '@/components/AdminPracticaToggle';
import { isPracticaEnabled } from '@/lib/feature-flags';
import { AdminDashboard } from './AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const practicaEnabled = await isPracticaEnabled();

  // Local mode (no Supabase env vars) keeps unrestricted access so dev work is
  // unblocked. Production deployments always have Supabase configured.
  if (!isSupabaseConfigured()) {
    return (
      <div className="space-y-8">
        <AdminPracticaToggle initialEnabled={practicaEnabled} />
        <AdminDashboard />
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <Forbidden reason="unauthenticated" />;

  // Use the service-role client so role lookup bypasses RLS — needed because a
  // teacher's session can't normally SELECT another row, and the policy on
  // profiles_select_own only returns the row when role allows it.
  const admin = createAdminClient();
  const sb = admin ?? supabase;
  const { data: profile } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    return <Forbidden reason="not-admin" />;
  }

  return (
    <div className="space-y-8">
      <AdminPracticaToggle initialEnabled={practicaEnabled} />
      <AdminDashboard />
    </div>
  );
}

function Forbidden({ reason }: { reason: 'unauthenticated' | 'not-admin' }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center bg-white rounded-2xl border border-[var(--gray-200)] p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--red-pale)] text-[var(--red)] text-2xl font-bold">
          403
        </div>
        <h1 className="font-condensed text-2xl font-extrabold mb-2">
          No tienes permiso para ver esta página
        </h1>
        <p className="text-sm text-[var(--gray-500)] mb-6">
          {reason === 'unauthenticated'
            ? 'Necesitas iniciar sesión con una cuenta de coordinación.'
            : 'Esta sección es solo para coordinación. Si crees que debería tener acceso, contacta al administrador.'}
        </p>
        <Link
          href="/dashboard"
          className="inline-block btn-primary px-6"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
