import ExifReader from 'exifreader';
import piexif from 'piexifjs';

import { createCleanFileName, detectFileKind } from './fileTypes';
import { convertHeicToJpeg, convertTiffToPng } from './heicHelper';
import type { FileKind, MetadataField, MetadataSection, ParsedMetadata, SelectiveRemovalKey } from '../types/app';

const SECTION_ORDER: Array<{ id: MetadataSection['id']; label: string; groups: string[] }> = [
  { id: 'gps', label: 'GPS', groups: ['gps'] },
  { id: 'exif', label: 'EXIF', groups: ['exif', 'composite', 'makerNotes'] },
  { id: 'iptc', label: 'IPTC', groups: ['iptc', 'photoshop'] },
  { id: 'xmp', label: 'XMP', groups: ['xmp'] },
  { id: 'icc', label: 'ICC', groups: ['icc'] },
  { id: 'file', label: 'File', groups: ['file', 'pngFile', 'png', 'pngText', 'riff', 'gif', 'jfif'] },
];

const HIGHLIGHT_LABELS = new Set([
  'Latitude',
  'Longitude',
  'DateTimeOriginal',
  'DateTime',
  'Make',
  'Model',
  'LensModel',
  'LensMake',
  'Software',
  'Orientation',
  'Copyright',
]);

const CAMERA_TAGS = new Set([
  'Make',
  'Model',
  'LensModel',
  'LensMake',
  'FNumber',
  'ExposureTime',
  'FocalLength',
  'ISOSpeedRatings',
  'PhotographicSensitivity',
  'BodySerialNumber',
  'LensSerialNumber',
]);

const TIMESTAMP_TAGS = new Set([
  'DateTime',
  'DateTimeOriginal',
  'DateTimeDigitized',
  'SubSecTime',
  'SubSecTimeOriginal',
  'SubSecTimeDigitized',
  'OffsetTime',
  'OffsetTimeOriginal',
  'OffsetTimeDigitized',
  'GPSDateStamp',
  'GPSTimeStamp',
]);

const SOFTWARE_TAGS = new Set(['Software', 'ProcessingSoftware', 'HostComputer']);
const COPYRIGHT_TAGS = new Set(['Copyright', 'Artist']);

type PiexifObject = {
  '0th': Record<string, unknown>;
  Exif: Record<string, unknown>;
  GPS: Record<string, unknown>;
  Interop: Record<string, unknown>;
  '1st': Record<string, unknown>;
  thumbnail: unknown;
};

function toDisplayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => toDisplayValue(item)).join(', ');
  }

  if (value instanceof Uint8Array) {
    return `Binary (${value.byteLength} bytes)`;
  }

  if (typeof value === 'object') {
    const maybeTag = value as { description?: string; value?: unknown };

    if (typeof maybeTag.description === 'string' && maybeTag.description.trim()) {
      return maybeTag.description;
    }

    if (maybeTag.value !== undefined) {
      return toDisplayValue(maybeTag.value);
    }

    return JSON.stringify(value);
  }

  return String(value);
}

function normalizeCopyValue(value: unknown): string {
  return toDisplayValue(value).replace(/\s+/g, ' ').trim();
}

function flattenGroupFields(sectionId: MetadataSection['id'], sectionLabel: string, groupName: string, groupValue: unknown): MetadataField[] {
  if (!groupValue || typeof groupValue !== 'object') {
    return [];
  }

  return Object.entries(groupValue as Record<string, unknown>)
    .filter(([key]) => key !== '_raw' && key !== 'image' && key !== 'base64')
    .map(([key, value]) => {
      const displayValue = toDisplayValue(value);

      return {
        id: `${groupName}-${key}`,
        section: sectionId,
        sectionLabel,
        label: key,
        value: displayValue,
        copyValue: normalizeCopyValue(value),
        isHighlighted: HIGHLIGHT_LABELS.has(key),
      };
    })
    .filter((field) => field.value);
}

