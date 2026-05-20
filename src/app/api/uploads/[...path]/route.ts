import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { UPLOAD_ROOT } from '@/lib/upload-storage';

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.pdf': 'application/pdf',
};

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, context: RouteContext) {
  const { path: segments } = await context.params;
  if (!segments?.length || segments.length < 2) {
    return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 });
  }

  const [userId, ...rest] = segments;
  const filename = rest.join('/');
  if (filename.includes('..')) {
    return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 });
  }

  const safeUser = userId.replace(/[^a-zA-Z0-9._-]/g, '_');
  const dir = path.join(UPLOAD_ROOT, safeUser);
  const full = path.join(dir, filename);
  const resolved = path.resolve(full);
  const resolvedDir = path.resolve(dir);
  if (!resolved.startsWith(resolvedDir + path.sep)) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  if (!fs.existsSync(resolved)) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = MIME_BY_EXT[ext] || 'application/octet-stream';
  const body = fs.readFileSync(resolved);

  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
