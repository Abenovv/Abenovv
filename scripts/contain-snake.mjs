// Keep the generated snake inside the dated calendar while leaving its timeline intact.
export function containSnake(svg){
 if(svg.includes('id="snake-grid-clip"'))return svg;
 const cells=[...svg.matchAll(/<rect\b[^>]*class="c(?: [^"]*)?"[^>]*>/g)].map(m=>({x:Number(m[0].match(/\bx="([\d.-]+)"/)[1]),y:Number(m[0].match(/\by="([\d.-]+)"/)[1])}));
 if(!cells.length)throw Error('Snake SVG has no calendar cells');
 const minX=Math.min(...cells.map(c=>c.x)),minY=Math.min(...cells.map(c=>c.y));
 const width=Math.max(...cells.map(c=>c.x))+12-minX,height=Math.max(...cells.map(c=>c.y))+12-minY;
 const snakes=[...svg.matchAll(/<rect\b[^>]*class="s [^"]*"[^>]*\/>/g)].map(m=>m[0]);
 if(!snakes.length)throw Error('Snake SVG has no snake segments');
 svg=svg.replace(/<rect\b[^>]*class="s [^"]*"[^>]*\/>/g,'');
 return svg.replace('</svg>',`<defs><clipPath id="snake-grid-clip" clipPathUnits="userSpaceOnUse"><rect x="${minX}" y="${minY}" width="${width}" height="${height}"/></clipPath></defs><g clip-path="url(#snake-grid-clip)">${snakes.join('')}</g></svg>`);
}
