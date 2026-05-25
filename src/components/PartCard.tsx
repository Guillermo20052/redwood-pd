'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import type { CompletionMap } from '@/lib/verification';
import type { PartGroup } from '@/lib/curriculum-path';
import { PartStageVideo } from './PartStageVideo';
import { PartStageTask } from './PartStageTask';
import { PartStageReflection } from './PartStageReflection';
import { EducatorPerkBanner } from './EducatorPerkBanner';
import { getToolMetaByName } from '@/lib/content';

type PartStatus = 'locked' | 'active' | 'complete';
type StageStatus = 'locked' | 'available' | 'verified';

type Props = {
  part: PartGroup;
  completions: CompletionMap;
  isAdmin?: boolean;
  onPartComplete?: (partId: string) => void;
};

const SUCCESS_DELAY_MS = 1500;

function stageStatus(
  itemKey: string | undefined,
  completions: CompletionMap,
  isAdmin = false
): StageStatus {
  if (!itemKey) return 'locked';
  const row = completions[itemKey];
  if (row?.status === 'verified') return 'verified';
  if (isAdmin) return 'available';
  return (row?.status as StageStatus | undefined) ?? 'locked';
}

function StageDot({
  filled,
  active,
  level,
}: {
  filled: boolean;
  active?: boolean;
  level: 'b' | 'i' | 'a';
}) {
  const cls = [
    'part-stage-dot',
    `lv-${level}`,
    filled ? 'filled' : '',
    active ? 'active' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return <span aria-hidden className={cls} />;
}

function PartHeading({
  title,
  subtitle,
  titleClassName = 'part-card-title',
  locked = false,
}: {
  title: string;
  subtitle?: string;
  titleClassName?: string;
  locked?: boolean;
}) {
  const sub = subtitle?.trim();
  return (
    <>
      <h3 className={titleClassName}>{locked ? `🔒 ${title}` : title}</h3>
      {sub ? (
        <p className="text-sm text-[var(--gray-600)] mt-1 leading-snug font-normal">{sub}</p>
      ) : null}
    </>
  );
}

export const PartCard = forwardRef<HTMLElement, Props>(function PartCard(
  { part, completions, isAdmin = false, onPartComplete },
  ref
) {
  const level = part.level as 'b' | 'i' | 'a';
  const stages = part.stages;
  const videoS = stageStatus(stages.video?.itemKey, completions, isAdmin);
  const taskS = stageStatus(stages.task?.itemKey, completions, isAdmin);
  const reflS = stageStatus(stages.reflection?.itemKey, completions, isAdmin);
  const verifiedCount = [videoS, taskS, reflS].filter((s) => s === 'verified').length;
  const activeDotIndex =
    videoS !== 'verified' ? 0 : taskS !== 'verified' ? 1 : reflS !== 'verified' ? 2 : 2;

  let status: PartStatus;
  if (videoS === 'verified' && taskS === 'verified' && reflS === 'verified') {
    status = 'complete';
  } else if (!isAdmin && videoS === 'locked') {
    status = 'locked';
  } else {
    status = 'active';
  }

  const prevStatusRef = useRef<PartStatus>(status);
  const [showSuccess, setShowSuccess] = useState(false);
  const [userExpanded, setUserExpanded] = useState(false);
  const completedNotifiedRef = useRef(false);

  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev !== 'complete' && status === 'complete') {
      setShowSuccess(true);
      const t = setTimeout(() => {
        setShowSuccess(false);
        if (!completedNotifiedRef.current) {
          completedNotifiedRef.current = true;
          onPartComplete?.(part.partId);
        }
      }, SUCCESS_DELAY_MS);
      prevStatusRef.current = status;
      return () => clearTimeout(t);
    }
    prevStatusRef.current = status;
  }, [status, part.partId, onPartComplete]);

  if (status === 'locked') {
    const prevNum = Math.max(1, part.partNumber - 1);
    return (
      <article
        ref={ref}
        className="part-card part-card--locked"
        data-part-id={part.partId}
        data-part-status="locked"
      >
        <div className="part-card-header">
          <div className="min-w-0">
            <p className={`part-card-label lv-${level}`}>Parte {part.partNumber}</p>
            <PartHeading title={part.partTitle} subtitle={part.partSubtitle} locked />
          </div>
          <div className="part-stage-dots">
            <StageDot filled={false} level={level} />
            <StageDot filled={false} level={level} />
            <StageDot filled={false} level={level} />
          </div>
        </div>
        <p className="part-card-lock-msg">
          Completa la Parte {prevNum} para desbloquear.
        </p>
      </article>
    );
  }

  if (status === 'complete' && !showSuccess) {
    const expanded = userExpanded;
    return (
      <article
        ref={ref}
        className="part-card part-card--complete"
        data-part-id={part.partId}
        data-part-status="complete"
      >
        <button
          type="button"
          onClick={() => setUserExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-3 text-left border-0 bg-transparent p-0 cursor-pointer"
          aria-expanded={expanded}
        >
          <div className="min-w-0 flex items-center gap-2">
            <span
              aria-hidden
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--green)] text-white text-sm font-bold"
            >
              ✓
            </span>
            <div className="min-w-0">
              <p className={`part-card-label lv-${level}`}>Parte {part.partNumber}</p>
              <PartHeading
                title={part.partTitle}
                subtitle={part.partSubtitle}
                titleClassName="part-card-title done"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="part-hours-pill part-hours-pill--green">
              {part.totalHours.toFixed(1)}h verificadas
            </span>
            <span className="text-[var(--gray-500)] text-xs">{expanded ? '▲' : '▼'}</span>
          </div>
        </button>

        {expanded && (
          <div className="mt-4 space-y-3 border-t border-[var(--gray-200)] pt-3 text-sm">
            {stages.video && (
              <PartStageVideo item={stages.video} level={level} onVerified={() => {}} />
            )}
            {stages.task && (
              <ReadOnlyStage
                label="Tarea"
                prompt={stages.task.taskPrompt}
                body={completions[stages.task.itemKey]?.evidence_text || 'Sin evidencia guardada.'}
              />
            )}
            {stages.reflection && (
              <ReadOnlyStage
                label="Reflexión"
                prompt={stages.reflection.reflectionPrompt}
                body={
                  completions[stages.reflection.itemKey]?.evidence_text ||
                  'Sin reflexión guardada.'
                }
              />
            )}
          </div>
        )}
      </article>
    );
  }

  const primaryTool = part.primaryTools[0];
  const primaryToolMeta = primaryTool ? getToolMetaByName(primaryTool) : null;

  return (
    <article
      ref={ref}
      className={`part-card part-card--active lv-${level}`}
      data-part-id={part.partId}
      data-part-status={status}
    >
      <header className="part-card-header">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`part-card-label lv-${level}`}>Parte {part.partNumber}</p>
            {part.collaborative && (
              <span className="text-[10px] font-bold text-[var(--teal)]">🤝 Colaborativo</span>
            )}
            <span className="part-hours-pill">{part.totalHours.toFixed(1)}h</span>
          </div>
          <PartHeading title={part.partTitle} subtitle={part.partSubtitle} />
        </div>
        <div
          className="part-stage-dots"
          aria-label={`Progreso ${verifiedCount} de 3 etapas`}
        >
          {[0, 1, 2].map((i) => (
            <StageDot
              key={i}
              filled={verifiedCount > i}
              active={activeDotIndex === i && verifiedCount === i}
              level={level}
            />
          ))}
        </div>
      </header>

      {primaryTool && (
        <EducatorPerkBanner
          toolName={primaryTool}
          toolIcon={primaryToolMeta?.icon}
          toolUrl={primaryToolMeta?.url}
        />
      )}

      <div className="pt-4">
        {showSuccess ? (
          <SuccessPanel partNumber={part.partNumber} hours={part.totalHours} />
        ) : (
          <ActiveStage
            videoS={videoS}
            taskS={taskS}
            reflS={reflS}
            stages={stages}
            level={level}
            collaborative={part.collaborative}
          />
        )}
      </div>
    </article>
  );
});

