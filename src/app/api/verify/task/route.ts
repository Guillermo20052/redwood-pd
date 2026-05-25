import { NextResponse } from 'next/server';
import {
  getSessionUserId,
  loadCompletions,
  saveCompletions,
} from '@/lib/completions-service';
import {
  canVerifyItem,
  verifyTask,
  verifyExtraTask,
  verifyCollaborativeTask,
  VerificationError,
  verifyAdminSkip,
  type TaskPartner,
} from '@/lib/verification';
import { getCollaborativeTask, isCollabItemKey } from '@/lib/collaborative-tasks';
import { isAdminUser } from '@/lib/auth-helpers';
import {
  getPathItem,
  getTaskRubricFields,
  verificationConfig,
  type TaskInputType,
} from '@/lib/curriculum-path';
import { getExtraTask, isExtraItemKey } from '@/lib/extra-tasks';
import { isExtraTaskAvailable, isMandatoryPartsComplete } from '@/lib/extras-gating';
import { gradeTaskSubmission } from '@/lib/ai-grader';
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
import { serializeTaskFileUrls } from '@/lib/task-file-urls';

type PartnerInput = {
  user_id?: string | null;
  name?: string;
};

function isTaskInputType(v: unknown): v is TaskInputType {
  return v === 'text' || v === 'screenshot' || v === 'document';
}

function resolveStorageKey(body: {
  key?: string;
  fileUrl?: string;
}): string | null {
  if (typeof body.key === 'string' && body.key.length > 0) {
    return body.key;
  }
  if (typeof body.fileUrl === 'string' && body.fileUrl.length > 0) {
    return fileUrlToStorageKey(body.fileUrl);
  }
  return null;
}

function resolveStorageKeys(body: {
  key?: string;
  keys?: string[];
  fileUrl?: string;
  fileUrls?: string[];
}): string[] {
  if (Array.isArray(body.keys) && body.keys.length > 0) {
    return body.keys.filter((k): k is string => typeof k === 'string' && k.length > 0);
  }
  if (typeof body.key === 'string' && body.key.length > 0) {
    return [body.key];
  }
  if (Array.isArray(body.fileUrls) && body.fileUrls.length > 0) {
    return body.fileUrls
      .map((u) => fileUrlToStorageKey(u))
      .filter((k): k is string => typeof k === 'string' && k.length > 0);
  }
  const single = resolveStorageKey(body);
  return single ? [single] : [];
}

type FileAccessResult =
  | { ok: true; keys: string[]; fileUrls: string[] }
  | { ok: false; response: NextResponse };

