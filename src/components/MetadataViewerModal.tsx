import { X, MapPin, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

import type { ManagedFile } from '../types/app';
import { MapViewer } from './MapViewer';
import { MetadataTable } from './MetadataTable';

type MetadataViewerModalProps = {
  file: ManagedFile | null;
  onClose: () => void;
};

export function MetadataViewerModal({ file, onClose }: MetadataViewerModalProps) {
  useEffect(() => {
    if (!file) {
      return undefined;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [file, onClose]);

  if (!file || !file.metadata) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/30 p-4 backdrop-blur-[2px] dark:bg-stone-950/50">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-stone-200/90 bg-white shadow-lg shadow-stone-300/40 dark:border-stone-600/50 dark:bg-stone-800/95 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-6 border-b border-stone-200/80 px-6 py-5 dark:border-stone-600/50">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500">Metadata Viewer</div>
            <h2 className="text-2xl font-semibold text-stone-800 dark:text-stone-100">{file.file.name}</h2>
            <div className="flex flex-wrap gap-3 text-sm text-stone-500 dark:text-stone-400">
              <span>{file.metadata.totalFields} tags detected</span>
              {file.cleaned && <span>{file.cleaned.metadata.totalFields} tags after cleanup</span>}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-stone-200 p-3 text-stone-600 transition hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-88px)] gap-0 overflow-y-auto lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="space-y-5 border-b border-stone-200/80 p-6 lg:border-r lg:border-b-0 dark:border-stone-600/50">
            <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-stone-50/50 dark:border-stone-600/40 dark:bg-stone-900/40">
              <img src={file.previewUrl} alt={file.file.name} className="aspect-square w-full object-cover" />
            </div>

            {file.cleaned && (
              <div className="rounded-2xl border border-teal-200/90 bg-teal-50/50 p-4 dark:border-teal-800/40 dark:bg-teal-950/30">
                <div className="flex items-center gap-2 text-sm font-semibold text-teal-900 dark:text-teal-200">
                  Before / After
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="mt-3 grid gap-3 text-sm text-stone-700 sm:grid-cols-2 dark:text-stone-300">
                  <div className="rounded-2xl border border-stone-200/80 bg-white/80 p-3 dark:border-stone-600/50 dark:bg-stone-800/60">
                    <div className="text-xs uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500">Before</div>
                    <div className="mt-2 text-base font-semibold text-stone-800 dark:text-stone-100">{file.metadata.totalFields} tags</div>
                  </div>
                  <div className="rounded-2xl border border-stone-200/80 bg-white/80 p-3 dark:border-stone-600/50 dark:bg-stone-800/60">
                    <div className="text-xs uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500">After</div>
                    <div className="mt-2 text-base font-semibold text-stone-800 dark:text-stone-100">{file.cleaned.metadata.totalFields} tags</div>
                  </div>
                </div>
              </div>
            )}

            {file.metadata.gps && (
              <div className="space-y-3 rounded-2xl border border-stone-200/90 bg-stone-50/50 p-4 dark:border-stone-600/40 dark:bg-stone-900/35">
                <div className="flex items-center gap-2 text-sm font-semibold text-stone-800 dark:text-stone-100">
                  <MapPin className="h-4 w-4 text-rose-400 dark:text-rose-300" />
                  GPS Location
                </div>
                <div className="text-sm text-stone-600 dark:text-stone-400">
                  {file.metadata.gps.latitude.toFixed(6)}, {file.metadata.gps.longitude.toFixed(6)}
                </div>
                <MapViewer latitude={file.metadata.gps.latitude} longitude={file.metadata.gps.longitude} />
              </div>
            )}

            {file.cleaned?.note && (
              <div className="rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 text-sm leading-6 text-stone-600 dark:border-stone-600/40 dark:bg-stone-900/30 dark:text-stone-400">
                {file.cleaned.note}
              </div>
            )}
          </aside>

          <div className="p-6">
            <MetadataTable sections={file.cleaned ? file.cleaned.metadata.sections : file.metadata.sections} />
          </div>
        </div>
      </div>
    </div>
  );
}
