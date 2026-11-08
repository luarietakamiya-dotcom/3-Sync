// Usage: node game/tools/check-live-floor.cjs [baseline index.html]
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
new vm.Script(source.match(/<script>([\s\S]*?)<\/script>/)[1]);
function environment(src){let ops=0;const g=new Proxy({getTransform:()=>({a:1,b:0,c:0,d:1}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get(t,k){return k in t?t[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert(Number.isFinite(v),k);ops++;}},set(t,k,v){t[k]=v;return true;}});
 const env={Math:Object.create(Math),ctx:g,document:{createElement:()=>({width:0,height:0,getContext:()=>g})},Path2D:class{},W:640,H:360,WW:1408,WH:1000,G:{t:0},P:{x:700,y:500},HAZ:[],CAM:{x:0,y:0},EN:[],ALLIES:[],WAVES:[],assert,srand(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296}}};vm.createContext(env);vm.runInContext(src.slice(src.indexOf('const ART_VER='),src.indexOf('function pixBlob(')),env);return env;}
const e=environment(source),base=process.argv[2]&&environment(fs.readFileSync(process.argv[2],'utf8'));

for(let seed=0;seed<100;seed++){e.seed=seed;if(base)base.seed=seed;
 const hazards=[{type:'puddle',x:330,y:250,radius:26},{type:'electric',x:330,y:500,w:70,h:26},{type:'noise',x:700,y:520,radius:55},{type:'rift',x:850,y:500},{type:'falling',marks:[]}];e.HAZ=hazards;if(base)base.HAZ=hazards;
 const a=vm.runInContext('JSON.stringify(genArtDeco(seed,BG_ART.live))',e);assert.equal(a,vm.runInContext('JSON.stringify(genArtDeco(seed,BG_ART.live))',e));if(base)assert.equal(a,vm.runInContext('JSON.stringify(genArtDeco(seed,BG_ART.live))',base));
 vm.runInContext(`{const oldDeco=JSON.stringify(genArtDeco(seed,BG_ART.live));drawLiveFloorStatic(ctx,BG_ART.live,0,62,WW,WH-62,seed);assert.equal(JSON.stringify(genArtDeco(seed,BG_ART.live)),oldDeco);}`,e);
}
vm.runInContext(`
for(const h of HAZ.filter(h=>h.type==='electric')){assert(!liveFloorQuiet(h.x,h.y));assert(!liveFloorQuiet(h.x+10,h.y));}
Math.random=()=>{throw Error('nondeterministic floor')};
for(const t of [0,1.625,3.25,6.5]){G.t=t;drawLiveFloor(BG_ART.live,0,62,640,360,5,[]);}
assert(FLOOR_CACHE_BYTES>0);G.t++;drawLiveFloor(BG_ART.live,700,400,640,360,5,[]);assert(FLOOR_BUILT<=2);
for(let n=0;n<120;n++){G.t++;ctx.getTransform=()=>({a:.25+(n%20)*.25,b:0,c:0,d:.25+(n%20)*.25});drawLiveFloor(BG_ART.live,0,62,640,360,n,[]);assert(FLOOR_CACHE_BYTES<=FLOOR_CACHE_CAP);assert(FLOOR_CACHE.size<=24);assert(FLOOR_CACHE_BYTES+ART_CACHE_BYTES<=ART_CACHE_CAP);}
ctx.getTransform=()=>({a:12,b:0,c:0,d:12});G.t++;drawLiveFloor(BG_ART.live,0,62,640,360,5,[]);assert(FLOOR_CACHE_BYTES<=FLOOR_CACHE_CAP);
ctx.getTransform=()=>({a:1,b:0,c:0,d:1});let recorded=[];ctx.fillRect=function(...args){assert(args.every(Number.isFinite));assert(args[2]>=0&&args[3]>=0);recorded.push([this.fillStyle,...args]);};
HAZ=[{type:'electric',x:180,y:168,w:100,h:36},{type:'electric',x:110,y:400,w:70,h:26}];
for(let seed=0;seed<25;seed++){
 recorded=[];drawLiveFloorStatic(ctx,BG_ART.live,0,62,WW,WH-62,seed);const before=JSON.stringify(recorded);G.t+=100;
 recorded=[];drawLiveFloorStatic(ctx,BG_ART.live,0,62,WW,WH-62,seed);assert.equal(JSON.stringify(recorded),before);
 for(const [color,x,y,w,h] of recorded)if(['#2C2532','#3A2A28'].includes(color))for(let j=0;j<h;j++)for(let i=0;i<w;i++)assert(liveFloorQuiet(x+i,y+j));

}
HAZ.push({type:'falling',marks:[]});
const key0=floorHazKey();HAZ.find(h=>h.type==='electric').w++;assert.notEqual(floorHazKey(),key0);
const key1=floorHazKey();HAZ.find(h=>h.type==='falling').marks.push({x:80,y:80,t:.3});assert.equal(floorHazKey(),key1);
assert([...FLOOR_CACHE.keys()].every(k=>k.startsWith('live|')));
`,e);
console.log('PASS: syntax; 100 deterministic seeds and byte-identical baseline deco; floor does not change deco; static time invariance; electric quiet zones; finite arguments; 2/frame lazy generation; 24 chunks / 6MiB / shared 16MiB; scale fallback; hazard dimensions invalidate, falling marks do not');

// Compare actual static fill commands rasterized at 1x, with canvas rectangular clipping.
vm.runInContext(`{
const width=WW,height=WH,colors=new Map();
function raster(){const pixels=new Uint32Array(width*height);let clip=[0,62,width,height],pending=clip,stack=[];return {pixels,globalAlpha:1,save(){stack.push([...clip])},restore(){clip=stack.pop()},beginPath(){},rect(x,y,w,h){pending=[x,y,x+w,y+h]},clip(){clip=[Math.max(clip[0],pending[0]),Math.max(clip[1],pending[1]),Math.min(clip[2],pending[2]),Math.min(clip[3],pending[3])]},fillRect(x,y,w,h){const key=this.fillStyle+'|'+this.globalAlpha;if(!colors.has(key))colors.set(key,colors.size+1);const v=colors.get(key),x0=Math.max(clip[0],x),x1=Math.min(clip[2],x+w),y0=Math.max(clip[1],y),y1=Math.min(clip[3],y+h);for(let j=y0;j<y1;j++)pixels.fill(v,j*width+x0,j*width+x1);}};}
const full=raster(),chunks=raster();drawLiveFloorStatic(full,BG_ART.live,0,62,WW,WH-62,17);
for(let y=0;y<WH;y+=256)for(let x=0;x<WW;x+=256)drawLiveFloorStatic(chunks,BG_ART.live,x,y,256,256,17);
assert.deepEqual(full.pixels,chunks.pixels);
}`,e);
console.log('PASS: 1x static full-map and chunked raster equivalence, including stage lips and allocation bands');
