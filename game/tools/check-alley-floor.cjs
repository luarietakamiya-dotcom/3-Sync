// Usage: node game/tools/check-front-floor.cjs [baseline index.html]
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
new vm.Script(source.match(/<script>([\s\S]*?)<\/script>/)[1]);
function environment(src){let ops=0;const g=new Proxy({getTransform:()=>({a:1,b:0,c:0,d:1}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get(t,k){return k in t?t[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert(Number.isFinite(v),k);ops++;}},set(t,k,v){t[k]=v;return true;}});
 const env={Math:Object.create(Math),ctx:g,document:{createElement:()=>({width:0,height:0,getContext:()=>g})},Path2D:class{},W:640,H:360,WW:1408,WH:1000,G:{t:0},P:{x:700,y:500},HAZ:[],CAM:{x:0,y:0},EN:[],ALLIES:[],WAVES:[],assert,srand(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296}}};vm.createContext(env);vm.runInContext(src.slice(src.indexOf('const ART_VER='),src.indexOf('function pixBlob(')),env);return env;}
const e=environment(source),base=process.argv[2]&&environment(fs.readFileSync(process.argv[2],'utf8'));

for(let seed=0;seed<100;seed++){e.seed=seed;if(base)base.seed=seed;
 const hazards=[{type:'puddle',x:330,y:250,radius:26},{type:'electric',x:330,y:500,w:70,h:26},{type:'noise',x:700,y:520,radius:55},{type:'rift',x:850,y:500},{type:'falling',marks:[]}];e.HAZ=hazards;if(base)base.HAZ=hazards;
 const a=vm.runInContext('JSON.stringify(genArtDeco(seed,BG_ART.alley))',e);assert.equal(a,vm.runInContext('JSON.stringify(genArtDeco(seed,BG_ART.alley))',e));if(base)assert.equal(a,vm.runInContext('JSON.stringify(genArtDeco(seed,BG_ART.alley))',base));
 vm.runInContext(`{assert.equal(alleyFloorPlan(seed).top,WH/2+40+(hh(seed,91,0)-.5)*32-60);const oldDeco=JSON.stringify(genArtDeco(seed,BG_ART.alley));drawAlleyFloorStatic(ctx,BG_ART.alley,0,62,WW,WH-62,seed);assert.equal(JSON.stringify(genArtDeco(seed,BG_ART.alley)),oldDeco);}`,e);
}
vm.runInContext(`
for(const h of HAZ.filter(h=>h.type!=='falling')){assert(!alleyFloorQuiet(h.x,h.y));assert(!alleyFloorQuiet(h.x+10,h.y));}
Math.random=()=>{throw Error('nondeterministic floor')};
for(const t of [0,1.625,3.25,6.5]){G.t=t;drawAlleyFloor(BG_ART.alley,0,62,640,360,5,[]);}
assert(FLOOR_CACHE_BYTES>0);G.t++;drawAlleyFloor(BG_ART.alley,700,400,640,360,5,[]);assert(FLOOR_BUILT<=2);
for(let n=0;n<120;n++){G.t++;ctx.getTransform=()=>({a:.25+(n%20)*.25,b:0,c:0,d:.25+(n%20)*.25});drawAlleyFloor(BG_ART.alley,0,62,640,360,n,[]);assert(FLOOR_CACHE_BYTES<=FLOOR_CACHE_CAP);assert(FLOOR_CACHE.size<=24);assert(FLOOR_CACHE_BYTES+ART_CACHE_BYTES<=ART_CACHE_CAP);}
ctx.getTransform=()=>({a:12,b:0,c:0,d:12});G.t++;drawAlleyFloor(BG_ART.alley,0,62,640,360,5,[]);assert(FLOOR_CACHE_BYTES<=FLOOR_CACHE_CAP);
ctx.getTransform=()=>({a:1,b:0,c:0,d:1});let recorded=[];ctx.fillRect=function(...args){assert(args.every(Number.isFinite));assert(args[2]>=0&&args[3]>=0);recorded.push([this.fillStyle,...args]);};
for(let seed=0;seed<25;seed++){
 recorded=[];drawAlleyFloorStatic(ctx,BG_ART.alley,0,62,WW,WH-62,seed);const before=JSON.stringify(recorded);G.t+=100;
 recorded=[];drawAlleyFloorStatic(ctx,BG_ART.alley,0,62,WW,WH-62,seed);assert.equal(JSON.stringify(recorded),before);
 for(const [color,x,y,w,h] of recorded)if(['#37322C','#423C34','#3A352F','#2A2130'].includes(color))assert(alleyFloorQuiet(x,y));
 const all=genArtDeco(seed,BG_ART.alley),ds=all.filter(d=>d.kind==='alley_lantern'||d.kind==='alley_fox'&&!all.some(l=>l.kind==='alley_lantern'&&Math.hypot(l.x-d.x,l.y-d.y)<=80)),steps=alleyFloorSteps(BG_ART.alley,seed);assert(steps.length>=ds.length*3&&steps.length<=ds.length*5);
 for(const st of steps){assert([5,6].includes(st.pts.length));assert(st.pts.every(p=>ds.some(d=>Math.hypot(p[0]-d.x,p[1]-d.y)<=40)));}
}
const key0=floorHazKey();HAZ.find(h=>h.type==='electric').w++;assert.notEqual(floorHazKey(),key0);
const key1=floorHazKey();HAZ.find(h=>h.type==='falling').marks.push({x:80,y:80,t:.3});assert.equal(floorHazKey(),key1);
assert([...FLOOR_CACHE.keys()].every(k=>k.startsWith('alley|')));
`,e);
console.log('PASS: syntax; 100 deterministic seeds and byte-identical baseline deco; floor does not change deco; static time invariance; all fixed hazard quiet zones; finite arguments; polygon counts and 40px range; 2/frame lazy generation; 24 chunks / 6MiB / shared 16MiB; scale fallback; hazard dimensions invalidate, falling marks do not');
