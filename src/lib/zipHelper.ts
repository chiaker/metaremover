import JSZip from 'jszip';

export async function buildZipArchive(files: Array<{ name: string; blob: Blob }>): Promise<Blob> {
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.name, file.blob);
  });

  return zip.generateAsync({ type: 'blob' });
}
