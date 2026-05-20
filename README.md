# Redwood High · PD con IA

Aplicación web para la Ruta de Desarrollo Profesional con Inteligencia Artificial (Redwood High School).

## Datos y modos

La aplicación tiene dos modos de operación:

- **Modo local** (predeterminado): toda la data vive en `.data/local-db.json` — completions, perfiles, reflexiones, chat, diplomas. Es lo que ves cuando corres `npm run dev` sin variables de entorno de Supabase.
- **Modo Supabase**: cuando `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` están configuradas, la app usa la base de datos remota.

Ambos modos usan la misma tabla `item_completions` como única fuente de verdad para el progreso. El sistema legacy `progress_items` ya está deprecado y será removido por la migración `004_unified_progress.sql` la próxima vez que se conecte Supabase.

## Estructura

- `content/` — currículo en JSON (checklist, videos, niveles, herramientas)
- `public/assets/` — logos extraídos del HTML legacy
- `src/` — aplicación Next.js 16
- `supabase/migrations/` — esquema Postgres + RLS
- `scripts/extract-content.mjs` — extractor desde el HTML original

## Desarrollo local

```bash
cd redwood-pd
cp .env.example .env.local
# Añade NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run dev
```

Sin Supabase configurado, la app funciona en **modo local** (localStorage) desde `/dashboard`.

## Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ejecuta `supabase/migrations/001_schema.sql` en el SQL Editor
3. Habilita Email (magic link) en Authentication
4. Para panel admin: `update profiles set role = 'admin' where email = 'tu@correo.com';`

## Migración desde el HTML legacy

1. Abre `Redwood_High_PD_IA_Docentes.html` en el navegador
2. Clic en **Exportar progreso (.json)**
3. En la app: **Importar** → sube el archivo

## Scripts

```bash
node scripts/extract-content.mjs   # Regenerar content/ desde el HTML
npm run build
```

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Inicio y resumen |
| `/nivel/b`, `/nivel/i`, `/nivel/a` | Checklists por nivel |
| `/logros` | Diplomas (20 / 24 / 30 h) |
| `/etica` | Política y ética IA 2025–2026 |
| `/reflexion` | Diario reflexivo |
| `/importar` | Importar JSON legacy |
| `/admin` | Cohorte y export CSV (rol admin) |
| `/login` | Magic link |
