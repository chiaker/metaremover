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
        'group relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-2xl shadow-blue-950/20 backdrop-blur',
        'transition-all duration-200',
        isDragActive ? 'border-blue-400/80 bg-blue-500/10 ring-2 ring-blue-400/40' : 'hover:border-blue-400/50 hover:bg-slate-900/80',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
      ].join(' ')}
    >
      <input {...getInputProps()} />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_50%)]" />
      <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-medium tracking-[0.18em] text-blue-200 uppercase">
            <Shield className="h-4 w-4" />
            Privacy First
          </div>
          <div className="space-y-3">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Remove image metadata directly in your browser.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Your files never leave your device. Drop JPG, PNG, WebP, HEIC or TIFF images, inspect EXIF/IPTC/XMP/GPS
              tags and export stripped copies locally.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={open}
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed"
            >
              <FolderOpen className="h-4 w-4" />
              Select files
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm text-slate-300">
              <Upload className="h-4 w-4" />
              Drag and drop up to 5 files free
            </div>
          </div>
        </div>
        <div className="grid gap-3 text-sm text-slate-300">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Client-side only</div>
            <div className="mt-2 text-base font-semibold text-white">100% browser processing</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">GDPR-friendly</div>
            <div className="mt-2 text-base font-semibold text-white">No server uploads</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Free limits</div>
            <div className="mt-2 text-base font-semibold text-white">5 files / 20 MB each</div>
          </div>
        </div>
      </div>
    </div>
  );
}
