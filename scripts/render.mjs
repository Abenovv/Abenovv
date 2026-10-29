// SPDX-License-Identifier: GPL-3.0-or-later
// GitAscii TerminalInfo/Languages renderers + locally authored responsive composition.
import { readFile, writeFile } from 'node:fs/promises';
import { renderTerminalInfo } from './vendor/gitascii/TerminalInfoRenderer.ts';
import { renderLanguages } from './vendor/gitascii/LanguagesRenderer.ts';
import { escapeXml as esc } from './vendor/gitascii/xmlUtils.ts';
import { socialsSectionParser } from './vendor/profile-readme-generator/socials.ts';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const data=JSON.parse(await read('assets/profile-data.json'));
const portrait=JSON.parse(await read('assets/portrait-ascii.json'));
const bg='#070e1b', edge='#203858', ink='#d8e8ff', accent='#66c5ff', muted='#8198b5';
const styles={backgroundColor:bg,textColor:ink,accentColor:accent,borderColor:edge,fontFamily:'Consolas,DejaVu Sans Mono,monospace',borderRadius:0};
const config={showUptime:false,showCompany:false,showLanguages:false,showJoined:true,
  showStatus:true,customStatus:'Internships / junior roles / open source',
  showHighlights:true,customHighlights:'CS student / Astana IT University',
  showContactSection:false,showCommits:true,showGists:true,showFollowers:true,
  customTitle:'Abenovv@github',headerColor:accent,labelColor:'#83adff',dotColor:'#284262',
  valueColor:ink,statsValColor:accent,dividerColor:edge};
