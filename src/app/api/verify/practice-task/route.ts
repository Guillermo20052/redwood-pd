import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/completions-service';
import { gradePracticeTaskSubmission } from '@/lib/ai-grader';
import { isPracticaEnabled } from '@/lib/feature-flags';
import { savePracticeCompletion } from '@/lib/practice-completions-service';
import { getPracticeTask } from '@/lib/practice-tasks';
import {
  FILE_NOT_FOUND_ERROR_CODE,
  FILE_NOT_FOUND_USER_MESSAGE,
} from '@/lib/upload-errors';
import {
  fileUrlToPath,
  fileUrlToStorageKey,
  isSupabaseStorageMode,
  storageKeyBelongsToUser,
  storageKeyToFileUrl,
  STORAGE_BUCKET,
} from '@/lib/upload-storage';
import { storageObjectExistsWithRetry } from '@/lib/upload-storage-server';

function resolveStorageKey(body: { key?: string; fileUrl?: string }): string | null {
  if (typeof body.key === 'string' && body.key.length > 0) {
    return body.key;
  }
  if (typeof body.fileUrl === 'string' && body.fileUrl.length > 0) {
    return fileUrlToStorageKey(body.fileUrl);
  }
  return null;
}

export async function POST(req: Request) {
  const session = await getSessionUserId();
  if (!session) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  }

  const enabled = await isPracticaEnabled();
  if (!enabled) {
    return NextResponse.json(
      { error: 'La sección Práctica no está activa en este momento.' },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const taskId = typeof body.taskId === 'string' ? body.taskId : '';
  if (!taskId) {
    return NextResponse.json({ error: 'taskId es requerido' }, { status: 400 });
  }

  const task = getPracticeTask(taskId);
  if (!task) {
    return NextResponse.json({ error: 'Tarea de práctica no encontrada' }, { status: 400 });
  }

  const storageKey = resolveStorageKey(body);
  if (!storageKey) {
    return NextResponse.json(
      { error: 'Debes subir un archivo (PDF, PNG o JPG).' },
      { status: 400 }
    );
  }

  if (!storageKeyBelongsToUser(storageKey, session.userId)) {
    return NextResponse.json({ error: 'Archivo no válido para tu cuenta.' }, { status: 400 });
  }

  const fetchResult = await storageObjectExistsWithRetry(storageKey, {
    userId: session.userId,
  });
  if (!fetchResult.exists) {
    console.error('Practice verify failed - file not found', {
      key: storageKey,
      bucket: STORAGE_BUCKET,
      userId: session.userId,
    });
    return NextResponse.json(
      { error: FILE_NOT_FOUND_USER_MESSAGE, code: FILE_NOT_FOUND_ERROR_CODE },
      { status: 400 }
    );
  }

  const fileUrl = storageKeyToFileUrl(storageKey);
  const filePath =
    !isSupabaseStorageMode() ? (fileUrlToPath(fileUrl) ?? undefined) : undefined;

  const inputType =
    storageKey.toLowerCase().endsWith('.pdf') ? ('document' as const) : ('screenshot' as const);

  let grade;
  try {
    grade = await gradePracticeTaskSubmission({
      taskId,
      inputType,
      taskPrompt: [
        task.description,
        '',
        `Qué debes entregar: ${task.expectedOutput}`,
        task.tip ? `Tip: ${task.tip}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
      fileUrl,
      filePath,
      partTitle: task.title,
      level: 'practice',
      toolName: task.tool === 'claude' ? 'Claude' : task.tool === 'diffit' ? 'Diffit' : 'NotebookLM',
      taskGoal: task.expectedOutput,
    });
  } catch (e) {
    const message = (e as Error).message || 'Error al evaluar la práctica.';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const now = new Date().toISOString();
  await savePracticeCompletion(session.userId, {
    task_id: taskId,
    score: grade.score,
    feedback: grade.feedback,
    file_url: fileUrl,
    created_at: now,
    updated_at: now,
  });

  return NextResponse.json({
    ok: true,
    passed: true,
    score: grade.score,
    feedback: grade.feedback,
    taskId,
  });
}
