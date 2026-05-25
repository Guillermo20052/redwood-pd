'use client';

type EducatorPerk = {
  type: string;
  title: string;
  description: string;
  link: string;
  ctaLabel: string;
};

type Props = {
  perk: EducatorPerk;
  className?: string;
};

export function EducatorPerkBadge({ perk, className = '' }: Props) {
  return (
    <span className={`educator-perk-badge ${className}`.trim()} title={perk.title}>
      ✨ Beneficio para docentes
    </span>
  );
}
