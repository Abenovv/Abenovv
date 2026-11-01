import {createCanvas,loadImage} from '@napi-rs/canvas';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dir=new URL('../assets/',import.meta.url),w=433,h=577;
const src=process.argv[2];if(!src)throw Error('Pass the local approved portrait source path');
const photo=await loadImage(await readFile(src)),input=createCanvas(w,h),ctx=input.getContext('2d');ctx.drawImage(photo,0,0);const p=ctx.getImageData(0,0,w,h),lum=new Float32Array(w*h),alpha=new Float32Array(w*h);
for(let i=0;i<w*h;i++){alpha[i]=p.data[4*i+3]/255;lum[i]=(p.data[4*i]*.2126+p.data[4*i+1]*.7152+p.data[4*i+2]*.0722)/255;}
function sample(x,y,values=lum){x=Math.max(0,Math.min(w-1,x));y=Math.max(0,Math.min(h-1,y));let ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;let at=(a,b)=>values[Math.min(h-1,b)*w+Math.min(w-1,a)];return at(ix,iy)*(1-fx)*(1-fy)+at(ix+1,iy)*fx*(1-fy)+at(ix,iy+1)*(1-fx)*fy+at(ix+1,iy+1)*fx*fy;}
const adjusted=new Float32Array(w*h);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){let i=y*w+x,sum=0;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++)sum+=sample(x+dx,y+dy);let v=lum[i]+.65*(lum[i]-sum/49);adjusted[i]=Math.max(0,Math.min(1,(v-.35)*1.2+.35));}
const out=createCanvas(1299,1731),c=out.getContext('2d');
const cols=180,rows=120,cw=out.width/cols,ch=out.height/rows,thresholds=[[.10,.54],[.73,.31],[.24,.66],[.47,.04]];
let dots=0;const groups=new Map();
for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)for(let dy=0;dy<4;dy++)for(let dx=0;dx<2;dx++){
 const sx=(x+(dx+.5)/2)*w/cols,sy=(y+(dy+.5)/4)*h/rows,opacity=sample(sx,sy,alpha);if(opacity<.1)continue;
 const v=sample(sx,sy,adjusted);let t=Math.pow(v,.84);if(t<thresholds[dy][dx]*.85)continue;
 // Keep the eight-dot Braille cell geometry explicit instead of relying on font metrics.
 const light=.18+.82*Math.pow(v,.62),blue=[Math.round(24+174*light),Math.round(80+155*light),Math.round(145+110*light)];
 c.fillStyle=`rgba(${blue.join(',')},${opacity.toFixed(3)})`;
 const px=(x+.10+(dx+.5)*.40)*cw,py=(y+.07+(dy+.5)*.215)*ch;
 const key=blue.join(',');const paths=groups.get(key)||[];paths.push(`M${(px*2/3).toFixed(2)} ${(py*2/3).toFixed(2)}h.001`);groups.set(key,paths);
 c.beginPath();c.ellipse(px,py,cw*.18,ch*.09,0,0,Math.PI*2);c.fill();dots++;
}

const paths=[...groups].map(([rgb,segments])=>`<path stroke="rgb(${rgb})" d="${segments.join('')}"/>`).join('');
const prefix='<svg xmlns="http://www.w3.org/2000/svg" width="866" height="1154" viewBox="0 0 866 1154"><title>Yerkebulan Abenov, full portrait in refined blue Braille</title>';
const art=`<g id="portrait-dots" fill="none" stroke-width="1.732" stroke-linecap="round">${paths}</g>`;
await writeFile(new URL('portrait-full.svg',dir),prefix+art+'</svg>');
const motion='<defs><filter id="portrait-light"><feComponentTransfer><feFuncR type="linear" slope="1.2"/><feFuncG type="linear" slope="1.2"/><feFuncB type="linear" slope="1.2"/></feComponentTransfer></filter><linearGradient id="shine" x1="0" y1="0" x2="0" y2="1"><stop stop-color="white" stop-opacity="0"/><stop offset=".5" stop-color="white" stop-opacity=".18"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="code-sweep" maskUnits="userSpaceOnUse" x="0" y="0" width="866" height="1154"><rect y="-160" width="866" height="160" fill="url(#shine)"><animate attributeName="y" from="-160" to="1154" begin=".2s" dur="2.8s" repeatCount="1" fill="freeze"/></rect></mask></defs>';
await writeFile(new URL('portrait-full-motion.svg',dir),prefix+motion+art+'<g mask="url(#code-sweep)"><use href="#portrait-dots" filter="url(#portrait-light)"/></g></svg>');
const large=createCanvas(4330,5770);large.getContext('2d').imageSmoothingEnabled=false;large.getContext('2d').drawImage(out,0,0,4330,5770);await writeFile(new URL('portrait-full.png',dir),large.toBuffer('image/png'));
await writeFile(new URL('portrait-proof.json',dir),JSON.stringify({sourceHash:createHash('sha256').update(await readFile(src)).digest('hex'),sourceWidth:w,sourceHeight:h,crop:{x:0,y:0,width:w,height:h},outputWidth:4330,outputHeight:5770,cols,rows,dots,style:'refined-blue-braille',background:'transparent',palette:'original-refined-B',approvedPreviewHash:createHash('sha256').update(out.toBuffer('image/png')).digest('hex')},null,2));
console.log(`Generated approved refined B: ${dots} dots, full portrait, original soft-blue palette.`);
