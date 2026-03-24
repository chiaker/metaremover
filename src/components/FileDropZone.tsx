import { Shield, Upload, FolderOpen } from 'lucide-react';
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
        'group relative overflow-hidden rounded-3xl border border-stone-200/90 bg-white/70 p-8 shadow-sm backdrop-blur-sm dark:border-stone-600/40 dark:bg-stone-800/55',
        'transition-colors duration-200',
        isDragActive
          ? 'border-rose-300/80 bg-rose-50/50 ring-1 ring-rose-200/60 dark:border-rose-400/30 dark:bg-rose-950/25 dark:ring-rose-500/20'
          : 'hover:border-stone-300 hover:bg-white/90 dark:hover:border-stone-500/50 dark:hover:bg-stone-800/70',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      ].join(' ')}
    >
      <input {...getInputProps()} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,207,232,0.35),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(244,114,182,0.12),transparent)]" />
      <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-100/80 px-3 py-1 text-xs font-medium tracking-[0.18em] text-violet-800 uppercase dark:border-violet-500/25 dark:bg-violet-950/40 dark:text-violet-200">
            <Shield className="h-4 w-4 text-violet-600 dark:text-violet-300" />
            Privacy First
          </div>
          <div className="space-y-3">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-stone-800 sm:text-5xl dark:text-stone-100">
              Remove image metadata directly in your browser.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-stone-600 sm:text-lg dark:text-stone-400">
              Your files never leave your device. Drop JPG, PNG, WebP, HEIC or TIFF images, inspect EXIF/IPTC/XMP/GPS
              tags and export stripped copies locally.
            </p>
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
            <div className="mt-2 text-base font-semibold text-stone-800 dark:text-stone-100">100% browser processing</div>
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
