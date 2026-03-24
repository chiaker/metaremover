import { MessageSquare, Shield, Upload, FolderOpen } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

import { DROPZONE_ACCEPT } from '../lib/fileTypes';

type FileDropZoneProps = {
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
};

export function FileDropZone({ disabled = false, onFilesSelected }: FileDropZoneProps) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: DROPZONE_ACCEPT,
    disabled,
    multiple: true,
    noClick: true,
    onDrop: (acceptedFiles) => onFilesSelected(acceptedFiles),
  });

  return (
    <div
      {...getRootProps()}
      className={[
        'group relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white/70 p-8 shadow-sm backdrop-blur-sm dark:border-[#3d322c]/55 dark:bg-[#231c18]/92',
        'transition-colors duration-200',
        isDragActive
          ? 'border-rose-300/80 bg-rose-50/50 ring-1 ring-rose-200/60 dark:border-rose-400/30 dark:bg-rose-950/25 dark:ring-rose-500/20'
          : 'hover:border-stone-300 hover:bg-white/90 dark:hover:border-[#4a3f38]/60 dark:hover:bg-[#2a221c]/95',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      ].join(' ')}
    >
      <input {...getInputProps()} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,207,232,0.35),transparent)] dark:hidden" />
      <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/90 bg-amber-50/90 px-3 py-1 text-xs font-medium tracking-[0.18em] text-amber-950 uppercase dark:border-amber-800/45 dark:bg-[#3a2e26]/90 dark:text-amber-100">
            <Shield className="h-4 w-4 text-amber-800 dark:text-amber-300" />
            Privacy First
          </div>
          <div className="space-y-3">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-stone-800 sm:text-5xl dark:text-stone-100">
              Anonymize your photos. Delete spy data before you share.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-stone-600 sm:text-lg dark:text-stone-400">
              Strip hidden GPS, camera info, and other tracking data from JPG, PNG, WebP, HEIC and TIFF. Your files never
              leave your device—clean copies download straight from your browser.
            </p>
            <div className="flex max-w-2xl gap-3 rounded-2xl border border-amber-200/85 bg-amber-50/60 p-4 text-sm leading-6 text-stone-700 dark:border-amber-800/45 dark:bg-[#3a2e26]/55 dark:text-amber-50/95">
              <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-amber-800 dark:text-amber-400" strokeWidth={2} />
              <p>
                <span className="font-semibold text-stone-900 dark:text-stone-100">iMessage does not remove metadata</span>
                {' '}
                from the photos you send—location, camera, and other hidden fields can still travel with the image. Clean
                copies here first when you need to share without that data.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={open}
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-full bg-stone-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed dark:bg-stone-200 dark:text-stone-900 dark:hover:bg-white"
            >
              <FolderOpen className="h-4 w-4" />
              Select files
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-600 dark:border-stone-600/60 dark:bg-stone-900/40 dark:text-stone-400">
              <Upload className="h-4 w-4 text-stone-500 dark:text-stone-500" />
              Drag and drop up to 5 files free
            </div>
          </div>
        </div>
        <div className="grid gap-3 text-sm text-stone-600 dark:text-stone-400">
          <div className="rounded-2xl border border-stone-200/90 bg-stone-50/60 p-4 dark:border-stone-600/40 dark:bg-stone-900/35">
            <div className="text-xs uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500">Client-side only</div>
            <div className="mt-2 text-base font-semibold text-stone-800 dark:text-stone-100">Runs only in your browser</div>
          </div>
          <div className="rounded-2xl border border-stone-200/90 bg-stone-50/60 p-4 dark:border-stone-600/40 dark:bg-stone-900/35">
            <div className="text-xs uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500">GDPR-friendly</div>
            <div className="mt-2 text-base font-semibold text-stone-800 dark:text-stone-100">No server uploads</div>
          </div>
          <div className="rounded-2xl border border-stone-200/90 bg-stone-50/60 p-4 dark:border-stone-600/40 dark:bg-stone-900/35">
            <div className="text-xs uppercase tracking-[0.18em] text-stone-500 dark:text-stone-500">Free limits</div>
            <div className="mt-2 text-base font-semibold text-stone-800 dark:text-stone-100">5 files / 20 MB each</div>
          </div>
        </div>
      </div>
    </div>
  );
}
