import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import toIco from 'to-ico';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const svgPath = join(root, 'public', 'favicon.svg');
const svg = readFileSync(svgPath);

const sizes = [16, 32, 48];
const pngBuffers = [];

for (const size of sizes) {
  const buf = await sharp(svg).resize(size, size).png().toBuffer();
  pngBuffers.push(buf);
  writeFileSync(join(root, 'public', `favicon-${size}.png`), buf);
}

writeFileSync(join(root, 'public', 'favicon.ico'), await toIco(pngBuffers));
await sharp(svg).resize(180, 180).png().toFile(join(root, 'public', 'apple-touch-icon.png'));

console.log('Wrote favicon.ico, favicon-16/32/48.png, apple-touch-icon.png');
