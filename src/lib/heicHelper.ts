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
    throw new Error('Could not prepare this image in your browser.');
  }

  return blob;
}

async function heic2anyOnce(blob: Blob, toType: 'image/jpeg' | 'image/png', quality?: number): Promise<Blob> {
  const converted = await heic2any({
    blob,
    toType,
    quality: toType === 'image/jpeg' ? quality ?? 0.92 : undefined,
  });
  const out = Array.isArray(converted) ? converted[0] : converted;
  if (!out) {
    throw new Error('HEIC conversion returned an empty result.');
  }
  return out;
}

async function imageBlobToJpeg(blob: Blob, quality: number): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Could not display this image while converting it.'));
      element.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Your browser blocked image drawing for this file.');
    }

    context.drawImage(image, 0, 0);
    return canvasToBlob(canvas, 'image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function convertHeicWithLibheif(file: File): Promise<Blob> {
  const decodeModule = await import('heic-decode');
  const decodeHeic = decodeModule.default;
  const buffer = await file.arrayBuffer();
  const { width, height, data } = await decodeHeic({ buffer: new Uint8Array(buffer) });

  if (!width || !height) {
    throw new Error('This HEIC file has an invalid image size.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Your browser blocked image drawing for this file.');
  }

  const rgba = new Uint8ClampedArray(data.length);
  rgba.set(data);
  context.putImageData(new ImageData(rgba, width, height), 0, 0);
  return canvasToBlob(canvas, 'image/jpeg', 0.92);
}

export async function convertHeicToJpeg(file: File): Promise<PreviewResult> {
  try {
    const blob = await heic2anyOnce(file, 'image/jpeg', 0.92);
    return { blob };
  } catch {
    /* try next path */
  }

  try {
    const pngBlob = await heic2anyOnce(file, 'image/png');
    const jpegBlob = await imageBlobToJpeg(pngBlob, 0.92);
    return { blob: jpegBlob };
  } catch {
    /* try next path */
  }

  try {
    const blob = await convertHeicWithLibheif(file);
    return { blob };
  } catch {
    /* fall through */
  }

  throw new Error(
    'This HEIC file could not be opened here. Export it as JPEG or PNG from your Photos app or editor, then upload that file instead.',
  );
}

export async function convertTiffToPng(file: File): Promise<PreviewResult> {
  const buffer = await file.arrayBuffer();
  const ifds = UTIF.decode(buffer);

  if (!ifds.length) {
    throw new Error('This TIFF file does not contain a readable image.');
  }

  UTIF.decodeImage(buffer, ifds[0]);
  const firstFrame = ifds[0];
  const rgba = UTIF.toRGBA8(firstFrame);
  const width = Number((firstFrame as { width?: number }).width ?? 0);
  const height = Number((firstFrame as { height?: number }).height ?? 0);

  if (!width || !height) {
    throw new Error('Could not read the size of this TIFF image.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Your browser blocked image drawing for this file.');
  }

  const imageData = new ImageData(new Uint8ClampedArray(rgba), width, height);
  context.putImageData(imageData, 0, 0);

  return {
    blob: await canvasToBlob(canvas, 'image/png'),
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
