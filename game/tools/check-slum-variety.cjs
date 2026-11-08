const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');new vm.Script(src.match(/<script>([\s\S]*?)<\/script>/)[1]);
const code=src.slice(src.indexOf('const ART_VER='),src.indexOf('function pixBlob('));
let ops=0;const calls={};const context=new Proxy({getTransform:()=>({a:1,b:0}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})}, {get(t,k){return k in t?t[k]:(...a)=>{for(const n of a)if(typeof n==='number')assert(Number.isFinite(n),k+' nonfinite');calls[k]=(calls[k]||0)+1;ops++}},set(t,k,v){t[k]=v;return true}});
const env={calls,Path2D:class {moveTo(){}lineTo(){}closePath(){}},console,Math,ctx:context,document:{createElement:()=>({width:0,height:0,getContext:()=>context})},W:640,H:360,WW:1408,WH:684,G:{t:5.3},P:{x:704,y:382},ALLIES:[],EN:[],HAZ:[],WAVES:[],shadow(){},srand(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296}}};
vm.createContext(env);vm.runInContext(code+`
assert=undefined;
this.check=()=>{
 const A=BG_ART.slum;
 if(Object.values(A.objs).reduce((n,o)=>n+o.wt,0)!==100)throw Error('weights');
 for(let seed=0;seed<40;seed++){
 HAZ=[{type:'puddle',x:330,y:250,t:2,cd:3.2},{type:'puddle',x:600,y:250,radius:55}];
 const ds=genArtDeco(seed,A),again=genArtDeco(seed,A);
 if(ds.some(d=>d.tall!==(d.h>=50)))throw Error('tall classification');
 if(JSON.stringify(ds)!==JSON.stringify(again))throw Error('not reproducible');
 for(const d of ds){const rest=ds.filter(p=>p!==d);if(d.tall&&winMax(rest,d,p=>p.tall)>4)throw Error('tall density');if(winMax(rest,d,()=>true)>14||winMax(rest,d,p=>p.kind===d.kind)>(A.objs[d.kind].max||Infinity))throw Error('density');}
 }
 ART_ON=A;HAZ=[{type:'puddle',x:330,y:250,t:2,cd:3.2},{type:'puddle',x:350,y:250,radius:55}];
 for(const t of [0,.05,2,5.3,9.99,10,30]){
 Math.random=()=>{throw Error('render random')};G.t=t;drawArtFloor(A,0,62,640,360,5,[]);

 for(const kind in A.objs){const d=artRec(A,kind,200,200,()=>.5);ART_VIS=[d];drawArtDeco(d,ART_DRAW[kind]);}
 }
 // Warm every animation state, then ensure animation does not rebuild geometry.
 for(const kind of Object.keys(slumNewDraw)){
  const d=artRec(A,kind,200,200,()=>.5),f=ART_DRAW[kind];
  for(let i=0;i<120;i++)f.dy(200,200,i/10,d);
  for(let i=0;i<120;i++){
   const before={...calls};f.dy(200,200,i/10,d);
   for(const op of ['beginPath','lineTo','moveTo','rotate','fillRect','fill','stroke'])if((calls[op]||0)!==(before[op]||0))throw Error(kind+' rebuilds '+op);
   if((calls.drawImage||0)-(before.drawImage||0)>2)throw Error(kind+' has more than two moving layers');
  }
 }
 if(Object.values(A.objs).filter(o=>o.h>40).length!==4)throw Error('tall roster');
 if(ART_CACHE_BYTES>ART_CACHE_CAP)throw Error('cache cap');
 return {cacheBytes:ART_CACHE_BYTES,objects:Object.keys(A.objs).length};
};`,env);
console.log('PASS: JS syntax, 40 deterministic seeds, per-screen limits, nine renderers at seven times, finite canvas arguments, shared cache, cached animation geometry and maximum two moving layers',env.check(),{operations:ops});
