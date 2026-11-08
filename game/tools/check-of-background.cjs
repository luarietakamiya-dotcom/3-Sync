// Focused lifecycle checks; no browser or asset server required.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');
new vm.Script(source.match(/<script>([\s\S]*?)<\/script>/)[1]);
function setup(){
 const images=[],ops=[],warnings=[],timers=new Map();let seq=0;
 const env={console:{warn:(...a)=>warnings.push(a)},Image:class{constructor(){images.push(this)}decode(){return Promise.resolve()}},
 document:{createElement(tag){assert.equal(tag,'canvas');return {width:0,height:0,getContext(){return {drawImage(...a){ops.push(['draw',...a])},set fillStyle(v){ops.push(['dim',v])},fillRect(...a){ops.push(['fill',...a])}}}}}},
 setTimeout(fn,ms){assert.equal(ms,3000);timers.set(++seq,fn);return seq},clearTimeout(id){timers.delete(id)}};
 vm.createContext(env);vm.runInContext(source.slice(source.indexOf('const OF_BG_DIM='),source.indexOf('const OF_TNM=')),env);
 return {images,ops,warnings,timers,run:s=>vm.runInContext(s,env)};
}
(async()=>{
 const e=setup(),p=e.run('ofPreloadBackground()');assert.strictEqual(p,e.run('ofPreloadBackground()'));assert.equal(e.images.length,1);
 assert.equal(e.images[0].src,'assets/arena/ryumyaku_arena.webp');await e.images[0].onload();await p;
 assert.equal(e.run('OF_BG_CANVAS.width'),640);assert.equal(e.run('OF_BG_CANVAS.height'),360);
 assert.deepEqual(e.ops.map(o=>o[0]),['draw','dim','fill']);assert.equal(e.ops[1][1],'rgba(0,0,0,0.2)');
 await e.run('ofPreloadBackground()');assert.equal(e.ops.length,3);assert.equal(e.images.length,1);assert.equal(e.warnings.length,0);assert.equal(e.timers.size,0);
 for(const mode of ['error','decode','timeout','late-decode','bake']){
  const e=setup(),p=e.run('ofPreloadBackground()'),img=e.images[0];let release;
  if(mode==='error')img.onerror();
  if(mode==='decode'){img.decode=()=>Promise.reject(Error('decode'));await img.onload();}
  if(mode==='bake'){e.run('document.createElement=()=>{throw Error("canvas")}');await img.onload();}
  if(mode==='timeout')[...e.timers.values()][0]();
  if(mode==='late-decode'){img.decode=()=>new Promise(r=>release=r);const load=img.onload();[...e.timers.values()][0]();release();await load;}
  await p;await e.run('ofPreloadBackground()');assert.equal(e.run('OF_BG_CANVAS'),null,mode);assert.equal(e.warnings.length,1,mode);assert.equal(e.images.length,1,mode);assert.equal(e.ops.length,0,mode);
 }
 // Exercise actual entry function: gate clicks wait, result-screen retries still work,
 // duplicate clicks are ignored, and leaving the entry screen cancels a pending start.
 for(const retry of [false,true])for(const fallback of [false,true]){
  const e=setup();
  e.run(`var S={overflowUnlocked:true,char:'lu'},MODE='${retry?'dive':'town'}',OPEN=${retry?'null':"'gate'"},RUN=${retry?"{kind:'overflow',done:true}":'null'},GATE_TAB='overflow';
   var SND={},FLOOR,WW,WH,HAZ,P,ALLIES,FX,PARTS,MARK,G,CIDS=['lu'],W=640,H=360,starts=0;
   function OFC(){return {boss:{floor:50}}}function ofMaxStage(){return 3}function mkUnit(){return {x:320,y:300}}
   function ofWave(){starts++}function syncModeUI(){}function syncStage(){}function markDirty(){}function log(){}`);
  e.run(source.slice(source.indexOf('async function ofStartRun('),source.indexOf('function ofWave(')));
  const start=e.run('ofStartRun(1)');await e.run('ofStartRun(1)');assert.equal(e.run('starts'),0);
  if(fallback)e.images[0].onerror();else await e.images[0].onload();await start;assert.equal(e.run('starts'),1);assert.equal(e.run('MODE'),'dive');
  if(!retry)e.run("MODE='town';OPEN='gate';RUN=null");
  e.run('ofStartRun(2)');assert.equal(e.run('RUN.kind'),'overflow');assert.equal(e.run('RUN.stage'),2);assert.equal(e.run('starts'),2);assert.equal(e.images.length,1);
 }
 for(const change of ["MODE='other'","OPEN=null","RUN={}","GATE_TAB='other'","S.overflowUnlocked=false"]){
  const e=setup();e.run("var S={overflowUnlocked:true},MODE='town',OPEN='gate',RUN=null,GATE_TAB='overflow'");
  e.run(source.slice(source.indexOf('async function ofStartRun('),source.indexOf('function ofWave(')));
  const start=e.run('ofStartRun(0)');e.run(change);const entryRun=e.run('RUN');e.images[0].onerror();await start;assert.strictEqual(e.run('RUN'),entryRun,change);assert.equal(e.run('OF_STARTING'),false);
 }
 const draw=source.slice(source.indexOf('function drawDive(){'),source.indexOf('function drawSkillBar('));
 assert(draw.includes('const ofBackground=OFM()&&OF_BG_CANVAS'));
 assert(draw.includes('deco=OFM()?[]:decoNow()'));
 assert(draw.indexOf('ctx.drawImage(ofBackground,0,0)')<draw.indexOf('drawHazards()'));
 assert(source.includes('if(!OF_BG_SETTLED)'));
 console.log('PASS: syntax; single load/bake; 640x360; bgDim .2; error/decode/bake/timeout fallback; late decode ignored; pending start cancellation and duplicate suppression; settled success/fallback creates RUN synchronously; retry reuses settled promise; OF-only render guards and ordering');
})().catch(e=>{console.error(e);process.exitCode=1});
