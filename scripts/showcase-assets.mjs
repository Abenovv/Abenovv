// SPDX-License-Identifier: GPL-3.0-or-later
// Small reusable visual assets; project titles and descriptions stay native HTML.
import {mkdir,writeFile} from 'node:fs/promises';
import {escapeXml as esc} from './vendor/gitascii/xmlUtils.ts';
const BG='#0c1629', INK='#dbedff', MUTED='#9bb3d1', EDGE='#24446a';
const svg=(w,h,title,body)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMinYMid meet"><title>${esc(title)}</title>${body}</svg>\n`;
const text=(x,y,value,size=12,color=INK,extra='')=>`<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-size="${size}" fill="${color}" ${extra}>${esc(String(value))}</text>`;
export function projectCounts(project,data) {
  const repo=data.repositories.find(repo=>repo.name===project.repository);
  if(!repo || repo.fork) throw new Error(`Selected project is missing or is a fork: ${project.repository}`);
  if(!Number.isSafeInteger(repo.stars)||repo.stars<0||!Number.isSafeInteger(repo.forks)||repo.forks<0)
    throw new Error(`Selected project counts are invalid: ${project.repository}`);
  return {stars:repo.stars,forks:repo.forks};
}
export async function buildShowcaseAssets(root,data,projects) {
  await mkdir(new URL('assets/showcase/',root),{recursive:true});
  for(const project of projects) {
    const counts=projectCounts(project,data);
    const focus=svg(250,30,`Focus: ${project.focus}`,
      `<rect width="250" height="30" rx="3" fill="${BG}"/><path d="M3 0H66V30H3Q0 30 0 27V3Q0 0 3 0" fill="${project.color}"/>`+
      text(33,20,'FOCUS',11,'#fff','text-anchor="middle" font-weight="700" letter-spacing="1"')+
      text(77,20,project.focus,12,INK,'font-weight="700" letter-spacing=".8"'));
    const meta=svg(214,24,`${project.technology} · ${project.kind}`,
      `<rect x=".5" y=".5" width="213" height="23" rx="4" fill="${BG}" stroke="${EDGE}"/>`+
      text(10,16,project.technology,11,MUTED));
    const stats=svg(164,24,`${counts.stars} stars · ${counts.forks} forks`,
      `<rect width="164" height="24" rx="3" fill="#15213a"/><path d="M0 0H38V24H0Z M82 0H121V24H82Z" fill="#273a56"/>`+
      text(19,16,'stars',11,INK,'text-anchor="middle"')+text(60,16,counts.stars,12,'#83c7ff','text-anchor="middle" font-weight="700"')+
      text(102,16,'forks',11,INK,'text-anchor="middle"')+text(143,16,counts.forks,12,'#83c7ff','text-anchor="middle" font-weight="700"'));
    await Promise.all([['focus',focus],['technology',meta],['stats',stats]].map(([name,content])=>writeFile(new URL(`assets/showcase/${project.id}-${name}.svg`,root),content)));
    const mobileFocus=svg(120,28,`Focus: ${project.focus}`,
      `<rect width="120" height="28" rx="3" fill="${BG}"/><rect width="4" height="28" rx="2" fill="${project.color}"/>`+
      text(12,18,project.focusMobile,10,INK,'font-weight="700"'));
    const mobileTechnology=svg(120,24,project.technology,
      `<rect x=".5" y=".5" width="119" height="23" rx="3" fill="${BG}" stroke="${EDGE}"/>`+
      text(6,16,project.technologyMobile,10,MUTED));
    const mobileStats=svg(120,24,`${counts.stars} stars · ${counts.forks} forks`,
      `<rect width="120" height="24" rx="3" fill="#15213a"/>`+text(6,16,`${counts.stars} stars / ${counts.forks} forks`,11,'#83c7ff'));
    await Promise.all([['focus',mobileFocus],['technology',mobileTechnology],['stats',mobileStats]].map(([name,content])=>writeFile(new URL(`assets/showcase/${project.id}-${name}-mobile.svg`,root),content)));
  }
  for(const width of [800,352]) {
    const values=[[data.user.public_repos,'Public repos'],[data.calendar.total,'Contributions'],[data.calendar.activeDays,'Active days']];
    const body=`<rect x=".5" y=".5" width="${width-1}" height="91" rx="8" fill="${BG}" stroke="${EDGE}"/>`+values.map(([value,label],i)=>{
      const x=(i+.5)*width/3;
      return (i?`<path d="M${i*width/3} 22V70" stroke="${EDGE}"/>`:'')+
        text(x,43,Number(value).toLocaleString('en-US'),width>400?30:26,'#80c7ff','text-anchor="middle" font-weight="700"')+
        text(x,66,label,width>400?13:11,MUTED,'text-anchor="middle"');
    }).join('');
    await writeFile(new URL(`assets/showcase/metrics${width<400?'-mobile':''}.svg`,root),svg(width,92,`${data.user.public_repos} public repos, ${data.calendar.total} public contributions, ${data.calendar.activeDays} active days`,body));
  }
}
