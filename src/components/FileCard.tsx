import { Download, Eye, Image as ImageIcon, LoaderCircle, Lock, Sparkles, Trash2 } from 'lucide-react';

import type { ManagedFile, SelectiveRemovalKey } from '../types/app';

const LABELS: Record<SelectiveRemovalKey, string> = {
  gps: 'GPS',
  camera: 'Camera info',
  timestamps: 'Timestamps',
  software: 'Software',
  copyright: 'Copyright',
  xmp: 'XMP',
};

type FileCardProps = {
  file: ManagedFile;
  premiumActive: boolean;
  onOpenViewer: () => void;
  onRemoveAll: () => void;
  onSelectiveRemove: () => void;
  onToggleSelectiveKey: (key: SelectiveRemovalKey) => void;
  onDownload: () => void;
  onDelete: () => void;
  onPremiumAttempt: () => void;
};

export function FileCard({
  file,
  premiumActive,
  onOpenViewer,
  onRemoveAll,
  onSelectiveRemove,
  onToggleSelectiveKey,
  onDownload,
  onDelete,
  onPremiumAttempt,
}: FileCardProps) {
  const availableSelective = file.metadata?.availableSelectiveKeys ?? [];
  const canRemoveTagsCount = file.cleaned ? file.cleaned.removedCount : (file.metadata?.totalFields ?? 0);

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/75 shadow-lg shadow-slate-950/30">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-white/10 bg-slate-950">
        <img src={file.previewUrl} alt={file.file.name} className="h-full w-full object-cover" />
        <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-200">
          {file.kind.toUpperCase()}
        </div>
        <button
          type="button"
          onClick={onOpenViewer}
          className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/85 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
        >
          <Eye className="h-4 w-4" />
          View metadata
        </button>
      </div>

      <div className="space-y-5 p-5">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold text-white">{file.file.name}</h3>
              <p className="text-sm text-slate-400">{file.metadata ? `${file.metadata.totalFields} tags found` : 'Metadata loading...'}</p>
            </div>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/10 p-2 text-slate-400 transition hover:bg-white/8 hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
            {file.error
              ? file.error
              : file.status === 'loading'
                ? 'Reading metadata and building preview...'
                : file.status === 'processing'
                  ? 'Removing metadata in browser...'
                  : file.previewNote || 'Ready for inspection and export.'}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onRemoveAll}
            disabled={file.status === 'loading' || file.status === 'processing'}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {file.status === 'processing' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Remove All Metadata
          </button>
          <button
            type="button"
            onClick={onOpenViewer}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
          >
            <ImageIcon className="h-4 w-4" />
            Open Viewer
          </button>
        </div>

        <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Selective removal</div>
              <div className="text-xs text-slate-400">Premium only. JPEG gets field-level EXIF cleanup.</div>
            </div>
            {!premiumActive && (
              <div className="inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
                <Lock className="h-3.5 w-3.5" />
                Premium
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(LABELS) as SelectiveRemovalKey[]).map((key) => {
              const canUseKey = availableSelective.includes(key);
              const enabled = premiumActive ? canUseKey : true;

              return (
                <label
                  key={key}
                  onClick={() => {
                    if (!premiumActive) {
                      onPremiumAttempt();
                    }
                  }}
                  className={[
                    'flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition',
                    enabled ? 'border-white/10 bg-white/[0.03] text-slate-200' : 'border-white/6 bg-white/[0.02] text-slate-500',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={file.selectiveKeys.includes(key)}
                    disabled={premiumActive ? !canUseKey : false}
                    onChange={() => {
                      if (!premiumActive) {
                        onPremiumAttempt();
                        return;
                      }

                      onToggleSelectiveKey(key);
                    }}
                    className="h-4 w-4 rounded border-white/20 bg-transparent text-blue-400"
                  />
                  <span>{LABELS[key]}</span>
                </label>
              );
            })}
          </div>

          <button
            type="button"
            disabled={file.status === 'loading' || file.status === 'processing' || (premiumActive && file.selectiveKeys.length === 0)}
            onClick={() => {
              if (!premiumActive) {
                onPremiumAttempt();
                return;
              }

              onSelectiveRemove();
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Run selective removal
          </button>
        </div>

        {file.metadata && (
          <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300 sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Can remove tags</div>
              <div className="mt-2 font-medium text-white">{canRemoveTagsCount}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Removed tags</div>
              <div className="mt-2 font-medium text-emerald-300">{file.cleaned?.removedCount ?? 0}</div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onDownload}
          disabled={!file.cleaned}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Download Cleaned
        </button>
      </div>
    </article>
  );
}
