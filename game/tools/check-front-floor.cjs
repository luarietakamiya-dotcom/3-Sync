// Usage: node game/tools/check-front-floor.cjs [baseline index.html]
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
new vm.Script(source.match(/<script>([\s\S]*?)<\/script>/)[1]);
function environment(src){let ops=0;const g=new Proxy({getTransform:()=>({a:1,b:0,c:0,d:1}),createRadialGradient:()=>({addColorStop(){}})}, {get(t,k){return k in t?t[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert(Number.isFinite(v),k);ops++;}},set(t,k,v){t[k]=v;return true;}});
 const env={Math:Object.create(Math),ctx:g,document:{createElement:()=>({width:0,height:0,getContext:()=>g})},Path2D:class{},W:640,H:360,WW:1408,WH:1000,G:{t:0},P:{x:700,y:500},HAZ:[],EN:[],ALLIES:[],WAVES:[],assert,srand(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296}}};vm.createContext(env);vm.runInContext(src.slice(src.indexOf('const ART_VER='),src.indexOf('function pixBlob(')),env);return env;}
const e=environment(source),base=process.argv[2]&&environment(fs.readFileSync(process.argv[2],'utf8'));
for(let seed=0;seed<100;seed++){e.seed=seed;if(base)base.seed=seed;const hazards=[{type:'rift',x:330,y:250},{type:'noise',x:700,y:520,radius:55}];e.HAZ=hazards;if(base)base.HAZ=hazards;
 const a=vm.runInContext('JSON.stringify(genArtDeco(seed,BG_ART.front))',e);assert.equal(a,vm.runInContext('JSON.stringify(genArtDeco(seed,BG_ART.front))',e));if(base)assert.equal(a,vm.runInContext('JSON.stringify(genArtDeco(seed,BG_ART.front))',base));
 vm.runInContext(`constPlan=frontFloorPlan(seed);assert(constPlan.veins.length>=2&&constPlan.veins.length<=4);for(const v of constPlan.veins){let len=0;for(let i=1;i<v.ps.length;i++)len+=Math.hypot(v.ps[i][0]-v.ps[i-1][0],v.ps[i][1]-v.ps[i-1][1]);assert(len>=160&&len<=420);}for(let y=62;y<WH;y+=20){assert(constPlan.veins.filter(v=>v.ps.some(p=>p[1]>=y-2&&p[1]<=y+H+2)).length<=2);assert(constPlan.veins.filter(v=>v.ps[0][1]+90>=y&&v.ps[0][1]<=y+H).length<=1);}assert(Math.abs(62+constPlan.step*80-(WH/2+40))>70);`,e);
}
vm.runInContext(`
for(const h of HAZ){assert.equal(floorHazAlpha(h.x,h.y),0);assert.equal(floorHazAlpha(h.x,h.y+20),0);}
Math.random=()=>{throw Error('nondeterministic floor')};
for(const t of [0,1.625,3.25,6.5]){G.t=t;drawFrontFloor(BG_ART.front,0,62,640,360,5,[]);}
const first=FLOOR_CACHE_BYTES;assert(first>0);G.t++;drawFrontFloor(BG_ART.front,700,400,640,360,5,[]);assert(FLOOR_BUILT<=2);
for(let n=0;n<120;n++){G.t++;ctx.getTransform=()=>({a:.25+(n%20)*.25,b:0,c:0,d:.25+(n%20)*.25});drawFrontFloor(BG_ART.front,0,62,640,360,n,[]);assert(FLOOR_CACHE_BYTES<=FLOOR_CACHE_CAP);assert(FLOOR_CACHE.size<=24);assert(FLOOR_CACHE_BYTES+ART_CACHE_BYTES<=ART_CACHE_CAP);}
// Oversize scales fall back without allocating an over-budget canvas.
ctx.getTransform=()=>({a:12,b:0,c:0,d:12});G.t++;drawFrontFloor(BG_ART.front,0,62,640,360,5,[]);assert(FLOOR_CACHE_BYTES<=FLOOR_CACHE_CAP);
`,e);
assert(source.includes('const A=OFM()?null:R.art'));
console.log('PASS: syntax; 100 reproducible seeds'+(base?', byte-identical baseline deco':'')+'; seam vein lengths/count/density; outcrop spacing; spawn-safe step; hazard alpha; finite draw arguments; 2/frame lazy generation; 24 chunk / 6MiB / shared 16MiB caps; scale fallback; OFM routing');