function buildSections(expandedTags: Record<string, unknown>): MetadataSection[] {
  const sections: MetadataSection[] = SECTION_ORDER.map(({ id, label, groups }) => {
    const fields = groups.flatMap((group) => flattenGroupFields(id, label, group, expandedTags[group]));
    return { id, label, fields };
  }).filter((section) => section.fields.length > 0);

  const usedGroups = new Set(SECTION_ORDER.flatMap((section) => section.groups));
  const otherFields = Object.entries(expandedTags)
    .filter(([group]) => !usedGroups.has(group) && group !== 'Thumbnail')
    .flatMap(([group, groupValue]) => flattenGroupFields('other', 'Other', group, groupValue));

  if (otherFields.length > 0) {
    sections.push({ id: 'other', label: 'Other', fields: otherFields });
  }

  const highlights = sections.flatMap((section) => section.fields.filter((field) => field.isHighlighted));

  if (highlights.length > 0) {
    sections.unshift({
      id: 'highlights',
      label: 'Key Fields',
      fields: highlights,
    });
  }

  return sections;
}

function getAvailableSelectiveKeys(sections: MetadataSection[], expandedTags: Record<string, unknown>): SelectiveRemovalKey[] {
  const allFields = sections.flatMap((section) => section.fields);
  const labels = new Set(allFields.map((field) => field.label));
  const keys: SelectiveRemovalKey[] = [];

  if ((expandedTags.gps as { Latitude?: number } | undefined)?.Latitude !== undefined) {
    keys.push('gps');
  }

  if ([...CAMERA_TAGS].some((tag) => labels.has(tag))) {
    keys.push('camera');
  }

  if ([...TIMESTAMP_TAGS].some((tag) => labels.has(tag))) {
    keys.push('timestamps');
  }

  if ([...SOFTWARE_TAGS].some((tag) => labels.has(tag))) {
    keys.push('software');
  }

  if ([...COPYRIGHT_TAGS].some((tag) => labels.has(tag))) {
    keys.push('copyright');
  }

  if ((expandedTags.xmp as Record<string, unknown> | undefined)?._raw) {
    keys.push('xmp');
  }

  return keys;
}

export async function readMetadata(blob: Blob): Promise<ParsedMetadata> {
  const buffer = await blob.arrayBuffer();
  const expandedTags = (await ExifReader.load(buffer, {
    async: true,
    expanded: true,
  })) as Record<string, unknown>;

  const sections = buildSections(expandedTags);
  const gpsTags = expandedTags.gps as { Latitude?: number; Longitude?: number; Altitude?: number } | undefined;

  return {
    sections,
    totalFields: sections.filter((section) => section.id !== 'highlights').reduce((sum, section) => sum + section.fields.length, 0),
    gps:
      gpsTags?.Latitude !== undefined && gpsTags.Longitude !== undefined
        ? {
            latitude: gpsTags.Latitude,
            longitude: gpsTags.Longitude,
            altitude: gpsTags.Altitude,
          }
        : undefined,
    availableSelectiveKeys: getAvailableSelectiveKeys(sections, expandedTags),
  };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Не удалось прочитать файл в браузере.'));
    reader.readAsDataURL(blob);
  });
}

function binaryStringToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index) & 0xff;
  }

  return bytes;
}

function combineChunks(chunks: Uint8Array[]): Uint8Array {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.length;
  });

  return result;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function startsWithAscii(bytes: Uint8Array, value: string): boolean {
  if (bytes.length < value.length) {
    return false;
  }

  for (let index = 0; index < value.length; index += 1) {
    if (bytes[index] !== value.charCodeAt(index)) {
      return false;
    }
  }

  return true;
}

function createApp1ExifSegment(exifObject: PiexifObject | null): Uint8Array | null {
  if (!exifObject) {
    return null;
  }

  const hasPayload =
    Object.keys(exifObject['0th']).length > 0 ||
    Object.keys(exifObject.Exif).length > 0 ||
    Object.keys(exifObject.GPS).length > 0 ||
    Object.keys(exifObject.Interop).length > 0;

  if (!hasPayload) {
    return null;
  }

  const exifString = piexif.dump(exifObject);
  const exifBytes = binaryStringToBytes(exifString);
  const length = exifBytes.length + 2;
  const segment = new Uint8Array(exifBytes.length + 4);
  segment[0] = 0xff;
  segment[1] = 0xe1;
  segment[2] = (length >> 8) & 0xff;
  segment[3] = length & 0xff;
  segment.set(exifBytes, 4);
  return segment;
}

