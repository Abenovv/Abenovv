// SPDX-License-Identifier: GPL-3.0-or-later
// Offline adapter for GitAscii's actual canvas converter and a faithful photograph crop.
// Only resizing/framing is applied to the photograph; no face synthesis or retouching.
import { createCanvas, Image, loadImage } from '@napi-rs/canvas';
import { readFile, writeFile } from 'node:fs/promises';
import { convertImageToAsciiCanvas } from './vendor/gitascii/converter.ts';

const source = process.argv[2];
if (!source) throw new Error('Pass the exact local portrait path.');
const photo = await loadImage(await readFile(source));
console.log(`Portrait decoded: ${photo.width} x ${photo.height}`);
// EXIF is handled by the decoder. Keep the entire hairline, face and upper suit.
const headshot = createCanvas(480, 600);
const ctx = headshot.getContext('2d');
ctx.fillStyle = '#0d1729';
ctx.fillRect(0, 0, 480, 600);
ctx.save();
ctx.beginPath();
ctx.roundRect(7, 7, 466, 586, 14);
ctx.clip();
const headshotW = photo.width * 0.66;
const headshotH = headshotW * 586 / 466;
const headshotX = photo.width * 0.21;
const headshotY = photo.height * 0.035;
ctx.drawImage(photo, headshotX, headshotY, headshotW, headshotH, 7, 7, 466, 586);
ctx.restore();
ctx.strokeStyle = '#2c527f';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.roundRect(6.5, 6.5, 467, 587, 14);
ctx.stroke();
await writeFile(new URL('../assets/portrait-photo.jpg', import.meta.url),headshot.toBuffer('image/jpeg',88));
// Keep GitAscii available as a secondary accent, rather than the primary photo.
const square = Math.min(photo.width, photo.height) * 0.66;
const crop = createCanvas(800, 800);
crop.getContext('2d').drawImage(photo, photo.width*0.21, photo.height*0.035,
  square, square, 0, 0, 800, 800);
globalThis.window = {};
globalThis.document = { createElement: () => createCanvas(1, 1) };
globalThis.Image = Image;
const result = await convertImageToAsciiCanvas(crop.toDataURL('image/png'), {
  cols: 96, rows: 52, charset: 'standard', invert: true,
  contrast: 14, gamma: 1.05, autoContrast: true, dithering: false,
});
await writeFile(new URL('../assets/portrait-ascii.json', import.meta.url),
  JSON.stringify({ generator: 'GitAscii canvas converter', cols: result.cols, rows: result.rows, lines: result.lines })+'\n');
const escapeXml=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const art=result.lines.map((line,index)=>`<text x="16" y="${(16+(index+0.82)*288/result.rows).toFixed(2)}" xml:space="preserve" font-size="${(288/result.rows*0.94).toFixed(2)}" textLength="288" lengthAdjust="spacingAndGlyphs">${escapeXml(line)}</text>`).join('');
const blue=`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320" role="img"><title>Yerkebulan Abenov, blue ASCII portrait</title><rect x=".5" y=".5" width="319" height="319" rx="14" fill="#081321" stroke="#23496f"/><g fill="#78c9ff" font-family="Consolas,DejaVu Sans Mono,monospace">${art}</g></svg>`;
await writeFile(new URL('../assets/portrait-blue.svg', import.meta.url),blue+'\n');
console.log('Saved faithful headshot and derived ASCII; the original photograph stays local.');
