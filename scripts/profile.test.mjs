// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import {aggregateLanguages, validateCalendar} from './data.mjs';
import {requestJson} from './http.mjs';
import {projectCounts} from './showcase-assets.mjs';
import {rankedLanguages} from './layout.mjs';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

test('language chart sums bytes only across owned originals, excluding profile art',()=>{
  assert.deepEqual(aggregateLanguages([
    {name:'app',languages:{TypeScript:900,JavaScript:100}},
    {name:'second',languages:{TypeScript:50,Python:200}},
    {name:'fork',fork:true,languages:{Rust:99999}},
    {name:'Abenovv',languages:{SVG:99999}},
  ]),{TypeScript:950,Python:200,JavaScript:100});
});
test('invalid API byte counts fail rather than publishing fabricated percentages',()=>{
  assert.throws(()=>aggregateLanguages([{name:'app',languages:{Java:-1}}]));
});
const calendar=()=>Array.from({length:365},(_,i)=>({date:new Date(Date.UTC(2025,9,30+i)).toISOString().slice(0,10),count:i===100?4:i===300?3:0}));
test('calendar metrics reconcile to dated records',()=>{
  assert.deepEqual(validateCalendar(calendar()),{total:7,activeDays:2});
});
test('duplicates, missing dates and invalid counts cannot replace good data',()=>{
  for(const mutate of [d=>d.splice(100,1),d=>{d[2].date=d[1].date},d=>{d[4].count=-1}]) {
    const days=calendar();mutate(days);assert.throws(()=>validateCalendar(days));
  }
});

test('invalid civil dates are rejected even when Date.parse normalizes them',()=>{
  const days=calendar();days[0].date='2025-02-30';assert.throws(()=>validateCalendar(days));
});
test('temporary network and server failures recover with bounded retries',async()=>{
  let calls=0;
  const result=await requestJson('https://api.github.com/users/Abenovv',{
    fetchImpl:async()=>{calls++;if(calls===1) throw new Error('temporary network failure');if(calls===2)return {ok:false,status:503};return {ok:true,json:async()=>({login:'Abenovv'})};},sleep:async()=>{}
  });
  assert.deepEqual(result,{login:'Abenovv'});assert.equal(calls,3);
});
test('persistent failures stop and permanent failures do not retry',async()=>{
  for(const status of [503,403]) {
    let calls=0;
    await assert.rejects(requestJson('https://api.github.com/users/Abenovv',{
      fetchImpl:async()=>{calls++;return {ok:false,status};},sleep:async()=>{}
    }));
    assert.equal(calls,status===503?3:1);
  }
});
test('data requests cannot send headers to an unexpected host',async()=>{
  let called=false;
  await assert.rejects(requestJson('https://example.com/',{fetchImpl:async()=>{called=true;}}));
  assert.equal(called,false);
});
test('showcase never invents counts or presents a fork as an original project',()=>{
  const project={repository:'quiz-maker-obsidian-edition'};
  assert.deepEqual(projectCounts(project,{repositories:[{name:project.repository,stars:2,forks:3,fork:false}]}),{stars:2,forks:3});
  for(const repo of [undefined,{name:project.repository,stars:0,forks:0,fork:true},{name:project.repository,stars:0}]) {
    assert.throws(()=>projectCounts(project,{repositories:repo?[repo]:[]}));
  }
});
test('render rebuilds deterministically from explicit content sources',async()=>{
  const root=new URL('../',import.meta.url);
  const readme=await readFile(new URL('README.md',root),'utf8');
  const referencedImages=Array.from(readme.matchAll(/(?:src|srcset)="(assets\/[^"]+)"/g),m=>m[1].split(/[?#]/)[0]);
  const files=[...new Set(['README.md','assets/dashboard.svg','assets/dashboard-mobile.svg','assets/dashboard-phone.svg','assets/contribution-static.svg',...referencedImages])];
  const comparable=async path=>{
    const bytes=await readFile(new URL(path,root));
    return /\.(?:md|svg)$/.test(path)?Buffer.from(bytes.toString('utf8').replace(/\r\n/g,'\n')):bytes;
  };
  const before=await Promise.all(files.map(comparable));
  const run=spawnSync(process.execPath,['scripts/render.mjs'],{cwd:root,encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const after=await Promise.all(files.map(comparable));
  after.forEach((bytes,i)=>assert.deepEqual(bytes,before[i],files[i]));
});

test('language icons reorder when repository usage changes and keep unobserved stated languages last',()=>{
  const a=rankedLanguages({TypeScript:10,'C#':30,JavaScript:20});
  assert.deepEqual(a.slice(0,3).map(x=>x.name),['C#','JavaScript','TypeScript']);
  const b=rankedLanguages({Java:50,TypeScript:10});
  assert.equal(b[0].name,'Java');
  assert.equal(b.find(x=>x.name==='C++').bytes,0);
  assert.equal(b.length,6);
});

test('snake containment clips a fixed parent and remains stable on repeated refreshes',async()=>{
  const {containSnake}=await import('./contain-snake.mjs');
  const source='<svg><rect class="c" x="2" y="2"/><rect class="c c1" x="34" y="98"/><rect class="s s0" x="0.8" y="0.8"/></svg>';
  const contained=containSnake(source);
  assert(contained.includes('<rect x="2" y="2" width="44" height="108"/>'));
  assert(contained.includes('<g clip-path="url(#snake-grid-clip)"><rect class="s s0"'));
  assert(contained.includes('viewBox="2 2 44 108"'));
  assert(contained.includes('overflow="hidden"'));
  assert.equal(containSnake(contained),contained);
  assert.throws(()=>containSnake('<svg/>'),/no calendar cells/);
});
