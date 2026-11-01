#!/usr/bin/env node
// Read-only balance estimate. Run: node game/tools/balance-sim.mjs
// Uses actual enemy/map JSON, CB and generated skill nodes from game/index.html.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const game=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const html=fs.readFileSync(path.join(game,"index.html"),"utf8");
const enemies=JSON.parse(fs.readFileSync(path.join(game,"data/enemies.json"),"utf8")).enemies;
const zones=JSON.parse(fs.readFileSync(path.join(game,"data/maps.json"),"utf8")).zones;
const byId=new Map(enemies.map(e=>[e.id,e]));
const cbSource=html.match(/const CB=\{[\s\S]*?\n\};/)?.[0];
const treeSource=html.match(/const CFG=\{[\s\S]*?const TREES=\{\};CIDS\.forEach\(c=>TREES\[c\]=buildTree\(c\)\);/)?.[0];
const scaleSource=html.match(/function scaleFor\([\s\S]*?\n\}/)?.[0];
if(!cbSource||!treeSource||!scaleSource)throw Error("Game formulas changed: update balance-sim.mjs extraction.");
// Evaluate only the pure character/tree/scaling definitions, never boot the browser game.
const {CB,CFG,TREES,scaleOf}=vm.runInNewContext(
  'const CIDS=["luarie","ht","mimi"];\n'+cbSource+'\n'+treeSource+'\n'+scaleSource+'\nconst scaleOf=(f,boss)=>scaleFor(f,ZONES,boss);\n({CB,CFG,TREES,scaleOf})',
  {ZONES:zones},{timeout:1500});
const cids=["luarie","ht","mimi"],names={luarie:"ルアリエ",ht:"えーちゃん",mimi:"ミミ"};
const weights={atkP:3,aspd:2,crit:2,critDmg:0.3,extra:15,followUp:2,range:0.12,pierce:4,weak:0.8,hpP:0.25,def:0.2,dodge:0.2,move:0.1};
function buildFor(cid,level,allocated){
  const tree=TREES[cid].nodes,has=new Set([TREES[cid].root]),s={};
  let sp=allocated?Math.min(CFG.SP_CAP,Math.max(0,level-1)*CFG.SP_PER_LV):0;
  while(sp>0){
    const available=Object.values(tree).filter(n=>!has.has(n.id)&&n.cost<=sp&&n.adj.some(a=>has.has(a)));
    if(!available.length)break;
    available.sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
    const next=available[0];has.add(next.id);sp-=next.cost;
  }
  for(const id of has){const eff=tree[id].eff||{};for(const [k,v] of Object.entries(eff))if(typeof v==="number")s[k]=(s[k]||0)+v;}
  return {s,spent:Math.min(CFG.SP_CAP,Math.max(0,level-1)*CFG.SP_PER_LV)-sp,has};
}
function score(n){
  const points=Object.entries(n.eff||{}).reduce((sum,[k,v])=>sum+(weights[k]||0)*(typeof v==="number"?v:0),0);
  return (points+0.1)/(n.cost||1);
}
function stats(cid,level,full,gear=false){
  const b=CB[cid],{s,spent,has}=buildFor(cid,level,full),get=k=>s[k]||0;
  // Match the un-equipped, no-temporary-buff path in statsOf().
  let atkP=get("atkP"),crit=b.crit+get("crit"),cdm=b.cdm+get("critDmg")/100,aspd=get("aspd");
  const nodeNames=[...has].map(x=>TREES[cid].nodes[x]?.eff?.sp).filter(Boolean);
  if(nodeNames.includes("discard")){crit*=0.5;atkP+=45;}
  if(nodeNames.includes("release")){crit+=25;atkP+=30;}
  if(nodeNames.includes("field")&&cid==="ht")atkP+=15;
  // gear estimate: a rare weapon and headphones of the recommended level
  const gAtk=gear?(2+level*0.9)*1.5:0,gHp=gear?(6+level*2.5)*1.5:0;
  const atk=(3+level*0.6+gAtk)*b.atk*Math.max(0.2,1+atkP/100);
  const cd=Math.max(.12,.38*b.cd/Math.max(.3,1+aspd/100));
  const critChance=Math.min(.9,Math.max(0,crit/100));
  // LUA every fourth shot crits regardless of the baseline chance.
  const effectiveCrit=cid==="luarie"?.25+.75*critChance:critChance;
  const dps=atk*(1+effectiveCrit*(cdm-1))/cd*(1+(get("followUp")||0)/100*.7);
  const hp=(20+level*4+gHp)*b.hp*Math.max(.3,1+get("hpP")/100);
  const def=Math.max(0,get("def")),red=Math.min(.75,def/(def+80));
  const dodge=Math.min(.6,(b.dodge+get("dodge"))/100);
  return {dps,hp,red,dodge,spent};
}
const rows=[],patches=[],warning=[];
for(let zi=0;zi<zones.length;zi++){
  const zone=zones[zi];
  for(const fi of [1,5,10]){
    const floor=zi*10+fi,boss=fi===10,scale=scaleOf(floor,boss);
    const ids=boss?[zone.bossId]:zone.enemyPool.filter(p=>(p.minFloor||1)<=fi).map(p=>p.id);
    for(const id of [...new Set(ids)]){
      const e=byId.get(id);if(!e){warning.push("missing enemy: "+id);continue;}
      const hp=e.hp*scale.hp,attack=e.atk*scale.atk;
      const eq=cids.map(c=>stats(c,zone.recommendedLevel,true,true));
      const no=cids.map(c=>stats(c,zone.recommendedLevel,false));
      const all=cids.map(c=>stats(c,zone.recommendedLevel,true));
      const calc=(ss)=>boss?ss.reduce((a,s)=>a+s.dps,0):ss[0].dps;
      const tNo=hp/calc(no),tAll=hp/calc(all),tEq=hp/calc(eq);
      const incoming=attack*(1-no[0].red)*(1-no[0].dodge);
      const row={zone:zone.id,floor,enemy:id,mode:boss?"3人ボス":"ソロ(ルアリエ)",level:zone.recommendedLevel,
        hp:Math.round(hp),ttk0:+tNo.toFixed(1),ttkSP:+tAll.toFixed(1),ttkEq:+tEq.toFixed(1),hitPct:Math.round(100*attack*(1-eq[0].red)*(1-eq[0].dodge)/eq[0].hp),
        hit:+incoming.toFixed(1),hitsToDown:Math.ceil(no[0].hp/Math.max(0.001,incoming)),sp:all[0].spent};
      rows.push(row);
      if(tAll>60)warning.push(zone.id+" "+floor+"F "+id+": estimated "+Math.round(tAll)+" sec even with all earned SP");
      if(incoming>no[0].hp*.5)warning.push(zone.id+" "+floor+"F "+id+": estimated single hit >50% of base HP");
      // Suggest only JSON base-HP edits; never change data automatically.
      if(tAll>90&&(!boss||fi===10)&&patches.every(p=>p.id!==id))
        patches.push({id,field:"hp",before:e.hp,proposed:Math.max(1,Math.round(e.hp*Math.max(.25,Math.min(1,45/tAll))))});
    }
  }
}
const print=v=>Number(v).toLocaleString("ja-JP");
console.log("| エリア | 層 | 敵 | 推奨Lv | HP | TTK SP0 | TTK 全SP | TTK 全SP+装備 | 被ダメ/命中 | 1発の割合(装備) | 戦闘 |");
console.log("|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---|");
for(const r of rows)console.log('| '+[r.zone,r.floor,r.enemy,r.level,print(r.hp),r.ttk0+"s",r.ttkSP+"s",r.ttkEq+"s",r.hit,r.hitPct+"%",r.mode].join(" | ")+" |");
console.log("\n### 注記\n- 敵1体の理論値。敵AI、攻撃回避、弾の飛行時間、装備、デバフ、雑魚召喚、地形、実際の移動時間は含まない。ボスは推奨Lvの3人の合算DPS。");
console.log("- 全SPは推奨Lvまでに取得できるSPを火力優先でツリーの隣接条件に従って自動配置した概算（80SPを無条件に付与してはいない）。");
console.log("- 被ダメはルアリエが受ける基本攻撃1回の期待ダメージ。ボス特殊技・命中確率・無敵時間は別途実機確認が必要。");
console.log("\n### 警告\n"+([...new Set(warning)].slice(0,40).join("\n")||"目立った警告なし"));
console.log("\n### JSON数値変更の候補（未適用）\n"+JSON.stringify(patches,null,2));
