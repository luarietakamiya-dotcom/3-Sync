// Offline chip proof: records the actual Canvas art calls as SVG; not a browser screenshot.
// Run from repository root: node game/tools/border-variety-gallery.cjs
const fs=require('fs'),vm=require('vm');
fs.mkdirSync('game/artifacts/border-variety',{recursive:true});
let serial=0;
class Path {constructor(){this.d=''} moveTo(x,y){this.d+=`M${x} ${y}`}lineTo(x,y){this.d+=`L${x} ${y}`}closePath(){this.d+='Z'}}
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
class Canvas {constructor(){this.width=1600;this.height=900;this.g=new Ctx(this)}getContext(){return this.g}}
class Ctx {constructor(c){this.canvas=c;this.out=[];this.defs=[];this.fillStyle='#000';this.strokeStyle='#000';this.globalAlpha=1;this.lineWidth=1;this.transform='';this.stack=[];this.path='';this.clipId=''}
getTransform(){return {a:1,b:0}}save(){this.stack.push([this.transform,this.globalAlpha,this.fillStyle,this.strokeStyle,this.clipId])}restore(){[this.transform,this.globalAlpha,this.fillStyle,this.strokeStyle,this.clipId]=this.stack.pop()}
translate(x,y){this.transform+=` translate(${x} ${y})`}scale(x,y){this.transform+=` scale(${x} ${y})`}rotate(a){this.transform+=` rotate(${a*180/Math.PI})`}
node(s){this.out.push(`<g transform="${this.transform}" opacity="${this.globalAlpha}"${this.clipId?` clip-path="url(#${this.clipId})"`:''}>${s}</g>`)}
fillRect(x,y,w,h){this.node(`<rect x="${x}" y="${y}" width="${Math.max(0,w)}" height="${Math.max(0,h)}" fill="${this.fillStyle}"/>`)}
beginPath(){this.path=''}moveTo(x,y){this.path+=`M${x} ${y}`}lineTo(x,y){this.path+=`L${x} ${y}`}closePath(){this.path+='Z'}rect(x,y,w,h){this.path+=`M${x} ${y}h${w}v${h}h${-w}Z`}
ellipse(x,y,rx,ry){this.path+=`M${x-rx} ${y}a${rx} ${ry} 0 1 0 ${rx*2} 0a${rx} ${ry} 0 1 0 ${-rx*2} 0`}arc(x,y,r){this.ellipse(x,y,r,r)}
fill(){this.node(`<path d="${this.path}" fill="${this.fillStyle}"/>`)}stroke(){this.node(`<path d="${this.path}" fill="none" stroke="${this.strokeStyle}" stroke-width="${this.lineWidth}"/>`)}
clip(p){const id='clip'+serial++;this.defs.push(`<clipPath id="${id}"><path d="${p?p.d:this.path}"/></clipPath>`);this.clipId=id}
createLinearGradient(x1,y1,x2,y2){const id='grad'+serial++,stops=[],d=this.defs;d.push({toString:()=>`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.join('')}</linearGradient>`});return{addColorStop:(n,c)=>stops.push(`<stop offset="${n}" stop-color="${c}"/>`),toString:()=>`url(#${id})`}}
createRadialGradient(){return this.createLinearGradient(0,0,100,100)}
drawImage(c,...args){let [x,y,w,h]=args;if(args.length===8){const [sx,sy,sw,sh,dx,dy,dw,dh]=args;this.defs.push(...c.g.defs);this.node(`<svg x="${dx}" y="${dy}" width="${dw}" height="${dh}" viewBox="${sx} ${sy} ${sw} ${sh}" overflow="hidden">${c.g.out.join('')}</svg>`);return;}this.defs.push(...c.g.defs);this.node(`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${c.width} ${c.height}" overflow="hidden">${c.g.out.join('')}</svg>`)}
fillText(s,x,y){this.node(`<text x="${x}" y="${y}" fill="${this.fillStyle}" font-size="11" font-family="monospace">${esc(s)}</text>`)}
}
const source=fs.readFileSync('game/index.html','utf8'),ctx=new Canvas().g;
const env={Math,hh:(a,b,c)=>((Math.sin(a*12.9+b*78.2+c)*43758)%1+1)%1,teleK:()=>1,Path2D:Path,ctx,document:{createElement:()=>new Canvas()},W:640,H:360,WW:1600,WH:1600,G:{t:.2},P:{x:-1000,y:-1000},ALLIES:[],EN:[],HAZ:[],WAVES:[],shadow(){},srand(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296}}};
vm.createContext(env);vm.runInContext(source.slice(source.indexOf('const ART_VER='),source.indexOf('function pixBlob(')),env);
vm.runInContext(`
const specs={border_stele:{w:36,h:62},border_stone:{w:18,h:28},border_quartz:{w:34,h:40}};const ids=Object.keys(specs);let column=0;
for(const ground of [false,true])for(const scale of [1,2]){
 const top=(ground?440:0)+(scale===2?160:0);
 ctx.fillStyle=ground?'#101821':'#363B42';ctx.fillRect(0,top,1600,scale===2?270:155);
 if(ground)drawBorderFloor(BG_ART.border,0,top,1600,scale===2?270:155,5,[]);
 ids.forEach((kind,i)=>{const o=BG_ART.border.objs[kind];ctx.fillStyle='#E8DFFF';ctx.fillText(kind+' '+scale+'x',i*400+12,top+18);ctx.save();ctx.translate(i*400+98,top+(scale===2?225:123));ctx.scale(scale,scale);const d={kind,x:0,y:0,v:0,ph:0,w:o.w,h:o.h,al:1};drawArtDeco(d,ART_DRAW[kind]);if(kind==="border_stone")drawArtDeco({...d,x:38,ph:2},ART_DRAW[kind]);ctx.restore();});
}`,env);
if(process.env.BORDER_CHECK)vm.runInContext(fs.readFileSync('game/tools/check-border-variety.cjs','utf8'),env);
fs.writeFileSync('game/artifacts/border-variety/chips.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="880"><defs>${ctx.defs.join('')}</defs>${ctx.out.join('')}</svg>`);
