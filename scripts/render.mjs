// SPDX-License-Identifier: GPL-3.0-or-later
// Native GitHub presentation, GitAscii data assets, and Mauro's social parser.
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {renderLanguages} from './vendor/gitascii/LanguagesRenderer.ts';
import {escapeXml as esc} from './vendor/gitascii/xmlUtils.ts';
import {socialsSectionParser} from './vendor/profile-readme-generator/socials.ts';
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

// Use the generator's native social HTML with the established navy assets.
const socials=socialsSectionParser({content:{socials:{
  linkedin:{link:'https://www.linkedin.com/in/yerkebulanabenov/'},
  telegram:{link:'https://t.me/abenovv_7'},gmail:{link:'mailto:yerkebulanabenov7@gmail.com'},
  youtube:{link:'https://www.youtube.com/@Abenovv.7'},instagram:{link:'https://www.instagram.com/abenov.yerkebulan/'}
},styles:{type:'badge',style:'default',height:26}},styles:{align:'center',spacing:0}})
  .replace(/\n\s*/g,'').trim().replaceAll('assets/socials/','assets/badges/')
  .replaceAll('gmail.svg','email.svg').replaceAll('gmail logo','Email').replaceAll(' logo','')
  .replaceAll('</a><a','</a> <a');

const [about,project,background,contact,otherWork]=await Promise.all([
  read('content/about.html'),read('content/project.html'),read('content/background.html'),
  read('content/contact.html'),read('content/other-work.html')
]);
const portraitUrl=await assetVersion('assets/portrait-photo.jpg');
const heroUrl=await assetVersion('assets/developer-blue-v2.png');
const introUrl=await assetVersion('assets/intro-motion.svg');
const introStillUrl=await assetVersion('assets/intro-static.svg');
const staticUrl=await assetVersion('assets/contribution-static.svg');
const snakeUrl=await assetVersion('assets/contribution-snake.svg');
const number=value=>Number(value).toLocaleString('en-US');
const metricsUrl=await assetVersion('assets/showcase/metrics.svg');
const metricsMobileUrl=await assetVersion('assets/showcase/metrics-mobile.svg');
const cellsHtml=await Promise.all(projects.map(async project=>{
  const url=`https://github.com/Abenovv/${project.repository}`;
  const counts=projectCounts(project,data);
  const focus=await assetVersion(`assets/showcase/${project.id}-focus.svg`);
  const technology=await assetVersion(`assets/showcase/${project.id}-technology.svg`);
  const stats=await assetVersion(`assets/showcase/${project.id}-stats.svg`);
  const focusMobile=await assetVersion(`assets/showcase/${project.id}-focus-mobile.svg`);
  const technologyMobile=await assetVersion(`assets/showcase/${project.id}-technology-mobile.svg`);
  const statsMobile=await assetVersion(`assets/showcase/${project.id}-stats-mobile.svg`);
  const badge=(desktop,mobile,alt,height)=>`<picture><source media="(max-width: 600px)" srcset="${mobile}" /><img src="${desktop}" alt="${esc(alt)}" width="100%" height="${height}" /></picture>`;
  return `<td width="50%" valign="top"><h3><a href="${url}">${esc(project.title)}</a></h3><p>${esc(project.description)}</p><p>${badge(focus,focusMobile,`Focus: ${project.focus}`,28)}</p><p>${badge(technology,technologyMobile,project.technology,24)}</p><p><a href="${url}/stargazers">${badge(stats,statsMobile,`${counts.stars} stars and ${counts.forks} forks`,22)}</a></p><p><strong>${esc(project.kind)}</strong> · <a href="${url}${project.action.path}">${esc(project.action.label)}</a></p></td>`;
}));
const projectGrid=`<table width="100%"><tbody><tr>${cellsHtml.join('')}</tr></tbody></table>`;
const languageTotal=Object.values(data.languages).reduce((sum,bytes)=>sum+bytes,0)||1;
const languageRows=Object.entries(data.languages).map(([name,bytes])=>`<tr><td>${esc(name)}</td><td>${(bytes/languageTotal*100).toFixed(1)}%</td></tr>`).join('');
const languageIcons=['java','javascript','csharp','cpp','python','typescript'];
const languageNames=['Java','JavaScript','C#','C++','Python','TypeScript'];
const icons=(await Promise.all(languageIcons.map(async(id,i)=>`<img src="${await assetVersion(`assets/languages/${id}.svg`)}" alt="${languageNames[i]}" title="${languageNames[i]}" width="44" height="44" />`))).join(' ');

const readme=`<!-- Generated from content/ and public profile data. See PROFILE-AUTOMATION.md for maintenance. -->
<h1>Yerkebulan Abenov</h1>
<p><strong>Software developer · Computer Science student</strong></p>
<p><img src="${heroUrl}" alt="Cobalt code brackets and glass study cards on a midnight-blue background" width="100%" /></p>

${socials}

<picture><source media="(prefers-reduced-motion: reduce)" srcset="${introStillUrl}" /><img src="${introUrl}" alt="" width="100%" height="48" /></picture>

${about.trim()}

<h2>Open Source</h2>
${projectGrid}
${project.trim()}

<h2>Skills</h2>
<p>${icons}</p>

<h2>Activity</h2>
<picture><source media="(max-width: 600px)" srcset="${metricsMobileUrl}" /><img src="${metricsUrl}" alt="${number(data.user.public_repos)} public repositories; ${number(data.calendar.total)} public contributions in the past year; ${number(data.calendar.activeDays)} active days" width="100%" /></picture>
<p><a href="${staticUrl}" title="View without animation"><picture><source media="(prefers-reduced-motion: reduce)" srcset="${staticUrl}" /><img src="${snakeUrl}" alt="My GitHub contributions over the past year, animated in blue" width="100%" /></picture></a></p>
<details>
<summary><strong>Languages across my projects</strong></summary>
<picture><source media="(max-width: 600px)" srcset="${await assetVersion('assets/dashboard-phone.svg')}" /><img src="${await assetVersion('assets/dashboard.svg')}" alt="Languages used in my public projects" width="100%" /></picture>
<table><thead><tr><th>Language</th><th>Share</th></tr></thead><tbody>${languageRows}</tbody></table>
</details>

${background.trim().replace('<summary><strong>Education &amp; community</strong></summary>',`<summary><strong>More about me</strong></summary><p><img src="${portraitUrl}" alt="Yerkebulan Abenov" width="160" height="200" /></p>`)}

${contact.trim()}
`;
await writeFile(new URL('README.md',root),clean(readme));
console.log('Rendered readable profile, public activity assets, and motion alternatives.');
