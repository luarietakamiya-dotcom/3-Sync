const assert=(ok,msg)=>{if(!ok)throw Error(msg)};
const A=BG_ART.border;
assert(Object.keys(A.objs).length===9,'roster');
assert(A.maxTall===4&&A.maxScreen===14&&A.centerGap===40,'density');
assert(Object.values(A.objs).filter(o=>o.h>40).length===4,'tall ratio');
assert(A.objs.border_stone.max===2&&A.objs.border_barrier.max===2,'low caps');
for(let seed=1;seed<=80;seed++){
 const ds=genArtDeco(seed,A);assert(JSON.stringify(ds)===JSON.stringify(genArtDeco(seed,A)),'determinism');
 const placed=[];for(const d of ds){assert(d.x0>70&&d.x1<=WW-20&&d.y0>=80&&d.y1<=WH-16,'bounds');assert(winMax(ds.filter(p=>p!==d),d,p=>p.kind===d.kind)<=A.objs[d.kind].max,'kind cap');placed.push(d);
 assert(d.h<=40||artEdge(A,d.x,d.y-d.fd/2),'edge');assert(winMax(ds.filter(p=>p!==d),d,()=>true)<=14,'screen cap');assert(winMax(ds.filter(p=>p!==d),d,p=>p.tall)<=4||!d.tall,'tall cap');}
}
for(const kind of Object.keys(borderNewDraw)){
 const o=A.objs[kind],d={kind,...o,v:0,ph:0,x:0,y:0,al:1};
 for(const t of [0,.2,.4,1,2,3.99,4,5.99,6,8]){G.t=t;drawArtDeco(d,ART_DRAW[kind]);}
 const original=ctx.drawImage;ctx.drawImage=function(...args){assert(args.slice(1).every(Number.isFinite),'finite image arguments');return original.apply(this,args)};
 for(const t of [0,.2,2,5.99]){G.t=t;ART_DRAW[kind].dy(0,0,t,d)}ctx.drawImage=original;
}
