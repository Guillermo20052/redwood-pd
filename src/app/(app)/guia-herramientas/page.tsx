'use client';

import { useMemo, useState } from 'react';
import { Fraunces } from 'next/font/google';
import { ToolGuideCard } from '@/components/ToolGuideCard';
import {
  TOOL_LEVEL_FILTERS,
  TOOLS_GUIDE,
  type ToolLevel,
} from '@/lib/tools-guide';

const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['italic'],
  variable: '--font-fraunces',
});

type LevelFilter = 'all' | ToolLevel;

export default function GuiaHerramientasPage() {
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [search, setSearch] = useState('');

  const filteredTools = useMemo(() => {
    const query = search.trim().toLowerCase();
    return TOOLS_GUIDE.filter((tool) => {
      const matchesLevel = levelFilter === 'all' || tool.level === levelFilter;
      const matchesSearch =
        !query ||
        tool.name.toLowerCase().includes(query) ||
        tool.vendor.toLowerCase().includes(query);
      return matchesLevel && matchesSearch;
    });
  }, [levelFilter, search]);

  return (
    <div className={`app-page tool-guide-page ${fraunces.variable}`}>
      <header className="level-hero lh-b tool-guide-hero">
        <div className="level-hero-tag">Referencia · 15 herramientas IA</div>
        <h2>Guía de Herramientas</h2>
        <p>
          Cuándo usar cada una, cuándo NO, y un ejemplo concreto para tu clase.
        </p>
      </header>

      <div className="tool-guide-controls">
        <div
          className="tool-guide-filter-bar"
          role="tablist"
          aria-label="Filtrar por nivel"
        >
          {TOOL_LEVEL_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              role="tab"
              aria-selected={levelFilter === filter.id}
              className={`tool-guide-filter-btn ${
                levelFilter === filter.id ? 'tool-guide-filter-btn--active' : ''
              }`}
              onClick={() => setLevelFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <label className="tool-guide-search">
          <span className="sr-only">Buscar herramienta</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar herramienta…"
            className="tool-guide-search-input"
          />
        </label>
      </div>

      <p className="tool-guide-results-count" aria-live="polite">
        {filteredTools.length === TOOLS_GUIDE.length
          ? `${TOOLS_GUIDE.length} herramientas`
          : `${filteredTools.length} de ${TOOLS_GUIDE.length} herramientas`}
      </p>

      {filteredTools.length > 0 ? (
        <div className="tool-guide-grid">
          {filteredTools.map((tool) => (
            <ToolGuideCard key={tool.name} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="tool-guide-empty card-elevation">
          <p>No hay herramientas que coincidan con tu búsqueda.</p>
          <button
            type="button"
            className="tool-guide-clear-btn"
            onClick={() => {
              setSearch('');
              setLevelFilter('all');
            }}
          >
            Ver todas
          </button>
        </div>
      )}
    </div>
  );
}
