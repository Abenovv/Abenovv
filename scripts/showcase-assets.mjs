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
    for(const [suffix,w,labelWidth,fontSize] of [['',334,80,13],['-mobile',240,64,10.5]]) {
      const focus=svg(w,35,`Focus: ${project.focus}`,
        `<rect width="${labelWidth}" height="35" fill="${project.color}"/><rect x="${labelWidth}" width="${w-labelWidth}" height="35" fill="#111827"/>`+
        text(labelWidth/2,23,'FOCUS',suffix?11:13,'#fff','text-anchor="middle" font-weight="700" letter-spacing="1"')+
        `<text x="${labelWidth+12}" y="23" font-family="Consolas,monospace" font-size="${fontSize}" font-weight="700" fill="#fff">${esc(project.focus)}</text>`);
      await writeFile(new URL(`assets/showcase/${project.id}-focus${suffix}.svg`,root),focus);
    }
    for(const [label,value,color] of [['stars',counts.stars,'#f59e0b'],['forks',counts.forks,'#60a5fa']]) {
      const countWidth=Math.max(29,String(value).length*8+16);
      const badge=svg(45+countWidth,24,`${value} ${label}`,
        `<rect width="45" height="24" fill="#555"/><rect x="45" width="${countWidth}" height="24" fill="${color}"/>`+
        text(6,17,label,13,'#fff')+text(45+countWidth/2,17,value,13,'#fff','text-anchor="middle"'));
      await writeFile(new URL(`assets/showcase/${project.id}-${label}.svg`,root),badge);
    }
  }
  for(const width of [1080,352]) {
    const values=[[data.user.public_repos,'Repositories'],[data.calendar.total,'Contributions'],[data.calendar.activeDays,'Active days']];
    const height=width>400?70:78;
    const body=`<rect x=".5" y=".5" width="${width-1}" height="${height-1}" rx="7" fill="${BG}" stroke="${EDGE}"/>`+values.map(([value,label],i)=>{
      const x=(i+.5)*width/3;
      return (i?`<path d="M${i*width/3} 15V${height-15}" stroke="${EDGE}"/>`:'')+
        text(x,width>400?30:34,Number(value).toLocaleString('en-US'),23,'#80c7ff','text-anchor="middle" font-weight="700"')+
        text(x,width>400?51:57,label,width>400?12:10,MUTED,'text-anchor="middle"');
    }).join('');
    await writeFile(new URL(`assets/showcase/metrics${width<400?'-mobile':''}.svg`,root),svg(width,height,`${data.user.public_repos} public repos, ${data.calendar.total} public contributions, ${data.calendar.activeDays} active days`,body));
  }
}
