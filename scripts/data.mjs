// SPDX-License-Identifier: GPL-3.0-or-later
export const USERNAME = 'Abenovv';
export function aggregateLanguages(repositories) {
  const languages = {};
  for (const repo of repositories) {
    // Exclude forks and this generated profile so artwork cannot dominate the chart.
    if (repo.fork || repo.name.toLowerCase() === USERNAME.toLowerCase()) continue;
    for (const [language, bytes] of Object.entries(repo.languages || {})) {
      if (!Number.isSafeInteger(bytes) || bytes < 0) throw new Error('Invalid language bytes');
      languages[language] = (languages[language] || 0) + bytes;
    }
  }
  return Object.fromEntries(Object.entries(languages).sort((a,b)=>b[1]-a[1]));
}
export function validateCalendar(days) {
  if (!Array.isArray(days) || days.length < 360 || days.length > 371) throw new Error('Expected a recent full-year calendar');
  const seen = new Set();
  for (let i=0; i<days.length; i++) {
    const d=days[i];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date) || !Number.isSafeInteger(d.count) || d.count<0 || seen.has(d.date)) throw new Error('Invalid calendar entry');
    if (i && Date.parse(d.date)-Date.parse(days[i-1].date)!==86400000) throw new Error('Calendar has a gap');
    seen.add(d.date);
  }
  return { total: days.reduce((n,d)=>n+d.count,0), activeDays: days.filter(d=>d.count>0).length };
}
