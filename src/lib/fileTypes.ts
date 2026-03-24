import type { FileKind } from '../types/app';

export const MAX_FREE_FILES = 5;
export const MAX_FREE_FILE_SIZE = 20 * 1024 * 1024;
export const AUTO_CLEAR_MS = 10 * 60 * 1000;

export const DROPZONE_ACCEPT: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic', '.heif'],
  'image/heif': ['.heic', '.heif'],
  'image/tiff': ['.tif', '.tiff'],
  'image/gif': ['.gif'],
};

const EXTENSION_KIND_MAP: Record<string, FileKind> = {
  jpg: 'jpeg',
  jpeg: 'jpeg',
  png: 'png',
  webp: 'webp',
  heic: 'heic',
  heif: 'heic',
  tif: 'tiff',
  tiff: 'tiff',
  gif: 'gif',
};

const MIME_KIND_MAP: Record<string, FileKind> = {
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heic',
  'image/tiff': 'tiff',
  'image/gif': 'gif',
};

export function getFileExtension(name: string): string {
  const parts = name.toLowerCase().split('.');
  return parts.length > 1 ? parts.at(-1) ?? '' : '';
}

export function detectFileKind(file: File): FileKind {
  const extension = getFileExtension(file.name);
  return MIME_KIND_MAP[file.type] ?? EXTENSION_KIND_MAP[extension] ?? 'unknown';
}

export function isSupportedImage(file: File): boolean {
  return detectFileKind(file) !== 'unknown';
}

export async function materializeFile(file: File): Promise<File> {
  let buffer: ArrayBuffer;

  try {
    buffer = await file.arrayBuffer();
  } catch (cause) {
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const hint = isMobile ? ' На телефоне откройте фото через приложение «Файлы» или выберите снимок заново.' : '';
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Не удалось прочитать файл.${hint} (${detail})`);
  }

  return new File([buffer], file.name, {
    type: file.type || 'application/octet-stream',
    lastModified: file.lastModified,
  });
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

export function createCleanFileName(name: string, preserveOriginalName: boolean, outputType: string): string {
  const dotIndex = name.lastIndexOf('.');
  const baseName = dotIndex > 0 ? name.slice(0, dotIndex) : name;
  const finalBaseName = preserveOriginalName ? baseName : `${baseName}_metaremover_cleaned`;
  const extension = getExtensionFromMime(outputType) || (dotIndex > 0 ? name.slice(dotIndex + 1) : 'jpg');
  return `${finalBaseName}.${extension}`;
}

export function getExtensionFromMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return '';
  }
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function formatExpiry(expiresAt: number): string {
  const minutes = Math.max(0, Math.round((expiresAt - Date.now()) / 60000));
  return `${minutes} min`;
}

export function formatSignedBytes(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }

  const sign = bytes > 0 ? '-' : '+';
  return `${sign}${formatBytes(Math.abs(bytes))}`;
}
