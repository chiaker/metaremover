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
    <article className="overflow-hidden rounded-3xl border border-stone-200/90 bg-white/80 shadow-sm backdrop-blur-sm dark:border-stone-600/40 dark:bg-stone-800/55">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-stone-200/80 bg-stone-100 dark:border-stone-600/40 dark:bg-stone-900/50">
        {file.status === 'loading' ? (
          <div className="relative flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-stone-100 via-rose-50/40 to-teal-50/30 dark:bg-[#1e1916]">
            <div className="pointer-events-none absolute inset-0 animate-pulse bg-rose-100/20 dark:bg-amber-950/20" aria-hidden />
            <div className="relative flex flex-col items-center gap-3 px-6">
              <div className="relative flex items-center justify-center">
                <div className="absolute h-14 w-14 animate-pulse rounded-full bg-rose-200/40 dark:bg-amber-900/25" aria-hidden />
                <LoaderCircle className="relative h-11 w-11 animate-spin text-rose-400/90 dark:text-amber-400/85" strokeWidth={2} />
              </div>
              <p className="text-center text-sm font-medium text-stone-700 dark:text-stone-300">Working on your file…</p>
              {file.kind === 'heic' ? (
                <p className="max-w-[240px] text-center text-xs leading-relaxed text-stone-500 dark:text-stone-500">
                  HEIC images can take a little while — everything runs on your device.
                </p>
              ) : (
                <p className="text-center text-xs text-stone-500 dark:text-stone-500">Reading and preparing preview…</p>
              )}
            </div>
          </div>
        ) : (
          <img src={file.previewUrl} alt={file.file.name} className="h-full w-full object-cover" />
        )}
        <div className="absolute left-4 top-4 rounded-full border border-stone-200/90 bg-white/90 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-stone-600 backdrop-blur-sm dark:border-stone-600/60 dark:bg-stone-800/85 dark:text-stone-300">
          {file.kind.toUpperCase()}
        </div>
        <button
          type="button"
          onClick={onOpenViewer}
          disabled={file.status === 'loading'}
          className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-stone-200/90 bg-white/90 px-3 py-2 text-xs font-semibold text-stone-800 backdrop-blur-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-stone-600/60 dark:bg-stone-800/85 dark:text-stone-100 dark:hover:bg-stone-700/90"
        >
          <Eye className="h-4 w-4" />
          See hidden data
        </button>
      </div>

      <div className="space-y-5 p-5">
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-semibold text-stone-800 dark:text-stone-100">{file.file.name}</h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">{file.metadata ? `${file.metadata.totalFields} hidden details found` : 'Loading photo details…'}</p>
            </div>
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-stone-200 p-2 text-stone-500 transition hover:border-stone-300 hover:bg-stone-50 hover:text-stone-800 dark:border-stone-600 dark:text-stone-400 dark:hover:border-stone-500 dark:hover:bg-stone-700/50 dark:hover:text-stone-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-stone-200/80 bg-stone-50/50 px-4 py-3 text-sm text-stone-600 dark:border-stone-600/40 dark:bg-stone-900/35 dark:text-stone-400">
            {file.status === 'loading' && <LoaderCircle className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-rose-400 dark:text-rose-300/80" />}
            <span>
              {file.error
                ? file.error
                : file.status === 'loading'
                  ? 'Scanning your photo for hidden data…'
                  : file.status === 'processing'
                    ? 'Deleting spy data on your device…'
                    : file.previewNote || 'Ready for inspection and export.'}
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onRemoveAll}
            disabled={file.status === 'loading' || file.status === 'processing'}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-white"
          >
            {file.status === 'processing' || file.status === 'loading' ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Remove all hidden data
          </button>
          <button
            type="button"
            onClick={onOpenViewer}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800/60 dark:text-stone-100 dark:hover:bg-stone-700/70"
          >
            <ImageIcon className="h-4 w-4" />
            Open Viewer
          </button>
        </div>

        <div className="space-y-3 rounded-2xl border border-stone-200/80 bg-teal-50/30 p-4 dark:border-teal-800/30 dark:bg-teal-950/25">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-stone-800 dark:text-stone-100">Pick what to delete</div>
              <div className="text-xs text-stone-500 dark:text-stone-400">Premium only—choose GPS, camera info, and more (JPEG).</div>
            </div>
            {!premiumActive && (
              <div className="inline-flex items-center gap-1 rounded-full border border-amber-200/90 bg-amber-100/80 px-3 py-1 text-xs font-medium text-amber-900 dark:border-amber-700/40 dark:bg-amber-950/50 dark:text-amber-200">
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
                    enabled
                      ? 'border-stone-200/90 bg-white/80 text-stone-700 dark:border-stone-600/50 dark:bg-stone-900/40 dark:text-stone-300'
                      : 'border-stone-100 bg-stone-50/50 text-stone-400 dark:border-stone-800 dark:bg-stone-900/20 dark:text-stone-600',
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
                    className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-300 dark:border-stone-600 dark:text-amber-400 dark:focus:ring-amber-700/45"
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
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-teal-200/90 bg-teal-100/60 px-4 py-3 text-sm font-semibold text-teal-900 transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-teal-700/40 dark:bg-teal-900/35 dark:text-teal-100 dark:hover:bg-teal-900/50"
          >
            Remove selected hidden data
          </button>
        </div>

        {file.metadata && (
          <div className="grid gap-3 rounded-2xl border border-stone-200/80 bg-stone-50/40 p-4 text-sm text-stone-600 sm:grid-cols-2 dark:border-stone-600/40 dark:bg-stone-900/30 dark:text-stone-400">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500">Can remove</div>
              <div className="mt-2 font-medium text-stone-800 dark:text-stone-100">{canRemoveTagsCount}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500">Already stripped</div>
              <div className="mt-2 font-medium text-teal-700 dark:text-teal-300">{file.cleaned?.removedCount ?? 0}</div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onDownload}
          disabled={!file.cleaned}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-600 dark:bg-stone-800/60 dark:text-stone-100 dark:hover:bg-stone-700/70"
        >
          <Download className="h-4 w-4" />
          Download Cleaned
        </button>
      </div>
    </article>
  );
}
