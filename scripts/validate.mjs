// SPDX-License-Identifier: GPL-3.0-or-later
import {readFile,access} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {aggregateLanguages,validateCalendar} from './data.mjs';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const data=JSON.parse(await read('assets/profile-data.json'));
assert.deepEqual(validateCalendar(data.contributions.days),data.calendar);
assert.equal(data.contributions.totalContributions,data.calendar.total);
assert.equal(data.user.public_repos,data.repositories.length);
assert.deepEqual(data.languages,aggregateLanguages(data.repositories));
const ascii=JSON.parse(await read('assets/portrait-ascii.json'));
assert.equal(ascii.lines.length,ascii.rows);
assert(ascii.lines.every(l=>l.length===ascii.cols));
const readme=await read('README.md');
let refs=0;
for(const m of readme.matchAll(/(?:src|srcset)="(assets\/[^"]+)"/g)) {await access(new URL(m[1],root));refs++;}
assert(refs>=8,'Expected dashboards, social icons, screenshot and snake');
for(const path of ['assets/dashboard.svg','assets/dashboard-mobile.svg','assets/contribution-snake.svg','assets/snake-title.svg']) {
  const svg=await read(path);
  assert(svg.includes('<svg')&&svg.includes('</svg>'),`${path}: malformed SVG`);
  assert(!/<script|foreignObject|@import|\son\w+=/i.test(svg),`${path}: unsupported SVG content`);
  assert(!/(?:href|src)="https?:/i.test(svg),`${path}: external asset`);
}
assert(!readme.includes('developer-blue-v2.png'),'Old hero must not duplicate ASCII portrait');
assert(readme.includes('maurodesouza/profile-readme-generator')&&readme.includes('Igorcbraz/GitAscii'));
assert(!/^ {4,}<a href=/m.test(readme),'Indented social HTML would become a Markdown code block on GitHub');
console.log(`PASS: ${refs} README image references; public metrics reconcile; original photo excluded; safe self-contained SVGs.`);
