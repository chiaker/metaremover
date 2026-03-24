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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl shadow-black/30">
        <div className="flex items-start justify-between gap-6 border-b border-white/10 px-6 py-5">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Metadata Viewer</div>
            <h2 className="text-2xl font-semibold text-white">{file.file.name}</h2>
            <div className="flex flex-wrap gap-3 text-sm text-slate-400">
              <span>{file.metadata.totalFields} tags detected</span>
              {file.cleaned && <span>{file.cleaned.metadata.totalFields} tags after cleanup</span>}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-white/10 p-3 text-slate-300 transition hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid max-h-[calc(92vh-88px)] gap-0 overflow-y-auto lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="space-y-5 border-b border-white/10 p-6 lg:border-r lg:border-b-0">
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/40">
              <img src={file.previewUrl} alt={file.file.name} className="aspect-square w-full object-cover" />
            </div>

            {file.cleaned && (
              <div className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-200">
                  Before / After
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div className="mt-3 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Before</div>
                    <div className="mt-2 text-base font-semibold text-white">{file.metadata.totalFields} tags</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">After</div>
                    <div className="mt-2 text-base font-semibold text-white">{file.cleaned.metadata.totalFields} tags</div>
                  </div>
                </div>
              </div>
            )}

            {file.metadata.gps && (
              <div className="space-y-3 rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <MapPin className="h-4 w-4 text-blue-300" />
                  GPS Location
                </div>
                <div className="text-sm text-slate-300">
                  {file.metadata.gps.latitude.toFixed(6)}, {file.metadata.gps.longitude.toFixed(6)}
                </div>
                <MapViewer latitude={file.metadata.gps.latitude} longitude={file.metadata.gps.longitude} />
              </div>
            )}

            {file.cleaned?.note && (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
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