const header=(w,h,title)=>`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><title>${esc(title)}</title><rect width="100%" height="100%" fill="${bg}"/><g font-family="${styles.fontFamily}">`;
const text=(x,y,str,size=12,color=ink,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${esc(str)}</text>`;
function frame(x,y,w,h,content) {
  return `<g transform="translate(${x} ${y})"><rect x=".5" y=".5" width="${w-1}" height="${h-1}" fill="${bg}" stroke="${edge}"/>${text(8,14,'+',11,accent)}${text(w-16,14,'+',11,accent)}${content}</g>`;
}
function portraitArt(w,h) {
  const left=14,top=27,artW=w-28,artH=h-48;
  const rowH=artH/portrait.rows;
  return text(16,20,'[ PORTRAIT / ASCII ]',9,muted,'letter-spacing="1.2"')+
    portrait.lines.map((line,i)=>text(left,top+(i+0.83)*rowH,line,rowH*0.94,accent,
      `xml:space="preserve" textLength="${artW}" lengthAdjust="spacingAndGlyphs"`)).join('');
}
async function skillContent(w,h,mobile=false) {
  const ids=['java','javascript','csharp','cpp','python','typescript'];
  const cols=mobile?6:6, size=mobile?42:40, gap=(w-40-cols*size)/(cols-1);
  const logos=await Promise.all(ids.map(async(id,i)=>{
    const raw=await read(`assets/languages/${id}.svg`);
    const match=raw.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    if(!match) throw new Error('Missing language SVG');
    return `<svg x="${20+i*(size+gap)}" y="48" width="${size}" height="${size}" viewBox="0 0 44 44">${match[1]}</svg>`;
  }));
  return text(20,29,'[ LANGUAGES I USE ]',10,muted,'letter-spacing="1.5"')+logos.join('')+
    (mobile?'':text(20,117,'Learning. Building. Sharing.',10,muted));
}
function info(w,h,mobile=false) {
  // Mobile values are shorter to stay readable in the same real GitAscii renderer.
  const mobileConfig=mobile?{...config,customStatus:'Internships / junior roles',customHighlights:'CS / Astana IT University'}:config;
  return `<g transform="translate(8 20)">${renderTerminalInfo({size:{width:w-16,height:h-20},config:mobileConfig},data,styles)}</g>`+
    text(20,h-17,`${data.calendar.activeDays} active days / rolling year`,10,muted);
}
function languages(w,h) {
  let svg=renderLanguages({size:{width:w,height:h},config:{langsCount:5,langsLayout:'bars'}},data,styles);
  svg=svg.replaceAll("'Inter Tight', sans-serif",styles.fontFamily).replaceAll('#7a7a7a',muted);
  return svg+text(24,h-15,'Code bytes / public originals / top 5',9,muted);
}
const desktop=header(800,508,'Yerkebulan Abenov — ASCII portrait, public GitHub metrics, languages and skills')+
  text(12,27,'YERKEBULAN ABENOV',23,ink,'font-weight="700"')+
  text(788,25,'DEVELOPER / CS STUDENT',10,accent,'text-anchor="end" letter-spacing="1"')+
  frame(8,46,260,268,portraitArt(260,268))+
  frame(278,46,514,268,info(514,268))+
  frame(8,324,464,166,languages(464,166))+
  frame(482,324,310,166,await skillContent(310,166))+
  text(12,504,`AUTO REFRESH / ${data.updatedDate} / UTC+05:00`,9,muted)+
  text(788,504,'BUILD TO LEARN. SHARE TO GROW.',9,muted,'text-anchor="end"')+'</g></svg>';
const mobile=header(390,724,'Yerkebulan Abenov — mobile profile and public GitHub metrics')+
  text(12,25,'YERKEBULAN ABENOV',20,ink,'font-weight="700"')+
  frame(8,42,142,156,portraitArt(142,156))+
  text(166,76,'SOFTWARE',15,accent)+text(166,97,'DEVELOPER',15,accent)+
  text(166,129,'Computer Science',12)+text(166,151,'Astana IT University',11,muted)+
  text(166,182,'LEARN / BUILD / SHARE',10,muted)+
  frame(8,208,374,220,info(374,220,true))+
  frame(8,438,374,162,languages(374,162))+
  frame(8,610,374,92,await skillContent(374,92,true))+
  text(12,719,`AUTO REFRESH / ${data.updatedDate} / UTC+05:00`,9,muted)+'</g></svg>';
const clean=svg=>svg.split('\n').map(line=>line.trimEnd()).join('\n');
await writeFile(new URL('assets/dashboard.svg',root),clean(desktop));
await writeFile(new URL('assets/dashboard-mobile.svg',root),clean(mobile));
const snakeTitle=header(800,36,'Blue contribution snake')+
  text(14,23,'[ CONTRIBUTION SNAKE / BLUE ]',11,muted,'letter-spacing="1.8"')+
  text(786,23,'ROLLING YEAR',10,accent,'text-anchor="end"')+'</g></svg>';
await writeFile(new URL('assets/snake-title.svg',root),snakeTitle);
const socials=socialsSectionParser({content:{socials:{
  linkedin:{link:'https://www.linkedin.com/in/yerkebulanabenov/'},
  telegram:{link:'https://t.me/abenovv_7'},gmail:{link:'mailto:yerkebulanabenov7@gmail.com'},
  youtube:{link:'https://www.youtube.com/@Abenovv.7'},instagram:{link:'https://www.instagram.com/abenov.yerkebulan/'}
},styles:{type:'icon',style:'default',height:30}},styles:{align:'center',spacing:8}}).replace(/\n\s*/g,'').trim();
const old=await read('README.md');
const project=old.match(/<details>[\s\S]*?<summary><strong>Preview and project details<\/strong><\/summary>[\s\S]*?<\/details>/)?.[0]||'';
const background=old.match(/<details>\s*<summary><strong>Background &amp; highlights<\/strong><\/summary>[\s\S]*?<\/details>/)?.[0]||'';
const readme=`<!-- Generated by scripts/render.mjs. Profile data refreshes via GitHub Actions. -->
<picture>
  <source media="(max-width: 600px)" srcset="assets/dashboard-mobile.svg" />
  <img src="assets/dashboard.svg" alt="Yerkebulan Abenov — Computer Science student at Astana IT University, based in Astana. Open to internships, junior roles, and open-source collaboration. Live public GitHub metrics and code language chart." width="100%" />
</picture>

${socials.trim()}

<p><img src="assets/snake-title.svg" alt="Blue contribution snake" width="100%" /><img src="assets/contribution-snake.svg" alt="Automatically refreshed blue snake animation of my GitHub contribution calendar" width="100%" /></p>

<p><strong><a href="https://github.com/Abenovv/quiz-maker-obsidian-edition">Quiz maker for Obsidian</a></strong> — turn notes into editable quizzes and flashcards.<br /><a href="https://github.com/Abenovv/quiz-maker-obsidian-edition/releases/latest">Download</a> · <a href="https://github.com/Abenovv/quiz-maker-obsidian-edition/blob/main/docs/guide.md">Guide</a> · <a href="https://github.com/Abenovv/quiz-maker-obsidian-edition/issues">Contribute</a><br /><sub>TypeScript + React · Continuing <a href="https://github.com/ECuiDev/obsidian-quiz-generator">Edward Cui's Quiz Generator</a>.</sub></p>

${project}

${background}

<p><sub>Metrics and blue snake refresh twice daily. <a href="https://github.com/Abenovv/Abenovv/actions/workflows/refresh-profile.yml">Refresh status</a> · <a href="assets/profile-data.json">Public data</a> · Built with <a href="https://github.com/Igorcbraz/GitAscii">GitAscii</a> and <a href="https://github.com/maurodesouza/profile-readme-generator">Profile Readme Generator</a>.</sub></p>
`;
await writeFile(new URL('README.md',root),readme.split('\n').map(line=>line.trimEnd()).join('\n'));
console.log('Rendered GitAscii desktop/mobile dashboards and Mauro social HTML.');