function stripJpegMetadataSegments(
  bytes: Uint8Array,
  options: {
    exifSegment?: Uint8Array | null;
    removeXmp: boolean;
    removeIptc: boolean;
    removeComments: boolean;
  },
): Uint8Array {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new Error('Файл не выглядит как JPEG.');
  }

  const keptSegments: Uint8Array[] = [];
  let scanData = bytes.slice(2);
  let offset = 2;

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      scanData = bytes.slice(offset);
      break;
    }

    const marker = bytes[offset + 1];

    if (marker === 0xda) {
      scanData = bytes.slice(offset);
      break;
    }

    if (marker === 0xd9) {
      scanData = bytes.slice(offset);
      break;
    }

    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      keptSegments.push(bytes.slice(offset, offset + 2));
      offset += 2;
      continue;
    }

    const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
    const end = offset + 2 + length;
    const segment = bytes.slice(offset, end);
    const payload = segment.slice(4);

    const isExif = marker === 0xe1 && startsWithAscii(payload, 'Exif');
    const isXmp =
      marker === 0xe1 &&
      (startsWithAscii(payload, 'http://ns.adobe.com/xap/1.0/') ||
        startsWithAscii(payload, 'http://ns.adobe.com/xmp/extension/'));
    const isIptc = marker === 0xed && startsWithAscii(payload, 'Photoshop 3.0');
    const isComment = marker === 0xfe;

    if (
      isExif ||
      (options.removeXmp && isXmp) ||
      (options.removeIptc && isIptc) ||
      (options.removeComments && isComment)
    ) {
      offset = end;
      continue;
    }

    keptSegments.push(segment);
    offset = end;
  }

  const chunks: Uint8Array[] = [bytes.slice(0, 2)];
  const startsWithApp0 = keptSegments[0]?.[1] === 0xe0;

  if (startsWithApp0) {
    chunks.push(keptSegments[0]);
  }

  if (options.exifSegment) {
    chunks.push(options.exifSegment);
  }

  keptSegments.slice(startsWithApp0 ? 1 : 0).forEach((segment) => {
    chunks.push(segment);
  });

  chunks.push(scanData);

  return combineChunks(chunks);
}

function createEmptyExifObject(): PiexifObject {
  return {
    '0th': {},
    Exif: {},
    GPS: {},
    Interop: {},
    '1st': {},
    thumbnail: null,
  };
}

function loadPiexifObject(dataUrl: string): PiexifObject {
  try {
    return piexif.load(dataUrl) as PiexifObject;
  } catch {
    return createEmptyExifObject();
  }
}

function pruneExifObject(exifObject: PiexifObject, selectiveKeys: SelectiveRemovalKey[]): PiexifObject {
  const nextObject = structuredClone(exifObject) as PiexifObject;
  const orientationKey = String(piexif.ImageIFD.Orientation);
  const orientationValue = nextObject['0th'][orientationKey];

  if (selectiveKeys.length === 0) {
    const result = createEmptyExifObject();

    if (orientationValue !== undefined) {
      result['0th'][orientationKey] = orientationValue;
    }

    return result;
  }

  if (selectiveKeys.includes('gps')) {
    nextObject.GPS = {};
  }

  if (selectiveKeys.includes('camera')) {
    [
      piexif.ImageIFD.Make,
      piexif.ImageIFD.Model,
      piexif.ExifIFD.LensMake,
      piexif.ExifIFD.LensModel,
      piexif.ExifIFD.FNumber,
      piexif.ExifIFD.FocalLength,
      piexif.ExifIFD.ExposureTime,
      piexif.ExifIFD.ISOSpeedRatings,
      piexif.ExifIFD.BodySerialNumber,
      piexif.ExifIFD.LensSerialNumber,
      piexif.ExifIFD.CameraOwnerName,
      piexif.ExifIFD.PhotographicSensitivity,
    ].forEach((tag) => {
      delete nextObject['0th'][String(tag)];
      delete nextObject.Exif[String(tag)];
    });
  }

  if (selectiveKeys.includes('timestamps')) {
    [
      piexif.ImageIFD.DateTime,
      piexif.ExifIFD.DateTimeOriginal,
      piexif.ExifIFD.DateTimeDigitized,
      piexif.ExifIFD.OffsetTime,
      piexif.ExifIFD.OffsetTimeOriginal,
      piexif.ExifIFD.OffsetTimeDigitized,
      piexif.ExifIFD.SubSecTime,
      piexif.ExifIFD.SubSecTimeOriginal,
      piexif.ExifIFD.SubSecTimeDigitized,
      piexif.GPSIFD.GPSDateStamp,
      piexif.GPSIFD.GPSTimeStamp,
    ].forEach((tag) => {
      delete nextObject['0th'][String(tag)];
      delete nextObject.Exif[String(tag)];
      delete nextObject.GPS[String(tag)];
    });
  }

  if (selectiveKeys.includes('software')) {
    [piexif.ImageIFD.Software, piexif.ImageIFD.HostComputer, piexif.ImageIFD.ProcessingSoftware].forEach((tag) => {
      delete nextObject['0th'][String(tag)];
    });
  }

  if (selectiveKeys.includes('copyright')) {
    [piexif.ImageIFD.Copyright, piexif.ImageIFD.Artist].forEach((tag) => {
      delete nextObject['0th'][String(tag)];
    });
  }

  if (orientationValue !== undefined) {
    nextObject['0th'][orientationKey] = orientationValue;
  }

  nextObject['1st'] = {};
  nextObject.thumbnail = null;

  return nextObject;
}