function ActiveStage({
  videoS,
  taskS,
  reflS,
  stages,
  level,
  collaborative,
}: {
  videoS: StageStatus;
  taskS: StageStatus;
  reflS: StageStatus;
  stages: PartGroup['stages'];
  level: 'b' | 'i' | 'a';
  collaborative: boolean;
}) {
  const noop = () => {};

  const videoReference =
    stages.video && videoS === 'verified' ? (
      <div className="mb-5 border-b border-[var(--line-soft)] pb-5">
        <PartStageVideo item={stages.video} level={level} onVerified={noop} />
      </div>
    ) : null;

  if (videoS !== 'verified' && stages.video) {
    return <PartStageVideo item={stages.video} level={level} onVerified={noop} />;
  }
  if (taskS !== 'verified' && stages.task) {
    return (
      <>
        {videoReference}
        <PartStageTask item={stages.task} collaborative={collaborative} onVerified={noop} />
      </>
    );
  }
  if (reflS !== 'verified' && stages.reflection) {
    return (
      <>
        {videoReference}
        <PartStageReflection item={stages.reflection} onVerified={noop} />
      </>
    );
  }
  return null;
}

function SuccessPanel({ partNumber, hours }: { partNumber: number; hours: number }) {
  return (
    <div role="status" className="score-panel score-panel--pass text-center py-6">
      <div className="text-3xl">✅</div>
      <p className="font-condensed text-lg font-extrabold mt-1 text-[var(--green)]">
        Parte {partNumber} completada
      </p>
      <p className="text-xs text-[var(--gray-700)] mt-1">
        {hours.toFixed(1)}h verificadas
      </p>
    </div>
  );
}

function ReadOnlyStage({
  label,
  prompt,
  body,
}: {
  label: string;
  prompt?: string;
  body: string;
}) {
  return (
    <section>
      <p className="stage-label">{label}</p>
      {prompt && (
        <p className="text-xs italic text-[var(--gray-600)] mt-0.5 whitespace-pre-wrap">
          {prompt}
        </p>
      )}
      <p className="text-sm text-[var(--gray-800)] mt-1 whitespace-pre-wrap">{body}</p>
    </section>
  );
}
