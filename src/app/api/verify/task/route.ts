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
  fileUrlToPath,
  isSupabaseStorageMode,
  parseUploadUrl,
} from '@/lib/upload-storage';
import { createAdminClient } from '@/lib/supabase/admin';
import { SUPABASE_BUCKET } from '@/lib/upload-storage';
import fs from 'fs';

type PartnerInput = {
  user_id?: string | null;
  name?: string;
};

function isTaskInputType(v: unknown): v is TaskInputType {
  return v === 'text' || v === 'screenshot' || v === 'document';
}

function fileUrlBelongsToUser(fileUrl: string, userId: string): boolean {
  const safeUser = userId.replace(/[^a-zA-Z0-9._-]/g, '_');
  return fileUrl.startsWith(`/api/uploads/${safeUser}/`);
}

async function uploadedFileExists(fileUrl: string): Promise<boolean> {
  if (isSupabaseStorageMode()) {
    const parsed = parseUploadUrl(fileUrl);
    if (!parsed) return false;
    const admin = createAdminClient();
    if (!admin) return false;
    const { data, error } = await admin.storage
      .from(SUPABASE_BUCKET)
      .list(parsed.userId, { search: parsed.filename, limit: 1 });
    if (error) return false;
    return (data || []).some((obj) => obj.name === parsed.filename);
  }
  const localPath = fileUrlToPath(fileUrl);
  return !!(localPath && fs.existsSync(localPath));
}

export async function POST(request: Request) {
  const session = await getSessionUserId();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: {
    itemKey?: string;
    evidenceText?: string;
    fileUrl?: string;
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
    return NextResponse.json({ ok: true, adminSkip: true });
  }

  const { itemKey, evidenceText, fileUrl, inputType: bodyInputType, partner } = body;
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
            'Completa las 5 partes obligatorias de este nivel para desbloquear la Tarea Colaborativa.',
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
      if (!fileUrl || typeof fileUrl !== 'string') {
        return NextResponse.json({ error: 'Debes subir un archivo para esta tarea.' }, { status: 400 });
      }
      if (!fileUrlBelongsToUser(fileUrl, session.userId)) {
        return NextResponse.json({ error: 'Archivo no válido para tu cuenta.' }, { status: 400 });
      }
      const existsCheck = await uploadedFileExists(fileUrl);
      if (!existsCheck) {
        return NextResponse.json(
          { error: 'No se encontró el archivo subido. Vuelve a subirlo.' },
          { status: 400 }
        );
      }
    }

    const filePath =
      inputType !== 'text' && fileUrl && !isSupabaseStorageMode()
        ? fileUrlToPath(fileUrl) ?? undefined
        : undefined;

    let grade;
    try {
      grade = await gradeTaskSubmission({
        inputType,
        taskPrompt: collab.description,
        evidenceText: trimmed,
        fileUrl: fileUrl ?? undefined,
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
        { inputType, fileUrl: fileUrl ?? null }
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
            'Completa las 5 partes obligatorias de este nivel para desbloquear las tareas Level Up.',
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
      if (!fileUrl || typeof fileUrl !== 'string') {
        return NextResponse.json({ error: 'Debes subir un archivo para esta tarea.' }, { status: 400 });
      }
      if (!fileUrlBelongsToUser(fileUrl, session.userId)) {
        return NextResponse.json({ error: 'Archivo no válido para tu cuenta.' }, { status: 400 });
      }
      const existsCheck = await uploadedFileExists(fileUrl);
      if (!existsCheck) {
        return NextResponse.json(
          { error: 'No se encontró el archivo subido. Vuelve a subirlo.' },
          { status: 400 }
        );
      }
    }

    const filePath =
      inputType !== 'text' && fileUrl && !isSupabaseStorageMode()
        ? fileUrlToPath(fileUrl) ?? undefined
        : undefined;

    let grade;
    try {
      grade = await gradeTaskSubmission({
        inputType,
        taskPrompt: extra.description,
        taskRubric: extra.rubric,
        evidenceText: trimmed,
        fileUrl: fileUrl ?? undefined,
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
        { inputType, fileUrl: fileUrl ?? null }
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
    if (!fileUrl || typeof fileUrl !== 'string') {
      return NextResponse.json({ error: 'Debes subir un archivo para esta tarea.' }, { status: 400 });
    }
    if (!fileUrlBelongsToUser(fileUrl, session.userId)) {
      return NextResponse.json({ error: 'Archivo no válido para tu cuenta.' }, { status: 400 });
    }
    const existsCheck = await uploadedFileExists(fileUrl);
    if (!existsCheck) {
      return NextResponse.json(
        { error: 'No se encontró el archivo subido. Vuelve a subirlo.' },
        { status: 400 }
      );
    }
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

  const filePath =
    inputType !== 'text' && fileUrl && !isSupabaseStorageMode()
      ? fileUrlToPath(fileUrl) ?? undefined
      : undefined;

  const rubricFields = getTaskRubricFields(item.taskRubric);
  const toolName = rubricFields.toolName ?? item.primaryTools?.[0];
  const taskGoal =
    rubricFields.taskGoal ?? item.partTitle?.trim() ?? item.label;
  const taskRubricForGrader =
    typeof item.taskRubric === 'string' ? item.taskRubric : undefined;

  let grade;
  try {
    grade = await gradeTaskSubmission({
      inputType,
      taskPrompt: item.taskPrompt ?? item.label,
      taskRubric: taskRubricForGrader,
      evidenceText: trimmed,
      fileUrl: fileUrl ?? undefined,
      filePath,
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
      { inputType, fileUrl: fileUrl ?? null }
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
