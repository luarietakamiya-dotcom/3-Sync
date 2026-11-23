// NODE_PATH=<Playwright modules> EXE=<optional Chromium executable> node game/artifacts/achievement-gallery/check_achievements.js
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "../..");
const origin = "http://noise-dive.test";
const png = name => path.join(__dirname, name + ".png");
const waitCount = (page, selector, n) => page.waitForFunction(([s, want]) => document.querySelectorAll(s).length === want, [selector, n], { timeout: 15000 });

async function openGame(browser, errors, { save, missingAlbum = false } = {}) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, reducedMotion: "reduce" });
  const requests = [];
  page.on("pageerror", error => errors.push(error.message));
  if (save) await page.addInitScript(data => {
    if (!localStorage.getItem("3sync-save-v1")) localStorage.setItem("donguri-save-v2", JSON.stringify(data));
  }, save);
  await page.route(origin + "/**", route => {
    const pathname = new URL(route.request().url()).pathname;
    requests.push(pathname);
    if (missingAlbum && pathname === "/data/gallery.json") return route.fulfill({ status: 404, body: "" });
    const file = path.join(root, pathname === "/" ? "index.html" : pathname);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ path: file });
  });
  await page.goto(origin + "/");
  await page.waitForFunction(() => typeof ZONES !== "undefined" && ZONES.length > 0 && typeof MATS !== "undefined" && Boolean(MATS.shard));
  await page.waitForFunction(() => Boolean(document.querySelector("#fac [data-go=home]")));
  await page.evaluate(() => {
    TITLE = false;
    $("title").hidden = true;
    enterInterior("home");
  });
  return { page, requests };
}