async function assertUploadedFilesAccessible(
  body: {
    key?: string;
    keys?: string[];
    fileUrl?: string;
    fileUrls?: string[];
  },
  userId: string,
  maxFiles = 1
): Promise<FileAccessResult> {
  const keys = resolveStorageKeys(body);
  if (keys.length === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Debes subir un archivo para esta tarea.' },
        { status: 400 }
      ),
    };
  }
  if (keys.length > maxFiles) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Esta tarea acepta como máximo ${maxFiles} archivo(s).` },
        { status: 400 }
      ),
    };
  }

  const fileUrls: string[] = [];
  for (const key of keys) {
    if (!storageKeyBelongsToUser(key, userId)) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Archivo no válido para tu cuenta.' },
          { status: 400 }
        ),
      };
    }

    console.log('Verify start', { userId, key });

    const fetchResult = await storageObjectExistsWithRetry(key, { userId });
    if (!fetchResult.exists) {
      console.error('Verify failed - file not found', {
        key,
        bucket: STORAGE_BUCKET,
        userId,
        attempts: fetchResult.attempts,
        lastError: fetchResult.lastError,
        attempted_paths: [key],
      });
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: FILE_NOT_FOUND_USER_MESSAGE,
            code: FILE_NOT_FOUND_ERROR_CODE,
          },
          { status: 400 }
        ),
      };
    }

    fileUrls.push(storageKeyToFileUrl(key));
  }

  return { ok: true, keys, fileUrls };
}

/** @deprecated Use assertUploadedFilesAccessible */
async function assertUploadedFileAccessible(
  body: { key?: string; fileUrl?: string },
  userId: string
): Promise<
  | { ok: true; key: string; fileUrl: string }
  | { ok: false; response: NextResponse }
> {
  const result = await assertUploadedFilesAccessible(body, userId, 1);
  if (!result.ok) return result;
  return { ok: true, key: result.keys[0], fileUrl: result.fileUrls[0] };
}

export async function POST(request: Request) {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: {
    itemKey?: string;
    evidenceText?: string;
    key?: string;
    keys?: string[];
    fileUrl?: string;
    fileUrls?: string[];
    inputType?: string;
    partner?: PartnerInput | null;
    adminSkip?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (body.adminSkip) {
    const admin = await isAdminUser(session.userId);
    if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!body.itemKey || typeof body.itemKey !== 'string') {
      return NextResponse.json({ error: 'itemKey es requerido' }, { status: 400 });
    }
    const current = await loadCompletions(session.userId);
    const updated = verifyAdminSkip(current, body.itemKey);
    await saveCompletions(session.userId, updated);
    return NextResponse.json({ ok: true, adminSkip: true, completions: updated });
  }

  const { itemKey, evidenceText, fileUrl, inputType: bodyInputType, partner } = body;
  let resolvedFileUrl = typeof fileUrl === 'string' ? fileUrl : undefined;
  if (!itemKey || typeof itemKey !== 'string') {
    return NextResponse.json({ error: 'itemKey es requerido' }, { status: 400 });
  }

  const current = await loadCompletions(session.userId);
  const trimmed = typeof evidenceText === 'string' ? evidenceText.trim() : '';
  const isAdmin = await isAdminUser(session.userId);

  if (isCollabItemKey(itemKey)) {
    const collab = getCollaborativeTask(itemKey);
    if (!collab) {
      return NextResponse.json({ error: 'Tarea colaborativa no encontrada' }, { status: 400 });
    }
    if (current[itemKey]?.status === 'verified') {
      return NextResponse.json({ error: 'Ya verificado' }, { status: 400 });
    }
    if (!isAdmin && !isMandatoryPartsComplete(collab.level, current)) {
      return NextResponse.json(
        {
          error:
            'Completa las 5 partes de este nivel para desbloquear la Tarea Colaborativa.',
        },
        { status: 400 }
      );
    }

    const partnerName = (partner?.name ?? '').trim();
    const partnerUserId =
      typeof partner?.user_id === 'string' && partner.user_id.length > 0
        ? partner.user_id
        : null;
    if (partnerName.length < 3) {
      return NextResponse.json(
        { error: 'Indica el nombre de tu compañera antes de enviar la tarea colaborativa.' },
        { status: 400 }
      );
    }

    const inputType: TaskInputType = isTaskInputType(bodyInputType)
      ? bodyInputType
      : collab.inputType;

    if (inputType === 'text') {
      if (trimmed.length < verificationConfig.taskEvidenceMinChars) {
        return NextResponse.json(
          {
            error: `La tarea debe tener al menos ${verificationConfig.taskEvidenceMinChars} caracteres.`,
          },
          { status: 400 }
        );
      }
    } else {
      const fileAccess = await assertUploadedFileAccessible(body, session.userId);
      if (!fileAccess.ok) return fileAccess.response;
      resolvedFileUrl = fileAccess.fileUrl;
    }

    const filePath =
      inputType !== 'text' && resolvedFileUrl && !isSupabaseStorageMode()
        ? fileUrlToPath(resolvedFileUrl) ?? undefined
        : undefined;

    let grade;
    try {
      grade = await gradeTaskSubmission({
        inputType,
        taskPrompt: collab.description,
        evidenceText: trimmed,
        fileUrl: resolvedFileUrl ?? undefined,
        filePath,
        partTitle: collab.title,
        level: collab.level,
        collaborative: true,
        partnerName,
        toolName: 'Colaboración',
        taskGoal: collab.title,
      });
    } catch (e) {
      const message = (e as Error).message || 'Error al evaluar la tarea.';
      return NextResponse.json({ error: message }, { status: 500 });
    }

    if (!grade.passed) {
      return NextResponse.json({
        ok: false,
        passed: false,
        feedback: grade.feedback,
        ...(grade.characterCount != null ? { characterCount: grade.characterCount } : {}),
      });
    }

    const partnerPayload: TaskPartner = { user_id: partnerUserId, name: partnerName };

    try {
      const updated = verifyCollaborativeTask(
        current,
        itemKey,
        trimmed,
        { passed: true, feedback: grade.feedback },
        partnerPayload,
        { inputType, fileUrl: resolvedFileUrl ?? null }
      );
      await saveCompletions(session.userId, updated);

      return NextResponse.json({
        ok: true,
        passed: true,
        feedback: grade.feedback,
        completions: updated,
      });
    } catch (e) {
      const status = e instanceof VerificationError ? e.status : 400;
      return NextResponse.json({ error: (e as Error).message }, { status });
    }
  }

  if (isExtraItemKey(itemKey)) {
    const extra = getExtraTask(itemKey);
    if (!extra) {
      return NextResponse.json({ error: 'Tarea Level Up no encontrada' }, { status: 400 });
    }
    if (current[itemKey]?.status === 'verified') {
      return NextResponse.json({ error: 'Ya verificado' }, { status: 400 });
    }
    if (!isAdmin && !isExtraTaskAvailable(itemKey, current)) {
      return NextResponse.json(
        {
          error:
            'Completa las 5 partes de este nivel para desbloquear las tareas Level Up.',
        },
        { status: 400 }
      );
    }

    const inputType: TaskInputType = isTaskInputType(bodyInputType)
      ? bodyInputType
      : extra.inputType;

    if (isAdmin) {
      return NextResponse.json(
        {
          error:
            'Vista admin: usa «Marcar vista previa (admin)» para explorar sin guardar en la base de datos.',
        },
        { status: 403 }
      );
    }

    if (inputType === 'text') {
      if (trimmed.length < verificationConfig.taskEvidenceMinChars) {
        return NextResponse.json(
          {
            error: `La tarea debe tener al menos ${verificationConfig.taskEvidenceMinChars} caracteres.`,
          },
          { status: 400 }
        );
      }
    } else {
      const fileAccess = await assertUploadedFileAccessible(body, session.userId);
      if (!fileAccess.ok) return fileAccess.response;
      resolvedFileUrl = fileAccess.fileUrl;
    }

    const filePath =
      inputType !== 'text' && resolvedFileUrl && !isSupabaseStorageMode()
        ? fileUrlToPath(resolvedFileUrl) ?? undefined
        : undefined;

    let grade;
    try {
      grade = await gradeTaskSubmission({
        inputType,
        taskPrompt: extra.description,
        taskRubric: extra.rubric,
        evidenceText: trimmed,
        fileUrl: resolvedFileUrl ?? undefined,
        filePath,
        partTitle: extra.title,
        level: extra.level,
        collaborative: false,
        toolName: extra.tool,
        taskGoal: extra.title,
      });
    } catch (e) {
      const message = (e as Error).message || 'Error al evaluar la tarea.';
      return NextResponse.json({ error: message }, { status: 500 });
    }

    if (!grade.passed) {
      return NextResponse.json({
        ok: false,
        passed: false,
        feedback: grade.feedback,
        ...(grade.characterCount != null ? { characterCount: grade.characterCount } : {}),
      });
    }

    try {
      const updated = verifyExtraTask(
        current,
        itemKey,
        trimmed,
        { passed: true, feedback: grade.feedback },
        { inputType, fileUrl: resolvedFileUrl ?? null }
      );
      await saveCompletions(session.userId, updated);
      return NextResponse.json({
        ok: true,
        passed: true,
        feedback: grade.feedback,
        completions: updated,
      });
    } catch (e) {
      const status = e instanceof VerificationError ? e.status : 400;
      return NextResponse.json({ error: (e as Error).message }, { status });
    }
  }

  const item = getPathItem(itemKey);
  if (!item) {
    return NextResponse.json({ error: 'Item no encontrado' }, { status: 400 });
  }
  if (item.type !== 'task') {
    return NextResponse.json({ error: 'Este item no es una tarea' }, { status: 400 });
  }

  const inputType: TaskInputType = isTaskInputType(bodyInputType)
    ? bodyInputType
    : item.inputType ?? 'text';

  const gate = canVerifyItem(current, itemKey);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.reason ?? 'Completa el paso anterior primero.' },
      { status: 400 }
    );
  }

  const maxFiles = item.maxFiles ?? 1;
  let resolvedFileUrls: string[] =
    resolvedFileUrl && typeof resolvedFileUrl === 'string' ? [resolvedFileUrl] : [];

  if (inputType === 'text') {
    if (trimmed.length < verificationConfig.taskEvidenceMinChars) {
      return NextResponse.json(
        {
          error: `La tarea debe tener al menos ${verificationConfig.taskEvidenceMinChars} caracteres.`,
        },
        { status: 400 }
      );
    }
  } else {
    const fileAccess = await assertUploadedFilesAccessible(body, session.userId, maxFiles);
    if (!fileAccess.ok) return fileAccess.response;
    resolvedFileUrls = fileAccess.fileUrls;
  }

  if (!item.taskRubric && inputType === 'text') {
    return NextResponse.json(
      { error: 'Esta tarea no tiene rúbrica configurada. Avisa al administrador.' },
      { status: 500 }
    );
  }

  const collaborative = item.collaborative ?? false;
  const partnerName = (partner?.name ?? '').trim();
  const partnerUserId =
    typeof partner?.user_id === 'string' && partner.user_id.length > 0
      ? partner.user_id
      : null;
  if (collaborative && partnerName.length < 3) {
    return NextResponse.json(
      { error: 'Indica tu compañera antes de enviar la tarea.' },
      { status: 400 }
    );
  }

  const filePaths =
    inputType !== 'text' && !isSupabaseStorageMode()
      ? resolvedFileUrls
          .map((u) => fileUrlToPath(u) ?? undefined)
          .filter((p): p is string => Boolean(p))
      : [];

  const rubricFields = getTaskRubricFields(item.taskRubric);
  const toolName = rubricFields.toolName ?? item.primaryTools?.[0];
  const taskGoal =
    rubricFields.taskGoal ?? item.partTitle?.trim() ?? item.label;
  const taskRubricForGrader =
    typeof item.taskRubric === 'string' ? item.taskRubric : undefined;

  const storedFileUrl =
    inputType !== 'text' ? serializeTaskFileUrls(resolvedFileUrls) : null;

  let grade;
  try {
    grade = await gradeTaskSubmission({
      taskId: itemKey,
      inputType,
      taskPrompt: item.taskPrompt ?? item.label,
      taskRubric: taskRubricForGrader,
      evidenceText: trimmed,
      ...(resolvedFileUrls.length > 1
        ? { fileUrls: resolvedFileUrls, filePaths }
        : resolvedFileUrls.length === 1
          ? { fileUrl: resolvedFileUrls[0], filePath: filePaths[0] }
          : {}),
      partTitle: item.partTitle ?? item.label,
      level: item.level,
      collaborative,
      partnerName: collaborative ? partnerName : undefined,
      toolName,
      taskGoal,
    });
  } catch (e) {
    const message = (e as Error).message || 'Error al evaluar la tarea.';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!grade.passed) {
    return NextResponse.json({
      ok: false,
      passed: false,
      feedback: grade.feedback,
      ...(grade.characterCount != null ? { characterCount: grade.characterCount } : {}),
    });
  }

  try {
    const updated = verifyTask(
      current,
      itemKey,
      trimmed,
      { passed: true, feedback: grade.feedback },
      collaborative ? { user_id: partnerUserId, name: partnerName } : null,
      { inputType, fileUrl: storedFileUrl }
    );
    await saveCompletions(session.userId, updated);
    return NextResponse.json({
      ok: true,
      passed: true,
      feedback: grade.feedback,
      completions: updated,
    });
  } catch (e) {
    const status = e instanceof VerificationError ? e.status : 400;
    return NextResponse.json({ error: (e as Error).message }, { status });
  }
}
