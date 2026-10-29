// SPDX-License-Identifier: GPL-3.0-or-later
import { writeFile } from 'node:fs/promises';
import { aggregateLanguages, validateCalendar, USERNAME } from './data.mjs';
import { requestJson } from './http.mjs';

// The short-lived GitHub Actions token is used only by GitHub APIs during workflow execution.
// Local runs are anonymous and never inspect credential stores or browser sessions.
const token = process.env.GITHUB_TOKEN;
const headers = { Accept:'application/vnd.github+json', 'Content-Type':'application/json', 'User-Agent':'Abenovv-Profile-Refresh',
  ...(token ? {Authorization:`Bearer ${token}`} : {}) };
async function request(path, init={}) {
  return requestJson(`https://api.github.com${path}`, {...init, headers});
}
const profile = await request(`/users/${USERNAME}`);
if (profile.login.toLowerCase()!==USERNAME.toLowerCase()) throw new Error('Wrong profile');
const repos=[];
for(let page=1;page<=30;page++) {
  const batch=await request(`/users/${USERNAME}/repos?per_page=100&type=owner&sort=full_name&page=${page}`);
  if(!Array.isArray(batch)) throw new Error('Invalid repository response');
  for(const repo of batch) {
    if(repo.private || repo.owner.login.toLowerCase()!==USERNAME.toLowerCase()) throw new Error('Unexpected repository');
    repos.push({name:repo.name,fork:repo.fork,stars:repo.stargazers_count,languages:{}});
  }
  if(batch.length<100) break;
  if(page===30) throw new Error('Repository pagination limit');
}
for(const repo of repos) {
  if(!repo.fork && repo.name.toLowerCase()!==USERNAME.toLowerCase())
    repo.languages=await request(`/repos/${USERNAME}/${encodeURIComponent(repo.name)}/languages`);
}
let days;
let calendarSource;
if(token) {
  const result=await request('/graphql',{method:'POST',body:JSON.stringify({
    query:'query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{weeks{contributionDays{date contributionCount color}}}}}}',
    variables:{login:USERNAME}
  })});
  if(result.errors || !result.data?.user) throw new Error('Contribution GraphQL request failed');
  days=result.data.user.contributionsCollection.contributionCalendar.weeks.flatMap(w=>
    w.contributionDays.map(d=>({date:d.date,count:d.contributionCount})));
  calendarSource='https://api.github.com/graphql';
} else {
  const url=`https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`;
  days=(await requestJson(url)).contributions.map(d=>({date:d.date,count:d.count}));
  calendarSource=url;
}
days.sort((a,b)=>a.date.localeCompare(b.date));
const localDate = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Qyzylorda',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
days=days.filter(d=>d.date<=localDate).slice(-365);
const calendar=validateCalendar(days);
if(Date.parse(localDate)-Date.parse(days.at(-1).date)>3*86400000) throw new Error('Contribution source is stale; preserve previous published assets');
const data={schemaVersion:2,username:USERNAME,updatedDate:localDate,
  user:{login:profile.login,name:profile.name,public_repos:repos.length,followers:profile.followers,
    following:profile.following,public_gists:profile.public_gists,created_at:profile.created_at,
    location:profile.location},
  totalStars:repos.filter(r=>!r.fork).reduce((n,r)=>n+r.stars,0),
  languages:aggregateLanguages(repos),repositories:repos,calendar,
  contributions:{totalContributions:calendar.total,days},
  sources:{profile:`https://api.github.com/users/${USERNAME}`,calendar:calendarSource,
    languages:'GitHub language bytes; owned public non-forks; generated profile excluded'}};
await writeFile(new URL('../assets/profile-data.json',import.meta.url),JSON.stringify(data,null,2)+'\n');
await import('./render.mjs');
console.log(JSON.stringify({date:localDate,repos:repos.length,contributions:calendar.total,activeDays:calendar.activeDays}));
