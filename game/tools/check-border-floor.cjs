// Usage: node game/tools/check-front-floor.cjs [baseline index.html]
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
new vm.Script(source.match(/<script>([\s\S]*?)<\/script>/)[1]);
function environment(src){let ops=0;const g=new Proxy({getTransform:()=>({a:1,b:0,c:0,d:1}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get(t,k){return k in t?t[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert(Number.isFinite(v),k);ops++;}},set(t,k,v){t[k]=v;return true;}});
 const env={Math:Object.create(Math),ctx:g,document:{createElement:()=>({width:0,height:0,getContext:()=>g})},Path2D:class{},W:640,H:360,WW:1408,WH:1000,G:{t:0},P:{x:700,y:500},HAZ:[],CAM:{x:0,y:0},EN:[],ALLIES:[],WAVES:[],assert,srand(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296}}};vm.createContext(env);vm.runInContext(src.slice(src.indexOf('const ART_VER='),src.indexOf('function pixBlob(')),env);return env;}
const e=environment(source),base=process.argv[2]&&environment(fs.readFileSync(process.argv[2],'utf8'));
for(let seed=0;seed<100;seed++){e.seed=seed;if(base)base.seed=seed;const hazards=[{type:'electric',x:330,y:250,w:70,h:26},{type:'noise',x:700,y:520,radius:55}];e.HAZ=hazards;if(base)base.HAZ=hazards;
 const a=vm.runInContext('JSON.stringify(genArtDeco(seed,BG_ART.border))',e);assert.equal(a,vm.runInContext('JSON.stringify(genArtDeco(seed,BG_ART.border))',e));if(base)assert.equal(a,vm.runInContext('JSON.stringify(genArtDeco(seed,BG_ART.border))',base));
 vm.runInContext(`constPlan=borderFloorPlan(seed);assert.equal((constPlan.top-62)%64,0);assert.equal(constPlan.bottom-constPlan.top,128);assert(Math.abs(constPlan.band-WW/2)>70);assert((constPlan.band>=WW*.25-1&&constPlan.band<=WW*.40)||(constPlan.band>=WW*.60-1&&constPlan.band<=WW*.75));`,e);
}
vm.runInContext(`
for(const h of HAZ){assert(!borderFloorQuiet(h.x,h.y));assert(!borderFloorQuiet(h.x,h.y+20));}
Math.random=()=>{throw Error('nondeterministic floor')};
for(const t of [0,1.625,3.25,6.5]){G.t=t;drawBorderFloor(BG_ART.border,0,62,640,360,5,[]);}
const first=FLOOR_CACHE_BYTES;assert(first>0);G.t++;drawBorderFloor(BG_ART.border,700,400,640,360,5,[]);assert(FLOOR_BUILT<=2);
for(let n=0;n<120;n++){G.t++;ctx.getTransform=()=>({a:.25+(n%20)*.25,b:0,c:0,d:.25+(n%20)*.25});drawBorderFloor(BG_ART.border,0,62,640,360,n,[]);assert(FLOOR_CACHE_BYTES<=FLOOR_CACHE_CAP);assert(FLOOR_CACHE.size<=24);assert(FLOOR_CACHE_BYTES+ART_CACHE_BYTES<=ART_CACHE_CAP);}
// Oversize scales fall back without allocating an over-budget canvas.
ctx.getTransform=()=>({a:12,b:0,c:0,d:12});G.t++;drawBorderFloor(BG_ART.border,0,62,640,360,5,[]);assert(FLOOR_CACHE_BYTES<=FLOOR_CACHE_CAP);
`,e);

vm.runInContext(`
ctx.getTransform=()=>({a:1,b:0,c:0,d:1});
let recorded=[];ctx.fillRect=function(...args){assert(args.every(Number.isFinite));assert(args[2]>=0&&args[3]>=0);recorded.push([this.fillStyle,...args]);};
for(let seed=0;seed<25;seed++){
 HAZ=[{type:'electric',x:340,y:320,w:100,h:40},{type:'noise',x:920,y:500,radius:70}];
 recorded=[];drawBorderFloorStatic(ctx,BG_ART.border,0,62,WW,WH-62,seed);const before=JSON.stringify(recorded);G.t+=100;
 recorded=[];drawBorderFloorStatic(ctx,BG_ART.border,0,62,WW,WH-62,seed);assert.equal(JSON.stringify(recorded),before);
 for(const [color,x,y,w,h] of recorded)if(['#30353A','#1B1E21','rgba(168,188,208,.30)'].includes(color))assert(borderFloorQuiet(x,y));
 const dots=recorded.filter(a=>a[0]==='rgba(168,188,208,.30)');
 for(let y=62;y<WH;y+=17)for(let x=0;x<WW;x+=19)assert(dots.filter(d=>d[1]>=x&&d[1]<x+W&&d[2]>=y&&d[2]<y+H).length<=6);
}
// Hazard dimensions must invalidate chunks even when position is unchanged.
const key0=floorHazKey();HAZ[0].w++;assert.notEqual(floorHazKey(),key0);
assert([...FLOOR_CACHE.keys()].every(k=>k.startsWith('border|')));
`,e);
e.WAVES=[];e.shadow=()=>{};
vm.runInContext(fs.readFileSync(path.join(__dirname,'check-border-variety.cjs'),'utf8'),e);
console.log('PASS: syntax; 100 reproducible seeds; byte-identical baseline deco; lane and spawn-safe band; hazard quiet; finite arguments; 2/frame lazy generation; 24 chunk / 6MiB / shared 16MiB caps; scale fallback');
