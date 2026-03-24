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
      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tags or values"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        />
      </label>

      <div className="space-y-4">
        {filteredSections.map((section) => (
          <section key={section.id} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">{section.label}</h3>
              <span className="text-xs text-slate-500">{section.fields.length} tags</span>
            </div>
            <div className="grid gap-2">
              {section.fields.map((field) => (
                <div
                  key={field.id}
                  className={[
                    'grid gap-2 rounded-2xl border px-3 py-3 md:grid-cols-[0.8fr_1.2fr_auto] md:items-center',
                    field.isHighlighted ? 'border-blue-400/30 bg-blue-500/10' : 'border-white/6 bg-white/[0.03]',
                  ].join(' ')}
                >
                  <div className="text-sm font-medium text-white">{field.label}</div>
                  <div className="min-w-0 break-words text-sm text-slate-300">{field.value}</div>
                  <button
                    type="button"
                    onClick={() => handleCopy(field.id, field.copyValue)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/8"
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
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-8 text-center text-sm text-slate-400">
            No metadata fields match your search.
          </div>
        )}
      </div>
    </div>
  );
}
