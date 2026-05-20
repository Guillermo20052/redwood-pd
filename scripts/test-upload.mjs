#!/usr/bin/env node
/**
 * E2E upload + grading smoke tests. Run from redwood-pd:
 *   node scripts/test-upload.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE = 'http://localhost:3000';
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(ROOT, '..');
const UPLOADS = path.join(PROJECT, '.data', 'uploads', 'local-dev-user');

// 1x1 PNG
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

// Minimal valid PDF
const MIN_PDF = Buffer.from(
  '%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
  'utf8'
);

const TEXT_EVIDENCE =
  'Conversación con ChatGPT sobre el ciclo del agua para Geografía IB. ChatGPT respondió con bullets organizados. Conversación con Claude sobre el mismo tema. Claude preguntó por mi audiencia antes de responder. Diferencia clave: ChatGPT da información lista, Claude pregunta contexto. Usaré Claude cuando diseño lecciones IB y ChatGPT cuando exploro un tema rápido. La conversación duró 15 minutos total y aprendí que las herramientas no son intercambiables — son para etapas distintas del trabajo docente. Aprendí también que es importante dar contexto antes de pedirle algo a una IA, especialmente cuando se trata de planeación pedagógica IB.';

const results = [];

function record(id, pass, reason, extra = '') {
  results.push({ id, pass, reason, extra });
  const tag = pass ? 'PASS' : 'FAIL';
  console.log(`TEST ${id} — ${tag}: ${reason}${extra ? ` ${extra}` : ''}`);
}

async function checkDevServer() {
  try {
    const res = await fetch(BASE, { redirect: 'manual' });
    return res.status > 0;
  } catch {
    return false;
  }
}

async function postJson(url, body) {
  const res = await fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function uploadBuffer(buffer, filename, mimeType) {
  const form = new FormData();
  const file = new File([buffer], filename, { type: mimeType });
  form.append('file', file);
  const res = await fetch(`${BASE}/api/upload`, { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

async function unlockTask() {
  await postJson('/api/dev/reset-level', { level: 'b' });
  const video = await postJson('/api/verify/video', {
    itemKey: 'lvl-b-p1-video',
    watchPct: 1,
    skipped: true,
  });
  if (!video.res.ok) {
    throw new Error(`Could not unlock video: ${video.data?.error ?? video.res.status}`);
  }
}

function storedFilenameFromUrl(fileUrl) {
  const m = fileUrl?.match(/\/api\/uploads\/[^/]+\/(.+)$/);
  return m ? m[1] : null;
}

async function main() {
  console.log('=== Upload + grading E2E tests ===\n');

  if (!(await checkDevServer())) {
    console.log('Dev server not running — start with npm run dev first');
    process.exit(1);
  }

  let pngFileUrl = null;
  let pdfFileUrl = null;

  // TEST 1
  try {
    await unlockTask();
    const { res, data } = await postJson('/api/verify/task', {
      itemKey: 'lvl-b-p1-task',
      evidenceText: TEXT_EVIDENCE,
      inputType: 'text',
    });
    const pass =
      res.ok &&
      (data.ok === true || (typeof data.score === 'number' && data.score >= 85));
    record(
      1,
      pass,
      pass
        ? `ok=${data.ok}, score=${data.score ?? 'n/a'}`
        : `status=${res.status} ${JSON.stringify(data)}`
    );
  } catch (e) {
    record(1, false, e.message);
  }

  // TEST 2
  try {
    const { res, data } = await uploadBuffer(PNG_1X1, 'test-pixel.png', 'image/png');
    const pass =
      res.status === 200 &&
      typeof data.fileUrl === 'string' &&
      typeof data.fileName === 'string' &&
      typeof data.fileSize === 'number' &&
      data.mimeType === 'image/png';
    if (pass) pngFileUrl = data.fileUrl;
    record(
      2,
      pass,
      pass ? `fileUrl=${data.fileUrl}` : `status=${res.status} ${JSON.stringify(data)}`,
      pass ? `(fileUrl above)` : ''
    );
  } catch (e) {
    record(2, false, e.message);
  }

  // TEST 3
  try {
    const { res, data } = await uploadBuffer(MIN_PDF, 'test-minimal.pdf', 'application/pdf');
    const pass = res.status === 200 && typeof data.fileUrl === 'string';
    if (pass) pdfFileUrl = data.fileUrl;
    record(
      3,
      pass,
      pass ? `fileUrl=${data.fileUrl}` : `status=${res.status} ${JSON.stringify(data)}`
    );
  } catch (e) {
    record(3, false, e.message);
  }

  // TEST 4
  try {
    const big = Buffer.alloc(11 * 1024 * 1024, 0);
    const { res, data } = await uploadBuffer(big, 'huge.png', 'image/png');
    const pass =
      res.status === 400 &&
      typeof data.error === 'string' &&
      data.error.includes('demasiado grande');
    record(
      4,
      pass,
      pass ? data.error : `status=${res.status} ${JSON.stringify(data)}`
    );
  } catch (e) {
    record(4, false, e.message);
  }

  // TEST 5
  try {
    const { res, data } = await uploadBuffer(
      Buffer.from('hello', 'utf8'),
      'notes.txt',
      'text/plain'
    );
    const pass =
      res.status === 400 &&
      typeof data.error === 'string' &&
      data.error.toLowerCase().includes('no permitido');
    record(
      5,
      pass,
      pass ? data.error : `status=${res.status} ${JSON.stringify(data)}`
    );
  } catch (e) {
    record(5, false, e.message);
  }

  // TEST 6
  try {
    const name = storedFilenameFromUrl(pngFileUrl);
    const diskPath = name ? path.join(UPLOADS, name) : null;
    const pass = diskPath ? fs.existsSync(diskPath) : false;
    record(
      6,
      pass,
      pass ? `exists at ${diskPath}` : `missing or no fileUrl from TEST 2 (path=${diskPath})`
    );
  } catch (e) {
    record(6, false, e.message);
  }

  // TEST 7
  try {
    await unlockTask();
    console.log('TEST 7 — Running... (Claude multimodal, may take 5–15s)');
    const { res, data } = await postJson('/api/verify/task', {
      itemKey: 'lvl-b-p1-task',
      fileUrl: pngFileUrl,
      inputType: 'screenshot',
    });
    const hasGrade =
      (typeof data.score === 'number' || typeof data.ok === 'boolean') &&
      typeof data.feedback === 'string' &&
      data.feedback.length > 0;
    const gradeOk = res.status === 200 && hasGrade;
    record(
      7,
      gradeOk,
      gradeOk
        ? `ok=${data.ok}, score=${data.score ?? 'n/a'}, feedback=${data.feedback?.slice(0, 80)}...`
        : `status=${res.status} ${JSON.stringify(data)}`
    );
  } catch (e) {
    record(7, false, e.message);
  }

  // TEST 8
  try {
    await unlockTask();
    console.log('TEST 8 — Running... (Claude document, may take 5–15s)');
    const { res, data } = await postJson('/api/verify/task', {
      itemKey: 'lvl-b-p1-task',
      fileUrl: pdfFileUrl,
      inputType: 'document',
    });
    const hasGrade =
      (typeof data.score === 'number' || typeof data.ok === 'boolean') &&
      typeof data.feedback === 'string' &&
      data.feedback.length > 0;
    const gradeOk = res.status === 200 && hasGrade;
    record(
      8,
      gradeOk,
      gradeOk
        ? `ok=${data.ok}, score=${data.score ?? 'n/a'}, feedback=${data.feedback?.slice(0, 80)}...`
        : `status=${res.status} ${JSON.stringify(data)}`
    );
  } catch (e) {
    record(8, false, e.message);
  }

  const passing = results.filter((r) => r.pass).length;
  const failing = results.filter((r) => !r.pass);
  console.log('\n=== SUMMARY ===');
  console.log(`✅ Passing: ${passing}/8`);
  console.log(`❌ Failing: ${failing.length}/8`);
  if (failing.length) {
    console.log('Failed tests:');
    for (const f of failing) {
      console.log(`  - TEST ${f.id}: ${f.reason}`);
    }
  }
  process.exit(failing.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
