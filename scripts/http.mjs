// SPDX-License-Identifier: GPL-3.0-or-later
// Retry temporary failures without replacing the last successful public assets.
export async function requestJson(url, {fetchImpl=fetch, sleep=ms=>new Promise(r=>setTimeout(r,ms)), ...init}={}) {
  const target=new URL(url);
  if(target.protocol!=='https:' || !['api.github.com','github-contributions-api.jogruber.de'].includes(target.hostname))
    throw new Error('Unexpected profile data host');
  for(let attempt=0;attempt<3;attempt++) {
    let response;
    try {
      response=await fetchImpl(url,{...init,signal:AbortSignal.timeout(30000)});
    } catch(error) {
      if(attempt===2) throw new Error('Profile data request failed after three attempts',{cause:error});
    }
    if(response?.ok) return response.json();
    if(response && response.status<500 && response.status!==429)
      throw new Error(`Profile data HTTP ${response.status}: ${target.pathname}`);
    if(attempt===2) throw new Error(`Profile data unavailable: ${target.pathname}`);
    await sleep(1000*2**attempt);
  }
}
