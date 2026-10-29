// SPDX-License-Identifier: GPL-3.0-or-later
// Offline adapter for GitAscii's actual canvas converter. The original photo stays local.
import { createCanvas, Image, loadImage } from '@napi-rs/canvas';
import { readFile, writeFile } from 'node:fs/promises';
import { convertImageToAsciiCanvas } from './vendor/gitascii/converter.ts';

const source = process.argv[2];
if (!source) throw new Error('Pass the exact local portrait path.');
const photo = await loadImage(await readFile(source));
console.log(`Portrait decoded: ${photo.width} x ${photo.height}`);
// Tight square head-and-shoulders crop, with EXIF orientation handled by the decoder.
const square = Math.min(photo.width, photo.height) * 0.76;
const crop = createCanvas(800, 800);
crop.getContext('2d').drawImage(photo, (photo.width-square)/2, photo.height*0.04,
  square, square, 0, 0, 800, 800);
globalThis.window = {};
globalThis.document = { createElement: () => createCanvas(1, 1) };
globalThis.Image = Image;
const result = await convertImageToAsciiCanvas(crop.toDataURL('image/png'), {
  cols: 120, rows: 66, charset: 'standard', invert: true,
  contrast: 20, gamma: 0.95, autoContrast: true, dithering: false,
});
await writeFile(new URL('../assets/portrait-ascii.json', import.meta.url),
  JSON.stringify({ generator: 'GitAscii canvas converter', cols: result.cols, rows: result.rows, lines: result.lines })+'\n');
console.log('Saved ASCII only; the original photograph is not copied into the repository.');
