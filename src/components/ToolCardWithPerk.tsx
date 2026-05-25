'use client';

import { useState } from 'react';
import type { SectionTool } from '@/lib/content';
import { getEducatorPerk } from '@/lib/educator-perks';
import { EducatorPerkBadge } from './EducatorPerkBadge';
import { EducatorPerkModal } from './EducatorPerkModal';

type Props = {
  tool: SectionTool;
};

export function ToolCardWithPerk({ tool }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const perk = getEducatorPerk(tool.name);

  if (!perk) {
    return (
      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        className="tool-crd no-underline"
      >
        <div className="tool-icon">{tool.icon}</div>
        <div className="tool-name">{tool.name}</div>
        <div className="tool-desc">{tool.desc}</div>
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="tool-crd tool-crd--clickable"
      >
        <div className="tool-icon">{tool.icon}</div>
        <div className="tool-name">{tool.name}</div>
        <div className="tool-desc">{tool.desc}</div>
        <EducatorPerkBadge perk={perk} />
      </button>

      <EducatorPerkModal
        toolName={tool.name}
        toolIcon={tool.icon}
        toolUrl={tool.url}
        toolDesc={tool.desc}
        perk={perk}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
