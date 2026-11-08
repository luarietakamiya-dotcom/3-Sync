// Offline chip proof: records the actual Canvas art calls as SVG; not a browser screenshot.
// Run from repository root: node game/tools/front-variety-gallery.cjs
const fs=require('fs'),vm=require('vm');
fs.mkdirSync('game/artifacts/border-floor',{recursive:true});
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
drawImage(c,x,y,w,h){this.defs.push(...c.g.defs);this.node(`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${c.width} ${c.height}" overflow="hidden">${c.g.out.join('')}</svg>`)}
fillText(s,x,y){this.node(`<text x="${x}" y="${y}" fill="${this.fillStyle}" font-size="11" font-family="monospace">${esc(s)}</text>`)}
}
const source=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8'),ctx=new Canvas().g;
const env={Math,Path2D:Path,ctx,document:{createElement:()=>new Canvas()},W:640,H:360,WW:1408,WH:1000,G:{t:0},P:{x:-1000,y:-1000},ALLIES:[],EN:[],HAZ:[],WAVES:[],srand(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296}}};
vm.createContext(env);vm.runInContext(source.slice(source.indexOf('const ART_VER='),source.indexOf('function pixBlob(')),env);
vm.runInContext(`for(let i=0;i<4;i++){ctx.save();ctx.translate((i%2)*660,Math.floor(i/2)*390);const zoom=i===3?2:1;ctx.scale(zoom,zoom);const bx=borderFloorPlan(5).band-160/zoom;ctx.translate(-bx,-480);drawBorderFloorStatic(ctx,BG_ART.border,bx,480,640/zoom,360/zoom,5);ctx.restore();ctx.fillStyle='#dddddd';ctx.fillText(i===3?'2x detail':'border floor seed 5',(i%2)*660+10,Math.floor(i/2)*390+378);}`,env);
fs.writeFileSync('game/artifacts/border-floor/sample.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="780"><defs>${ctx.defs.join('')}</defs>${ctx.out.join('')}</svg>`);
