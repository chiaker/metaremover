declare module 'piexifjs' {
  const piexif: any;
  export default piexif;
}

declare module 'utif' {
  const UTIF: {
    decode(buffer: ArrayBuffer): unknown[];
    decodeImage(buffer: ArrayBuffer, ifd: unknown): void;
    toRGBA8(ifd: unknown): Uint8Array;
  };

  export default UTIF;
}
