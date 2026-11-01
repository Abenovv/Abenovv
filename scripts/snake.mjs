// A closed grid route: all body segments remain visible and inside the calendar.
export function calendarRoute(columns,offset=0){
 if(!Number.isInteger(columns)||columns<2)throw Error('Calendar needs at least two columns');
 const even=columns-columns%2,route=[[0,0]];
 for(let y=1;y<7;y++)route.push([0,y]);
 for(let x=1;x<even;x++)for(let k=0;k<6;k++)route.push([x,x%2?6-k:1+k]);
 for(let x=even-1;x>0;x--)route.push([x,0]);
 if(columns%2){for(let i=route.length-1;i>=0;i--){const a=route[i],b=route[(i+1)%route.length];if(a[0]===even-1&&b[0]===even-1&&Math.abs(a[1]-b[1])===1&&Math.min(a[1],b[1])%2===0)route.splice(i+1,0,[even,a[1]],[even,b[1]]);}}
 // The sole omitted corner in an odd grid is always outside the actual date range.
 return columns%2&&offset>0?route.map(([x,y])=>[columns-1-x,6-y]):route;
}
export function buildSnake(data){
 const days=data.contributions.days,offset=new Date(days[0].date+'T00:00:00Z').getUTCDay(),columns=Math.ceil((days.length+offset)/7),route=calendarRoute(columns,offset),n=route.length;
 const index=new Map(route.map(([x,y],i)=>[`${x},${y}`,i])),palette=['#101e33','#17375e','#245c96','#398fce','#8bd8ff'],max=Math.max(1,...days.map(d=>d.count));
 const lookup=new Map(days.map((d,i)=>[`${Math.floor((i+offset)/7)},${(i+offset)%7}`,d]));
 let cells='',css='';
 for(let x=0;x<columns;x++)for(let y=0;y<7;y++){const d=lookup.get(`${x},${y}`),level=d?.count?Math.min(4,Math.ceil(d.count/max*4)):0,color=palette[level],i=index.get(`${x},${y}`);if(d&&!Number.isInteger(i))throw Error('Route omitted an actual calendar date');
 let style='';if(level&&i!==undefined){const pct=((i+.5)/n*100).toFixed(5);css+=`@keyframes c${x}_${y}{0%,${pct}%{fill:${color}}${Math.min(99.99999,Number(pct)+.00001)}%,100%{fill:${palette[0]}}}`;style=` style="animation:c${x}_${y} 32s linear infinite"`;}
 cells+=`<rect x="${12+x*14}" y="${12+y*14}" width="10" height="10" rx="2" fill="${color}"${style}${d?` data-date="${d.date}" data-count="${d.count}"`:''}/>`;}
 let snake='';for(let j=3;j>=0;j--){let frames='';for(let k=0;k<=n;k++){const [x,y]=route[(k-j+n)%n];frames+=`${(k/n*100).toFixed(5)}%{transform:translate(${12+x*14}px,${12+y*14}px)}`;}
 css+=`@keyframes s${j}{${frames}}`;const [x,y]=route[(n-j)%n];snake+=`<rect class="snake-segment" data-segment="${j}" x="0" y="0" width="10" height="10" rx="3" fill="${['#b8e8ff','#8fd9ff','#74ccff','#55b5f0'][j]}" style="transform:translate(${12+x*14}px,${12+y*14}px);animation:s${j} 32s linear infinite"/>`;}
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${columns*14+20}" height="118" viewBox="0 0 ${columns*14+20} 118" role="img"><title>${data.calendar.total} public contributions, blue snake following a closed route inside the calendar</title><style>${css}</style>${cells}${snake}</svg>\n`;
}
