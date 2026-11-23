// Fallback for environments that cannot launch Chromium. DOM operations use stubs.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const script=fs.readFileSync(path.join(root,'index.html'),'utf8').split('<script>\n').at(-1).split('</script>')[0];
const records={},listeners={},classes=new Set();
function el(id){
  return records[id]??=(new Proxy({id,style:{},dataset:{},getContext:()=>ctx,innerHTML:'',textContent:'',
    classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),toggle:(k,v)=>v?classes.add(k):classes.delete(k)},
    addEventListener:(name,fn)=>listeners[id+name]=fn,querySelectorAll:()=>[],querySelector:()=>null,
    setAttribute(){},removeAttribute(){},showModal(){this.open=true;},close(){this.open=false;listeners[id+'close']?.();}},
    {get(o,k){return o[k];}}));
}
const ctx=new Proxy({},{get:()=>()=>{}});
const storage={};
const context=vm.createContext({
  window:{claude:{hot:{ready(){}}}},document:{body:el("body"),getElementById:el,querySelectorAll:()=>[],querySelector:()=>null,createElement:()=>el("canvas"),addEventListener(){}},
  Image:class{}, Audio:class{}, console, location:{search:'',protocol:'http:'}, navigator:{}, performance,
  URLSearchParams, matchMedia:()=>({matches:false}), addEventListener(){}, requestAnimationFrame(){}, setTimeout(){}, clearTimeout(){},
  localStorage:{getItem:k=>storage[k],setItem:(k,v)=>storage[k]=v},
  fetch:async p=>({ok:fs.existsSync(path.join(root,p)),json:async()=>JSON.parse(fs.readFileSync(path.join(root,p),"utf8"))}),
  assert
});
const run=src=>vm.runInContext(src,context);
run(script);
(async()=>{
  await run('loadData()');
  run(`
    const equal=(a,b)=>assert.equal(JSON.stringify(a),JSON.stringify(b));
    equal(ACH.length,50);equal(ACH.filter(x=>x.cat==="grow").length,22);
    equal(ACH.reduce((n,a)=>n+(a.reward.chips||0),0),61);
    equal(ACH.reduce((n,a)=>n+(a.reward.shards||0),0),215);
    equal(achState().size,0);equal(galleryItems.length,32);
    assert.match(achievementHtml(achState()),/未達成/);
    assert.doesNotMatch(achievementHtml(achState()),/data-ach-claim/);
    S=sanitize({best:21,n:42,shards:7,chips:9,keys:{1:998},mats:{shard:{n:4,v:100}},
      ch:{ht:{lv:81},luarie:{lv:50},mimi:{lv:50}},dragonFragments:{atk:4}});
    finishLoad();
    equal(Object.keys(S.achKnown),["a1","a2","b1_luarie","b1_echan","b3_echan","b1_mimi","b2"]);
    equal(S.achClaimed,{});equal(S.gallerySeen,{});equal(S.titleEq,null);
    equal($("toast").textContent,"");equal(S.ch.ht.lv,81);
    const reached=achState();
    equal([...achievementHtml(reached).matchAll(/data-ach-claim="([^"]+)"/g)].map(m=>m[1]),Object.keys(S.achKnown));
    equal([...trophyHtml(reached).matchAll(/class="locked"/g)].length,4);
    assert.match(galleryHtml(reached),/data-gallery-state="pending"/);
    assert.match(galleryHtml(reached),/data-gallery-state="locked"/);
    galleryTab="special";
    assert.match(galleryHtml(reached),/data-gallery-state="secret"[\\s\\S]*？？？/);
    galleryTab="extra";
    assert.match(galleryHtml(reached),/data-gallery-open="g_ar01"[\\s\\S]*NEW/);
    S.best=41;S.ofBest.top=3;save(true);
    assert.match($("toast").textContent,/実績達成：ライブ街区制覇/);
    for(const id of ["a1","a4","c5_1","a11","a1","a4","c5_1"])claimAch(id);
    equal(Object.keys(S.achClaimed),["a1","a4","c5_1"]);
    equal([S.n,S.shards,S.chips,S.keys[1],stock("shard"),S.mats.shard.v,Object.values(S.dragonFragments).reduce((a,b)=>a+b,0)],
      [5042,15,11,999,24,100+MATS.shard.base*20,9]);
    equipTitle("t_a1");assert.match($("hudAch").innerHTML,/ach-title-white.*下層スラムの生還者/);
    viewGalleryImage("g_ar01");assert.equal($("galleryDialog").open,true);
    equal($("galleryFull").src,"gallery/g_ar01.webp");
    equal(S.gallerySeen.g_ar01,"gallery/g_ar01.webp");
    const tile=()=>galleryHtml(achState()).split('data-gallery-open="g_ar01"')[1].split("</button>")[0];
    assert.doesNotMatch(tile(),/NEW/);
    S.gallerySeen.g_ar01="old.webp";assert.match(tile(),/NEW/);
    stepGalleryImage(1);
    equal(S.gallerySeen.g_ar02,"gallery/g_ar02.webp");
    S.best=100;S.rushBest={n:5,t:100,heat:0};S.runBest.live={seg:30,heat:0};S.ofBest={top:5,clears:1};
    S.keyClr={nr:Array(5).fill(true),br:Array(5).fill(true)};
    for(const cid of CIDS){
      S.ch[cid].lv=81;
      S.ch[cid].nodes=Object.fromEntries(Object.keys(TREES[cid].nodes).map(id=>[id,1]));
    }
    S.inv=Object.keys(SLOTS).map((slot,i)=>({id:i+1,slot,plus:10}));
    S.ch.luarie.eq=Object.fromEntries(S.inv.map(it=>[it.slot,it.id]));
    equal(achState().size,50);
    claimAch("b4_echan_25");claimAllAch();equipTitle("t_c7");
    equal(Object.keys(S.achClaimed).length,50);
    equal([...achTitles(S.achClaimed).keys()].filter(id=>id==="t_b4a").length,1);
    assert.ok(galleryItems.every(item=>galleryUnlocked(item,achState())));
    equal(S.keys,{1:999,2:1,3:2,4:1,5:2});
    equal($("title").dataset.achBg,"2");
    console.log("PASS game-script VM: data, legacy migration, retroactive order, rewards, duplicate claims, title, trophies, gallery states/NEW/next, all 50 conditions");
  `);
})().catch(e=>{console.error(e);process.exitCode=1;});
