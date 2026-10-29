// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import {aggregateLanguages, validateCalendar} from './data.mjs';

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
