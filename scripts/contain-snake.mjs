// Keep the generated snake inside the dated calendar while leaving its timeline intact.
export function containSnake(svg){
 if(svg.includes('id="snake-grid-clip"')){
 const clip=svg.match(/<clipPath[^>]*id="snake-grid-clip"[^>]*><rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/);
 if(!clip)throw Error('Malformed calendar clip');
 return cropCanvas(svg,...clip.slice(1));
 }
 const cells=[...svg.matchAll(/<rect\b[^>]*class="c(?: [^"]*)?"[^>]*>/g)].map(m=>({x:Number(m[0].match(/\bx="([\d.-]+)"/)[1]),y:Number(m[0].match(/\by="([\d.-]+)"/)[1])}));
 if(!cells.length)throw Error('Snake SVG has no calendar cells');
 const minX=Math.min(...cells.map(c=>c.x)),minY=Math.min(...cells.map(c=>c.y));
 const width=Math.max(...cells.map(c=>c.x))+12-minX,height=Math.max(...cells.map(c=>c.y))+12-minY;
 const snakes=[...svg.matchAll(/<rect\b[^>]*class="s [^"]*"[^>]*\/>/g)].map(m=>m[0]);
 if(!snakes.length)throw Error('Snake SVG has no snake segments');
 svg=svg.replace(/<rect\b[^>]*class="s [^"]*"[^>]*\/>/g,'');
 return cropCanvas(svg.replace('</svg>',`<defs><clipPath id="snake-grid-clip" clipPathUnits="userSpaceOnUse"><rect x="${minX}" y="${minY}" width="${width}" height="${height}"/></clipPath></defs><g clip-path="url(#snake-grid-clip)">${snakes.join('')}</g></svg>`),minX,minY,width,height);
}

function cropCanvas(svg,x,y,width,height){return svg.replace(/<svg\b[^>]*>/,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${height}" width="${width}" height="${height}" overflow="hidden">`);}
