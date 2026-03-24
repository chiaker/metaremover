import heic2any from 'heic2any';
import UTIF from 'utif';

import type { FileKind } from '../types/app';

type PreviewResult = {
  blob: Blob;
  note?: string;
};

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });

  if (!blob) {
    throw new Error('Не удалось подготовить изображение для браузерной обработки.');
  }

  return blob;
}

export async function convertHeicToJpeg(file: File): Promise<PreviewResult> {
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  });

  const blob = Array.isArray(converted) ? converted[0] : converted;

  if (!blob) {
    throw new Error('HEIC/HEIF не удалось преобразовать в браузере.');
  }

  return {
    blob,
    note: 'HEIC превью и очистка отдаются как JPEG для стабильного скачивания в браузере.',
  };
}

export async function convertTiffToPng(file: File): Promise<PreviewResult> {
  const buffer = await file.arrayBuffer();
  const ifds = UTIF.decode(buffer);

  if (!ifds.length) {
    throw new Error('TIFF не содержит декодируемых кадров.');
  }

  UTIF.decodeImage(buffer, ifds[0]);
  const firstFrame = ifds[0];
  const rgba = UTIF.toRGBA8(firstFrame);
  const width = Number((firstFrame as { width?: number }).width ?? 0);
  const height = Number((firstFrame as { height?: number }).height ?? 0);

  if (!width || !height) {
    throw new Error('Не удалось определить размер TIFF-изображения.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Браузер не дал 2D-контекст для TIFF.');
  }

  const imageData = new ImageData(new Uint8ClampedArray(rgba), width, height);
  context.putImageData(imageData, 0, 0);

  return {
    blob: await canvasToBlob(canvas, 'image/png'),
    note: 'TIFF превью и очистка отдаются как PNG, потому что браузеры редко умеют сохранять TIFF без метаданных напрямую.',
  };
}

export async function createPreviewAsset(file: File, kind: FileKind): Promise<PreviewResult> {
  if (kind === 'heic') {
    return convertHeicToJpeg(file);
  }

  if (kind === 'tiff') {
    return convertTiffToPng(file);
  }

  return { blob: file };
}
