'use client';

import { useEffect, useState } from 'react';
import { getEducatorPerk } from '@/lib/educator-perks';
import { EducatorPerkModal } from './EducatorPerkModal';

type Props = {
  toolName: string;
  toolIcon?: string;
  toolUrl?: string;
};

function dismissKey(toolName: string): string {
  return `educator-perk-banner-dismissed:${toolName.trim().toLowerCase()}`;
}

export function EducatorPerkBanner({ toolName, toolIcon = '🔧', toolUrl = '#' }: Props) {
  const perk = getEducatorPerk(toolName);
  const [dismissed, setDismissed] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!perk) return;
    try {
      setDismissed(sessionStorage.getItem(dismissKey(toolName)) === '1');
    } catch {
      setDismissed(false);
    }
  }, [toolName, perk]);

  if (!perk || dismissed) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(dismissKey(toolName), '1');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  return (
    <>
      <div className="educator-perk-banner" role="note">
        <p className="educator-perk-banner-text">
          💡 <strong>{toolName}</strong> es gratuita para docentes — {perk.shortNote}.{' '}
          <button type="button" className="educator-perk-banner-link" onClick={() => setModalOpen(true)}>
            Más info →
          </button>
        </p>
        <button
          type="button"
          className="educator-perk-banner-close"
          onClick={dismiss}
          aria-label="Cerrar aviso"
        >
          ×
        </button>
      </div>

      <EducatorPerkModal
        toolName={toolName}
        toolIcon={toolIcon}
        toolUrl={toolUrl}
        toolDesc=""
        perk={perk}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
