// Offline chip proof: records the actual Canvas art calls as SVG; not a browser screenshot.
// Run from repository root: node game/tools/slum-floor-sample.cjs
const fs=require('fs'),vm=require('vm');
fs.mkdirSync('game/artifacts/slum-floor',{recursive:true});
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
clip(p){const id='clip'+serial++;this.defs.push(`<clipPath id="${id}"><path d="${this.path}"/></clipPath>`);this.clipId=id;} // Each sample has its own SVG viewport; canvas clipping is tested separately.

createLinearGradient(x1,y1,x2,y2){const id='grad'+serial++,stops=[],d=this.defs;d.push({toString:()=>`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.join('')}</linearGradient>`});return{addColorStop:(n,c)=>stops.push(`<stop offset="${n}" stop-color="${c}"/>`),toString:()=>`url(#${id})`}}
createRadialGradient(){return this.createLinearGradient(0,0,100,100)}
drawImage(c,x,y,w,h){this.defs.push(...c.g.defs);this.node(`<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${c.width} ${c.height}" overflow="hidden">${c.g.out.join('')}</svg>`)}
fillText(s,x,y){this.node(`<text x="${x}" y="${y}" fill="${this.fillStyle}" font-size="11" font-family="monospace">${esc(s)}</text>`)}
}
const source=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8'),ctx=new Canvas().g;
const env={Math,Path2D:Path,ctx,document:{createElement:()=>new Canvas()},W:640,H:360,WW:1408,WH:1000,G:{t:0},P:{x:-1000,y:-1000},DECO_CACHE:{},ALLIES:[],EN:[],HAZ:[],WAVES:[],srand(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296}}};
vm.createContext(env);vm.runInContext(source.slice(source.indexOf('const ART_VER='),source.indexOf('function pixBlob(')),env);
const panels=[];
for(let i=0;i<4;i++){
 const panel=new Canvas().g;env.ctx=panel;env.i=i;
 vm.runInContext(`constZoom=i===3?2:1;ctx.scale(constZoom,constZoom);constBx=i===1?WW-420:0;constBy=slumLane(5)-160;HAZ=i===2?[{type:'puddle',x:180,y:slumLane(5)-110,radius:26}]:[];ctx.translate(-constBx,-constBy);drawArtFloorStatic(ctx,BG_ART.slum,constBx,constBy,640/constZoom,360/constZoom,5);`,env);
 panels.push(`<svg x="${i%2*660}" y="${Math.floor(i/2)*390}" width="640" height="360" viewBox="0 0 640 360" overflow="hidden"><defs>${panel.defs.join('')}</defs>${panel.out.join('')}</svg><text x="${i%2*660+10}" y="${Math.floor(i/2)*390+378}" fill="#ddd" font-size="12">${['1x concrete / gutters / shoulder','1x right boundary','fixed hazard quiet zone (floor only)','2x detail'][i]}</text>`);
}
fs.writeFileSync('game/artifacts/slum-floor/sample.svg',`<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="780">${panels.join('')}</svg>`);

const svg=fs.readFileSync('game/artifacts/slum-floor/sample.svg','utf8');
fs.writeFileSync('game/artifacts/slum-floor/sample.html',`<!doctype html><html lang="ja"><meta charset="utf-8"><title>slum 床サンプル</title><style>body{background:#111;color:#ddd;font:14px sans-serif}svg{max-width:100%;height:auto}label{display:block;margin:12px}body:has(input:checked) svg{filter:grayscale(1)}</style><h1>slum 床のみ・seed 5</h1><p>上段: 通路と路肩、右側の境界。下段: puddle 静穏域（hazard 自体は非表示）、2倍拡大。Canvas の描画命令を SVG 化したオフライン資料です。</p><label><input type="checkbox">グレースケール</label>${svg}</html>`);
