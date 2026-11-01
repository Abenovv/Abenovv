// SPDX-License-Identifier: GPL-3.0-or-later
// Offline GitAscii adapter: preserve the entire supplied photograph and its proportions.
import {createCanvas,Image,loadImage} from '@napi-rs/canvas';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {convertImageToAsciiCanvas} from './vendor/gitascii/converter.ts';
const source=process.argv[2];if(!source)throw Error('Pass the exact local source photograph path.');
const bytes=await readFile(source),photo=await loadImage(bytes);
const width=photo.width*2,height=photo.height*2,cols=300,rows=Math.min(300,Math.round(cols*.5*photo.height/photo.width));
const square=createCanvas(height,height);square.getContext('2d').drawImage(photo,0,0,height,height);
globalThis.window={};globalThis.document={createElement:()=>createCanvas(1,1)};globalThis.Image=Image;
const converted=await convertImageToAsciiCanvas(square.toDataURL('image/png'),{cols,rows,charset:'dense',contrast:6,brightness:6,gamma:2.2,autoContrast:true,dithering:false,invert:false});
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const glyphs=converted.lines.map((line,i)=>`<text x="0" y="${((i+.82)*height/rows).toFixed(3)}" textLength="${width}" lengthAdjust="spacing" xml:space="preserve">${esc(line)}</text>`).join('');
const art=`<g font-family="Consolas,DejaVu Sans Mono,monospace" font-size="${(height/rows*.9567).toFixed(1)}" font-weight="600" fill="#87caff">${glyphs}</g>`;
const prefix=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>Yerkebulan Abenov, complete supplied portrait in blue ASCII</title><rect width="${width}" height="${height}" fill="#0d1117"/>`;
const root=new URL('../assets/',import.meta.url);
await writeFile(new URL('portrait-full.svg',root),prefix+art+'</svg>');
await writeFile(new URL('portrait-full-motion.svg',root),prefix+`<defs><linearGradient id="shine" x1="0" y1="0" x2="0" y2="1"><stop stop-color="white" stop-opacity="0"/><stop offset=".5" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="code-sweep" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><rect y="-160" width="${width}" height="160" fill="url(#shine)"><animate attributeName="y" from="-160" to="${height}" begin=".2s" dur="2.8s" repeatCount="1" fill="freeze"/></rect></mask></defs>${art}<g mask="url(#code-sweep)">${art.replace('#87caff','#d8ecff')}</g></svg>`);
const {Resvg}=await import('@resvg/resvg-js');
await writeFile(new URL('portrait-full.png',root),new Resvg(prefix+art+'</svg>',{fitTo:{mode:'width',value:width*5},font:{loadSystemFonts:true}}).render().asPng());
await writeFile(new URL('portrait-proof.json',root),JSON.stringify({sourceHash:createHash('sha256').update(bytes).digest('hex'),sourceWidth:photo.width,sourceHeight:photo.height,crop:{x:0,y:0,width:photo.width,height:photo.height},outputWidth:width*5,outputHeight:height*5,cols,rows,lines:converted.lines},null,2));
console.log('Saved complete photograph composition as static and animated ASCII; original source stays local.');