async function rasterBlobToCanvas(blob: Blob): Promise<HTMLCanvasElement> {
  const imageUrl = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Не удалось декодировать изображение для очистки.'));
      element.src = imageUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Браузер не дал 2D-контекст для очистки изображения.');
    }

    context.drawImage(image, 0, 0);
    return canvas;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

async function stripRasterMetadata(file: File, outputType: string): Promise<{ blob: Blob; note?: string }> {
  const canvas = await rasterBlobToCanvas(file);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outputType, outputType === 'image/jpeg' ? 0.92 : undefined);
  });

  if (!blob) {
    throw new Error('Не удалось получить очищенный файл.');
  }

  return { blob };
}

async function stripJpegMetadata(file: File, selectiveKeys: SelectiveRemovalKey[]): Promise<{ blob: Blob; note?: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const dataUrl = await blobToDataUrl(file);
  const exifObject = loadPiexifObject(dataUrl);
  const filteredExifObject = pruneExifObject(exifObject, selectiveKeys);
  const exifSegment = createApp1ExifSegment(filteredExifObject);
  const cleanedBytes = stripJpegMetadataSegments(bytes, {
    exifSegment,
    removeXmp: selectiveKeys.length === 0 || selectiveKeys.includes('xmp'),
    removeIptc: selectiveKeys.length === 0 || selectiveKeys.includes('copyright'),
    removeComments: true,
  });

  return {
    blob: new Blob([toArrayBuffer(cleanedBytes)], { type: 'image/jpeg' }),
  };
}

async function buildCleanBlob(file: File, kind: FileKind, selectiveKeys: SelectiveRemovalKey[]): Promise<{ blob: Blob; note?: string }> {
  if (kind === 'jpeg') {
    return stripJpegMetadata(file, selectiveKeys);
  }

  if (selectiveKeys.length > 0) {
    throw new Error('Selective removal сейчас работает только для JPEG/JPG, остальные форматы очищаются целиком.');
  }

  if (kind === 'heic') {
    return convertHeicToJpeg(file);
  }

  if (kind === 'tiff') {
    return convertTiffToPng(file);
  }

  if (kind === 'png') {
    return stripRasterMetadata(file, 'image/png');
  }

  if (kind === 'webp') {
    return stripRasterMetadata(file, 'image/webp');
  }

  if (kind === 'gif') {
    const raster = await stripRasterMetadata(file, 'image/png');
    return {
      ...raster,
      note: 'GIF сохраняется как PNG после очистки, потому что браузерный canvas не экспортирует GIF.',
    };
  }

  throw new Error('Этот формат пока нельзя очистить локально в текущем браузере.');
}

export async function cleanMetadata(
  file: File,
  options: {
    selectiveKeys: SelectiveRemovalKey[];
    preserveOriginalName: boolean;
  },
): Promise<{
  blob: Blob;
  fileName: string;
  metadata: ParsedMetadata;
  removedCount: number;
  removedBytes: number;
  sizeDelta: number;
  note?: string;
}> {
  const kind = detectFileKind(file);
  const beforeMetadata = await readMetadata(file);
  const { blob, note } = await buildCleanBlob(file, kind, options.selectiveKeys);
  const afterMetadata = await readMetadata(blob).catch(
    () =>
      ({
        sections: [],
        totalFields: 0,
        availableSelectiveKeys: [],
      }) satisfies ParsedMetadata,
  );

  return {
    blob,
    fileName: createCleanFileName(file.name, options.preserveOriginalName, blob.type || file.type || 'image/jpeg'),
    metadata: afterMetadata,
    removedCount: Math.max(0, beforeMetadata.totalFields - afterMetadata.totalFields),
    removedBytes: Math.max(0, file.size - blob.size),
    sizeDelta: blob.size - file.size,
    note,
  };
}
