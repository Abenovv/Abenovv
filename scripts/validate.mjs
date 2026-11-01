// SPDX-License-Identifier: GPL-3.0-or-later
import {readFile,access} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {aggregateLanguages,validateCalendar} from './data.mjs';
import {rankedLanguages} from './layout.mjs';
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
assert(!/<h1\b/.test(readme),'Do not repeat the sidebar name above the profile card');
assert(/Developer.*Computer Science student/.test(nativeText),'Readable role is missing');
assert(nativeText.split(' ').length>=40,'Profile needs readable personal/project text outside images');
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
assert(refs>=12,'Expected full portrait, ranked icons, project badges, activity and motion alternatives');
assert(portraits>0,'A static full-portrait alternative is required');
const proof=JSON.parse(await read('assets/portrait-proof.json'));
assert.deepEqual(proof.crop,{x:0,y:0,width:433,height:577},'Full supplied portrait must not be cropped');
assert.equal(proof.outputWidth*proof.sourceHeight,proof.outputHeight*proof.sourceWidth,'Portrait proportions changed');
const portraitPng=await readFile(new URL('assets/portrait-full.png',root));
assert.equal(portraitPng.readUInt32BE(16),4330);assert.equal(portraitPng.readUInt32BE(20),5770);
const positions=rankedLanguages(data.languages).map(({name})=>readme.indexOf(`alt="${name} logo"`));
assert(positions.every((position,i)=>position>=0&&(i===0||position>positions[i-1])),'Language icons must follow current repository byte counts');
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
assert(readme.includes('github.com/Abenovv/quiz-maker-obsidian-edition'),'Selected project link missing');
for(const forbidden of ['linkedin.com','t.me/','mailto:','youtube.com','instagram.com','assets/developer-blue','assets/screens/','Browser projects','More projects'])
  assert(!readme.includes(forbidden),`Removed content returned: ${forbidden}`);
assert(readme.includes('(prefers-reduced-motion: reduce)'));
assert(/<img src="assets\/portrait-full\.png\?/.test(readme),'Approved portrait must use the reliable PNG directly');
const snake=await read('assets/contribution-snake.svg');
assert(snake.includes('<g clip-path="url(#snake-grid-clip)">'),'Snake must stay within calendar bounds');
assert((readme.match(/<table\b/g)||[]).length===2,'Expected rectangular portrait/about and project blocks');
assert(new RegExp(`\\b${data.calendar.total}\\s+(?:public\\s+)?contributions\\b`).test(readme.replaceAll(',','')),'Accessible contribution metric must refresh with the data');
assert(readme.includes('<h2>Open Source</h2>'),'Project showcase heading missing');
assert(readme.includes('<sub>Quizzes and flashcards from your Obsidian notes.'),'Compact project description missing');
assert(readme.includes('assets/showcase/metrics.svg'),'Styled metrics must remain visible');
const projects=JSON.parse(await read('content/projects.json'));
assert.equal(projects.length,1,'Only Quiz maker was approved');
assert.equal(projects[0].repository,'quiz-maker-obsidian-edition');
for(const project of projects) {
  const repo=data.repositories.find(repo=>repo.name===project.repository);
  assert(repo&&!repo.fork,'Selected projects must be verified public originals');
  assert(readme.includes(`github.com/Abenovv/${project.repository}`));
  for(const [label,count] of [['stars',repo.stars],['forks',repo.forks]]) {
    const badge=await read(`assets/showcase/${project.id}-${label}.svg`);
    assert(badge.includes(`<title>${count} ${label}</title>`),'Repository badge counts must match source');
  }
}
console.log(`PASS: readable rectangular profile; uncropped full portrait; ranked languages; ${refs} valid image references and versions; only approved project links; reconciled public metrics; self-contained SVGs.`);