async function run() {
  const browser = await chromium.launch(process.env.EXE ? { executablePath: process.env.EXE } : {});
  const errors = [];
  try {
    const fresh = await openGame(browser, errors, { missingAlbum: true });
    await fresh.page.click('[data-home-view="ach"]');
    await waitCount(fresh.page, "[data-ach-id]", 50);
    assert.equal(await fresh.page.locator("[data-ach-claim]").count(), 0);
    assert.equal(await fresh.page.locator("[data-ach-id]").count(), 50);
    assert.equal(await fresh.page.locator(".ach-trophies .locked").count(), 6);
    await fresh.page.click('[data-home-view="album"]');
    await fresh.page.getByText("アルバムのデータを読み込めませんでした。").waitFor();
    await fresh.page.close();

    const { page, requests } = await openGame(browser, errors, { save: {
      intro: true, last: Date.now(), best: 21, n: 42, chips: 9, shards: 7,
      keys: { 1: 998 }, mats: { shard: { n: 4, v: 100 } },
      keyClr: { nr: [true, false, false, false, false], br: [false, false, false, false, false] },
      ch: { ht: { lv: 81 }, luarie: { lv: 50 }, mimi: { lv: 50 } },
      dragonFragments: { atk: 4 }
    } });
    const initial = await page.evaluate(() => ({
      known: Object.keys(S.achKnown), claimed: S.achClaimed, seen: S.gallerySeen, title: S.titleEq,
      stock: stock("shard"), matValue: S.mats.shard.v, chips: S.chips, shards: S.shards,
      money: Math.floor(S.n), frags: S.dragonFragments.atk, ht: S.ch.ht.lv, toast: $("toast").textContent,
      totals: [ACH.length,...["chips","shards"].map(k=>ACH.reduce((n,a)=>n+(a.reward[k]||0),0))],
      album: Object.keys(GALLERY_CATS).map(cat=>galleryItems.filter(item=>item.cat===cat).length)
    }));
    assert.deepEqual(initial.known, ["a1","a2","b1_luarie","b1_echan","b3_echan","b1_mimi","b2"]);
    assert.deepEqual(initial.totals, [50,61,215]);
    assert.deepEqual(initial.album, [6,3,9,2,12]);
    assert.deepEqual([initial.claimed,initial.seen,initial.title], [{},{},null]);
    assert.deepEqual([initial.stock,initial.matValue,initial.chips,initial.shards,initial.frags,initial.ht], [4,100,9,7,4,81]);
    assert.ok(initial.money>=42);
    assert.doesNotMatch(initial.toast,/実績達成/);
    assert.deepEqual(requests.filter(p=>p.startsWith("/gallery/")), []);
    await page.click('[data-home-view="ach"]');
    await waitCount(page, "[data-ach-id]", 50);
    assert.deepEqual(await page.locator("[data-ach-claim]").evaluateAll(nodes=>nodes.map(n=>n.dataset.achClaim)), initial.known);
    assert.equal(await page.locator(".ach-trophies figure").count(), 6);
    assert.equal(await page.locator(".ach-trophies .locked").count(), 4);
    assert.equal(await page.locator(".ach-trophies .locked figcaption").first().innerText(), "？？？");
    await page.locator(".ach-view summary").click();
    await page.getByText("初回クリアボーナス受領済み（チップ8）").waitFor();
    await page.screenshot({ path: png("achievements") });
    await page.locator(".ach-trophies").screenshot({ path: png("trophies") });

    const rewards = await page.evaluate(() => {
      const snapshot = () => [S.n,S.shards,S.chips,S.keys[1],stock("shard"),S.mats.shard.v,
        Object.values(S.dragonFragments).reduce((a,b)=>a+b,0)];
      const before = snapshot();
      S.best=41;
      S.ofBest.top=3;
      save(true);
      const notice=$("toast").textContent;
      for (const id of ["a1","a4","c5_1","a11"]) claimAch(id);
      const after = snapshot();
      for (const id of ["a1","a4","c5_1"]) claimAch(id);
      return { before, after, repeated:snapshot(), notice, base:MATS.shard.base, claimed: Object.keys(S.achClaimed) };
    });
    assert.deepEqual(rewards.after.map((x,i)=>i===0?Math.round(x-rewards.before[i]):x-rewards.before[i]), [5000,8,2,1,20,20*rewards.base,5]);
    assert.deepEqual(rewards.repeated, rewards.after);
    assert.deepEqual(rewards.claimed, ["a1","a4","c5_1"]);
    assert.match(rewards.notice,/実績達成：ライブ街区制覇/);
    await page.locator("[data-ach-all]").click();
    await page.locator("[data-ach-title]").selectOption("t_a1");
    await page.locator("#hudAch .ach-title-white").getByText("下層スラムの生還者").waitFor();
    assert.equal(await page.locator("#titleAch").innerText(), "下層スラムの生還者");
    await page.locator("#fac h3").getByText("下層スラムの生還者").waitFor();
    await page.screenshot({ path: png("title-hud") });
    await page.click('[data-home-view="home"]');
    await page.locator('[data-char="ht"] .ach-gold-name').waitFor();
    await page.locator('[data-home-view="album"]').getByText(/NEW/).waitFor();

    await page.click('[data-home-view="album"]');
    await page.waitForFunction(() => document.querySelector('[data-gallery-state="pending"]') && document.querySelector('[data-gallery-state="locked"]'), null, { timeout: 15000 });
    assert.ok(await page.locator('[data-gallery-state="pending"]').count());
    assert.ok(await page.locator('[data-gallery-state="locked"]').count());
    await page.click('[data-gallery-tab="special"]');
    const secret=page.locator('[data-gallery-state="secret"]');
    assert.match(await secret.innerText(),/？？？/);
    assert.equal(await secret.locator("small").count(),0);
    await page.click('[data-gallery-tab="extra"]');
    const first=page.locator('[data-gallery-open="g_ar01"]');
    await first.getByText("NEW").waitFor();
    await page.waitForFunction(() => Boolean(document.querySelector('[data-gallery-open="g_ar01"] img')?.naturalWidth));
    assert.ok(requests.includes("/gallery/thumb/g_ar01.webp"));
    assert.ok(!requests.includes("/gallery/g_ar01.webp"));
    await page.screenshot({ path: png("album") });
    await first.click();
    await page.waitForFunction(() => $("galleryDialog").open && $("galleryFull").naturalWidth > 0);
    assert.equal(await page.locator("#galleryUnlock").innerText(),"下層スラム制覇");
    assert.equal(await page.evaluate(() => S.gallerySeen.g_ar01), "gallery/g_ar01.webp");
    await page.screenshot({ path: png("gallery-full") });
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.evaluate(() => S.gallerySeen.g_ar02), "gallery/g_ar02.webp");
    await page.keyboard.press("Escape");
    await page.locator("#galleryDialog").waitFor({ state: "hidden" });
    assert.equal(await first.getByText("NEW").count(), 0);
    await page.evaluate(() => { S.gallerySeen.g_ar01="gallery/old.webp"; renderFac(); });
    await first.getByText("NEW").waitFor();
    await first.click();
    await page.mouse.click(1,1);
    await page.locator("#galleryDialog").waitFor({ state: "hidden" });

    const full=await page.evaluate(() => {
      S.best=100;
      S.rushBest={n:5,t:100,heat:0};
      S.runBest.live={seg:30,heat:0};
      S.ofBest={top:5,clears:1};
      S.keyClr={nr:Array(5).fill(true),br:Array(5).fill(true)};
      for(const cid of CIDS) {
        S.ch[cid].lv=81;
        S.ch[cid].nodes=Object.fromEntries(Object.keys(TREES[cid].nodes).map(id=>[id,1]));
      }
      S.inv=Object.keys(SLOTS).map((slot,i)=>({id:i+1,slot,plus:10}));
      S.ch.luarie.eq=Object.fromEntries(S.inv.map(item=>[item.slot,item.id]));
      claimAch("b4_echan_25");
      claimAllAch();
      equipTitle("t_c7");
      const titles=[...achTitles(S.achClaimed).keys()];
      return { count:achState().size, claimed:Object.keys(S.achClaimed).length, title:S.titleEq,
        oneTreeTitle:titles.filter(id=>id==="t_b4a").length, allGallery:galleryItems.every(item=>galleryUnlocked(item,achState())),
        goldFrame:document.body.classList.contains("ach-gold-frame"), titleBg:$("title").dataset.achBg,
        keys:S.keys, saved:JSON.parse(localStorage.getItem(KEY)).gallerySeen.g_ar01 };
    });
    assert.deepEqual(full,{count:50,claimed:50,title:"t_c7",oneTreeTitle:1,allGallery:true,goldFrame:true,titleBg:"2",
      keys:{1:999,2:1,3:2,4:1,5:2},saved:"gallery/g_ar01.webp"});
    await page.close();
    assert.deepEqual(errors,[]);
    console.log("PASS achievements, legacy migration, rewards, title, trophies, gallery states, assets and modal (0 page errors)");
  } finally {
    await browser.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
