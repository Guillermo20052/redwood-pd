'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { levels } from '@/lib/content';
import { LevelWorkspace } from '@/components/LevelWorkspace';

export default function NivelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const level = levels.find((l) => l.slug === slug);

  if (!level) notFound();

  return <LevelWorkspace key={slug} slug={slug} />;
}
