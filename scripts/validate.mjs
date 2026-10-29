// SPDX-License-Identifier: GPL-3.0-or-later
import {readFile,access} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {aggregateLanguages,validateCalendar} from './data.mjs';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const data=JSON.parse(await read('assets/profile-data.json'));
assert.deepEqual(validateCalendar(data.contributions.days),data.calendar);
assert.equal(data.contributions.totalContributions,data.calendar.total);
assert.equal(data.user.public_repos,data.repositories.length);
assert.deepEqual(data.languages,aggregateLanguages(data.repositories));
const readme=await read('README.md');
for(const image of readme.matchAll(/<img\b([^>]*?)\/?\s*>/g)) {
  assert(/\balt="[^"]*"/.test(image[1]),'Every image needs alt text or an explicit empty decorative alt');
  if(/portrait[^"?]*\.(?:png|jpe?g|webp)/i.test(image[1]))
    assert(/\balt="[^"]*Yerkebulan[^"]*"/i.test(image[1]),'Real portrait needs an identifying accessible label');
}
const nativeText=readme.replace(/<!--[\s\S]*?-->/g,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');
assert(/<h1\b|^#\s/m.test(readme),'Identity must use a native heading, not an image alone');
assert(/Yerkebulan\s+Abenov/i.test(nativeText),'Readable name is missing');
assert(nativeText.split(' ').length>=60,'Profile needs readable personal/project text outside images');
assert.equal((readme.match(/<details\b/g)||[]).length,(readme.match(/<\/details>/g)||[]).length,'Unbalanced expandable sections');
assert.equal((readme.match(/<summary\b/g)||[]).length,(readme.match(/<details\b/g)||[]).length,'Every expandable section needs a summary');
let refs=0;
let portraits=0;
for(const m of readme.matchAll(/(?:src|srcset)="(assets\/[^"]+)"/g)) {
  const url=new URL(m[1],root);
  assert(url.pathname.startsWith(new URL('assets/',root).pathname),'Image reference escapes the asset directory');
  const bytes=await readFile(url);refs++;
  if(/portrait[^/]*\.(?:png|jpe?g|webp)$/i.test(url.pathname)) portraits++;
  if(/\/assets\/(?:portrait|dashboard|intro|motion|contribution-)/i.test(url.pathname))
    assert(url.searchParams.has('v'),`Generated image needs a content version: ${url.pathname}`);
  if(url.searchParams.has('v')) {
    const contents=url.pathname.endsWith('.svg')?bytes.toString('utf8').replace(/\r\n/g,'\n'):bytes;
    assert.equal(url.searchParams.get('v'),createHash('sha256').update(contents).digest('hex').slice(0,12),`Cached image version does not match ${url.pathname}`);
  }
}
assert(refs>=8,'Expected portrait, icons, project preview, activity and motion assets');
assert(portraits>0,'A real portrait image must be embedded; ASCII alone does not satisfy the requested portrait');
for(const m of readme.matchAll(/href="(assets\/[^"]+)"/g)) await access(new URL(m[1],root));
const svgPaths=new Set(Array.from(readme.matchAll(/(?:src|srcset)="(assets\/[^"?]+\.svg)(?:\?[^"]*)?"/g),m=>m[1]));
for(const path of svgPaths) {
  const svg=await read(path);
  assert(svg.includes('<svg')&&svg.includes('</svg>'),`${path}: malformed SVG`);
  assert(!/<script|foreignObject|@import|\son\w+=/i.test(svg),`${path}: unsupported SVG content`);
  assert(!/(?:href|src)="https?:/i.test(svg),`${path}: external asset`);
}
const notices=await read('scripts/vendor/SOURCES.md');
assert(notices.includes('maurodesouza/profile-readme-generator')&&notices.includes('Igorcbraz/GitAscii'),'Generator source attribution must remain in maintenance notices');
for(const license of ['scripts/vendor/gitascii/LICENSE','scripts/vendor/profile-readme-generator/LICENSE.md']) await access(new URL(license,root));
for(const target of ['linkedin.com/in/yerkebulanabenov','t.me/abenovv_7','mailto:yerkebulanabenov7@gmail.com','youtube.com/@Abenovv.7','instagram.com/abenov.yerkebulan','github.com/Abenovv/quiz-maker-obsidian-edition']) assert(readme.includes(target),`Missing approved link: ${target}`);
assert(!/^ {4,}<a href=/m.test(readme),'Indented social HTML would become a Markdown code block on GitHub');
assert(readme.includes('(prefers-reduced-motion: reduce)'));
assert(readme.includes('#inside-obsidian')&&!readme.includes('#appearance'));
assert(new RegExp(`\\b${data.calendar.total}\\s+(?:public\\s+)?contributions\\b`).test(nativeText.replaceAll(',','')),'Native contribution metric must refresh with the data');
console.log(`PASS: readable native profile; real portrait; ${refs} valid image references and versions; approved links; reconciled public metrics; self-contained SVGs.`);
