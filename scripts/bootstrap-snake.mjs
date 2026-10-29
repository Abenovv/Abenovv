// SPDX-License-Identifier: GPL-3.0-or-later
// Initial public-data preview; the first successful scheduled workflow replaces it with Platane/snk output.
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const data=JSON.parse(await readFile(new URL('assets/profile-data.json',root),'utf8'));
const days=data.contributions.days;
const start=new Date(days[0].date+'T00:00:00Z');
const offset=start.getUTCDay();
const palette=['#101e33','#17375e','#245c96','#398fce','#8bd8ff'];
const max=Math.max(...days.map(d=>d.count),1);
const path=[];
let cells='';
for(let i=0;i<days.length;i++) {
  const col=Math.floor((i+offset)/7),row=(i+offset)%7;
  const x=20+col*14,y=10+row*14;
  const level=days[i].count?Math.min(4,Math.ceil(days[i].count/max*4)):0;
  cells+=`<rect x="${x}" y="${y}" width="10" height="10" rx="2" fill="${palette[level]}"/>`;
}
for(let c=0;c<53;c++) for(let r0=0;r0<7;r0++) {
  const r=c%2===0?r0:6-r0;
  path.push(`${20+c*14+5},${10+r*14+5}`);
}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="126" viewBox="0 0 800 126"><title>Blue contribution snake</title><rect width="800" height="126" fill="#070e1b"/>${cells}<path d="M${path.join(' L')}" fill="none" stroke="#74ccff" stroke-width="7" stroke-linecap="round" stroke-dasharray="30 10000"><animate attributeName="stroke-dashoffset" from="0" to="-5900" dur="16s" repeatCount="indefinite"/></path></svg>`;
await writeFile(new URL('assets/contribution-snake.svg',root),svg);
