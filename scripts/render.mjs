// SPDX-License-Identifier: GPL-3.0-or-later
// Native rectangular GitHub presentation, GitAscii assets, and Mauro's technology parser.
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderLanguages} from './vendor/gitascii/LanguagesRenderer.ts';
import {escapeXml as esc} from './vendor/gitascii/xmlUtils.ts';
import {techsSectionParser} from './vendor/profile-readme-generator/techs.ts';
import {rankedLanguages} from './layout.mjs';
import {buildMotionAssets} from './motion-assets.mjs';
import {buildShowcaseAssets,projectCounts} from './showcase-assets.mjs';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const data=JSON.parse(await read('assets/profile-data.json'));
const projects=JSON.parse(await read('content/projects.json'));
const assetVersion=async path=>{
  const bytes=await readFile(new URL(path,root));
  const content=path.endsWith('.svg')?Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n')):bytes;
  return `${path}?v=${createHash('sha256').update(content).digest('hex').slice(0,12)}`;
};
const clean=text=>text.split('\n').map(line=>line.trimEnd()).join('\n');
const bg='#091322', edge='#254365', ink='#dceaff', blue='#8acaff';
const styles={backgroundColor:bg,textColor:ink,accentColor:blue,borderColor:edge,
  fontFamily:'Arial,Helvetica,sans-serif',borderRadius:8};
const svg=(width,height,title,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img"><title>${esc(title)}</title><rect x=".5" y=".5" width="${width-1}" height="${height-1}" rx="8" fill="${bg}" stroke="${edge}"/>${body}</svg>`;

// Retain standalone GitAscii charts for readers who want the repository breakdown.
// These are supporting assets; biography, role, projects, and skills remain native text.
for(const [name,width,height] of [['dashboard',800,156],['dashboard-mobile',390,156],['dashboard-phone',320,156]]) {
  const body=renderLanguages({size:{width,height},config:{langsCount:5,langsLayout:'bars'}},data,styles)
    .replaceAll("'Inter Tight', sans-serif",'Arial,Helvetica,sans-serif')
    .replaceAll('#7a7a7a','#a6bbd4')
    .replace(/<text[^>]*>\[ TOP LANGUAGES \]<\/text>/,'');
  await writeFile(new URL(`assets/${name}.svg`,root),clean(svg(width,height,'Languages in my public projects',body)));
}

const days=data.contributions.days;
const offset=new Date(days[0].date+'T00:00:00Z').getUTCDay();
const max=Math.max(1,...days.map(day=>day.count));
const colors=['#101e33','#17375e','#245c96','#398fce','#8bd8ff'];
const cells=days.map((day,i)=>{
  const x=22+Math.floor((i+offset)/7)*14,y=12+(i+offset)%7*14;
  const level=day.count?Math.min(4,Math.ceil(day.count/max*4)):0;
  return `<rect data-date="${day.date}" data-count="${day.count}" x="${x}" y="${y}" width="10" height="10" rx="2" fill="${colors[level]}"/>`;
}).join('');
await writeFile(new URL('assets/contribution-static.svg',root),svg(800,116,
  `${data.calendar.total} public contributions over the past year`,cells));
// Keep the previous helper asset valid for existing copies without displaying its caption.
await writeFile(new URL('assets/snake-title.svg',root),svg(800,16,'Blue line',
  '<path d="M16 8H784" stroke="#254365"/>'));
await buildMotionAssets(root);
await buildShowcaseAssets(root,data,projects);

// The technology parser preserves real icon assets; ordering follows refreshed public code bytes.
const ranked=rankedLanguages(data.languages);
const iconProviders=Object.fromEntries(await Promise.all(ranked.map(async({name,icon})=>[
  name,{providers:[{path:await assetVersion(`assets/languages/${icon}.svg`)}],currentProvider:0,config:{}}
])));
const icons=techsSectionParser({content:{icons:iconProviders,styles:{height:30}},styles:{align:'left',spacing:4}})
  .replace(/\n\s*/g,'').trim();
const [about,background]=await Promise.all([read('content/about.html'),read('content/background.html')]);
const portraitMotion=await assetVersion('assets/portrait-full-motion.svg');
const portraitStatic=await assetVersion('assets/portrait-full.png');
const staticUrl=await assetVersion('assets/contribution-static.svg');
const snakeUrl=await assetVersion('assets/contribution-snake.svg');
const projectCells=await Promise.all(projects.map(async project=>{
  const url=`https://github.com/Abenovv/${project.repository}`;
  const counts=projectCounts(project,data);
  const focus=await assetVersion(`assets/showcase/${project.id}-focus.svg`);
  const mobile=await assetVersion(`assets/showcase/${project.id}-focus-mobile.svg`);
  const stars=await assetVersion(`assets/showcase/${project.id}-stars.svg`);
  const forks=await assetVersion(`assets/showcase/${project.id}-forks.svg`);
  return `<td valign="top"><a href="${url}"><b>${esc(project.title)}</b></a><br /><sub>${esc(project.description)} · <a href="${url}${project.action.path}">${esc(project.action.label)}</a></sub><br /><picture><source media="(max-width: 600px)" srcset="${mobile}" /><img src="${focus}" height="35" alt="Focus: ${esc(project.focus)}" /></picture><br /><a href="${url}/stargazers"><img src="${stars}" height="24" alt="${counts.stars} stars" /></a> <a href="${url}/forks"><img src="${forks}" height="24" alt="${counts.forks} forks" /></a></td>`;
}));
const number=value=>Number(value).toLocaleString('en-US');
const inlineIcons=icons.replace(/^<div[^>]*>/,'').replace(/<\/div>$/,'').replace(/\s*(&nbsp;)\s*/g,'$1').trim();
const readme=`<!-- Generated from content/ and public profile data. See PROFILE-AUTOMATION.md for maintenance. -->
<table width="100%"><tbody><tr>
<td width="35%" valign="middle" align="center"><a href="${portraitStatic}"><picture><source media="(prefers-reduced-motion: reduce)" srcset="${portraitStatic}" /><img src="${portraitMotion}" alt="Yerkebulan Abenov, full supplied portrait in blue ASCII, including shoulders and jacket" width="180" /></picture></a></td>
<td valign="middle"><p><strong>Developer · Computer Science student</strong><br /><sub>Astana, Kazakhstan</sub></p>${about.trim()}</td>
</tr></tbody></table>
<p><strong>Languages</strong> ${inlineIcons}</p>

<h2>Open Source</h2>
<table><tbody><tr>${projectCells.join('')}</tr></tbody></table>

<h2>Activity</h2>
<picture><source media="(max-width: 600px)" srcset="${await assetVersion('assets/showcase/metrics-mobile.svg')}" /><img src="${await assetVersion('assets/showcase/metrics.svg')}" alt="${number(data.user.public_repos)} public repositories; ${number(data.calendar.total)} public contributions in the past year; ${number(data.calendar.activeDays)} active days" width="100%" /></picture>
<p><a href="${staticUrl}" title="View without animation"><picture><source media="(prefers-reduced-motion: reduce)" srcset="${staticUrl}" /><img src="${snakeUrl}" alt="My GitHub contributions over the past year, animated in blue" width="100%" /></picture></a></p>

${background.trim()}
`;
await writeFile(new URL('README.md',root),clean(readme));
console.log('Rendered approved rectangular profile: full portrait, ranked languages, Quiz maker and blue activity.');
