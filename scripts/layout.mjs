// SPDX-License-Identifier: GPL-3.0-or-later
const languages=[['TypeScript','typescript'],['C#','csharp'],['JavaScript','javascript'],['Java','java'],['Python','python'],['C++','cpp']];
export function rankedLanguages(totals) {
  return languages.map(([name,icon])=>({name,icon,bytes:totals[name]??0})).sort((a,b)=>b.bytes-a.bytes);
}
