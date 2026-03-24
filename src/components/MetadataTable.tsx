import { Copy, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { MetadataSection } from '../types/app';

type MetadataTableProps = {
  sections: MetadataSection[];
};

export function MetadataTable({ sections }: MetadataTableProps) {
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return sections;
    }

    return sections
      .map((section) => ({
        ...section,
        fields: section.fields.filter(
          (field) =>
            field.label.toLowerCase().includes(normalizedQuery) || field.value.toLowerCase().includes(normalizedQuery),
        ),
      }))
      .filter((section) => section.fields.length > 0);
  }, [query, sections]);

  async function handleCopy(id: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1400);
  }

  return (
    <div className="space-y-5">
      <label className="flex items-center gap-3 rounded-2xl border border-stone-200/90 bg-stone-50/80 px-4 py-3 dark:border-stone-600/50 dark:bg-stone-900/40">
        <Search className="h-4 w-4 text-stone-400 dark:text-stone-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tags or values"
          className="w-full bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400 dark:text-stone-200 dark:placeholder:text-stone-500"
        />
      </label>

      <div className="space-y-4">
        {filteredSections.map((section) => (
          <section key={section.id} className="rounded-2xl border border-stone-200/90 bg-stone-50/50 p-4 dark:border-stone-600/40 dark:bg-stone-900/30">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-600 dark:text-stone-400">{section.label}</h3>
              <span className="text-xs text-stone-500 dark:text-stone-500">{section.fields.length} tags</span>
            </div>
            <div className="grid gap-2">
              {section.fields.map((field) => (
                <div
                  key={field.id}
                  className={[
                    'grid gap-2 rounded-2xl border px-3 py-3 md:grid-cols-[0.8fr_1.2fr_auto] md:items-center',
                    field.isHighlighted
                      ? 'border-amber-200/90 bg-amber-50/60 dark:border-amber-800/35 dark:bg-[#3a2e26]/75'
                      : 'border-stone-200/70 bg-white/70 dark:border-stone-600/40 dark:bg-stone-800/40',
                  ].join(' ')}
                >
                  <div className="text-sm font-medium text-stone-800 dark:text-stone-100">{field.label}</div>
                  <div className="min-w-0 break-words text-sm text-stone-600 dark:text-stone-400">{field.value}</div>
                  <button
                    type="button"
                    onClick={() => handleCopy(field.id, field.copyValue)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800/70 dark:text-stone-200 dark:hover:bg-stone-700/70"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copiedId === field.id ? 'Copied' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}

        {filteredSections.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 px-4 py-8 text-center text-sm text-stone-500 dark:border-stone-600 dark:bg-stone-900/25 dark:text-stone-500">
            No metadata fields match your search.
          </div>
        )}
      </div>
    </div>
  );
}
