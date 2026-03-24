export type MetadataSectionId =
  | 'highlights'
  | 'gps'
  | 'exif'
  | 'iptc'
  | 'xmp'
  | 'icc'
  | 'file'
  | 'other';

export type SelectiveRemovalKey =
  | 'gps'
  | 'camera'
  | 'timestamps'
  | 'software'
  | 'copyright'
  | 'xmp';

export type FileKind = 'jpeg' | 'png' | 'webp' | 'heic' | 'tiff' | 'gif' | 'unknown';

export interface MetadataField {
  id: string;
  section: MetadataSectionId;
  sectionLabel: string;
  label: string;
  value: string;
  copyValue: string;
  isHighlighted: boolean;
}

export interface MetadataSection {
  id: MetadataSectionId;
  label: string;
  fields: MetadataField[];
}

export interface ParsedMetadata {
  sections: MetadataSection[];
  totalFields: number;
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  availableSelectiveKeys: SelectiveRemovalKey[];
}

export interface CleanedAsset {
  blob: Blob;
  url: string;
  fileName: string;
  metadata: ParsedMetadata;
  removedCount: number;
  removedBytes: number;
  sizeDelta: number;
  mode: 'all' | 'selective';
  note?: string;
}

export interface ManagedFile {
  id: string;
  file: File;
  kind: FileKind;
  previewUrl: string;
  previewNote?: string;
  metadata?: ParsedMetadata;
  cleaned?: CleanedAsset;
  selectiveKeys: SelectiveRemovalKey[];
  status: 'loading' | 'ready' | 'processing' | 'error';
  error?: string;
  expiresAt: number;
}

export interface PremiumState {
  active: boolean;
  expiresAt: number | null;
}
