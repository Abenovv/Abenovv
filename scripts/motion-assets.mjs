// SPDX-License-Identifier: GPL-3.0-or-later
// A short, self-contained introduction accent. No text, JavaScript, or external assets.
import {mkdir, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const LINE='M18 24H294C330 24 332 12 364 12C396 12 398 36 430 36C462 36 464 24 500 24H782';

function svg(animated) {
  const trace=animated
    ? '<animate attributeName="stroke-dashoffset" from="1" to="0" dur="1.4s" calcMode="spline" keySplines="0.22 1 0.36 1" keyTimes="0;1" fill="freeze"/>'
    : '';
  const orbit=animated
    ? '<animate attributeName="r" from="3" to="13" begin="0.28s" dur="0.8s" fill="freeze"/><animate attributeName="opacity" from="0.75" to="0.32" begin="0.28s" dur="0.8s" fill="freeze"/>'
    : '';
  const light=animated
    ? `<circle r="2.8" fill="#bdeaff" opacity="0"><animateMotion path="${LINE}" begin="0.1s" dur="2.2s" calcMode="spline" keyTimes="0;1" keySplines="0.25 0.1 0.25 1" fill="freeze"/><animate attributeName="opacity" values="0;0.95;0.95;0" keyTimes="0;0.08;0.8;1" dur="2.4s" fill="freeze"/></circle>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="48" viewBox="0 0 800 48" fill="none" role="img">
<title>Blue flowing line</title>
<defs><linearGradient id="intro-ink" x1="18" y1="24" x2="782" y2="24" gradientUnits="userSpaceOnUse"><stop stop-color="#397fd1" stop-opacity="0.15"/><stop offset="0.42" stop-color="#66bdff"/><stop offset="0.58" stop-color="#92d9ff"/><stop offset="1" stop-color="#397fd1" stop-opacity="0.15"/></linearGradient></defs>
<path d="${LINE}" stroke="#203a57" stroke-width="1" opacity="0.45"/>
<path d="${LINE}" pathLength="1" stroke="url(#intro-ink)" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="0">${trace}</path>
<circle cx="400" cy="24" r="13" stroke="#66bdff" stroke-width="1" opacity="0.32">${orbit}</circle>
<circle cx="18" cy="24" r="1.5" fill="#5b9fd5" opacity="0.5"/><circle cx="782" cy="24" r="1.5" fill="#5b9fd5" opacity="0.5"/>
${light}
</svg>
`;
}

export async function buildMotionAssets(root=new URL('../',import.meta.url)) {
  if(!(root instanceof URL) || root.protocol!=='file:') throw new TypeError('Pass the profile repository root as a file URL');
  await mkdir(new URL('assets/',root),{recursive:true});
  await Promise.all([
    writeFile(new URL('assets/intro-motion.svg',root),svg(true)),
    writeFile(new URL('assets/intro-static.svg',root),svg(false)),
  ]);
  return {animated:'assets/intro-motion.svg',static:'assets/intro-static.svg'};
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  console.log(JSON.stringify(await buildMotionAssets()));
}
