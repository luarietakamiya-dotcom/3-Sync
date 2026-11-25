// Verify replaced gallery slots show v2 images in the album and open in the modal.
// NODE_PATH=<pw> EXE=<chromium> node game/artifacts/gallery-hair-fix/verify_album.js
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "../..");
const origin = "http://noise-dive.test";
const REPLACED = ["g_cool01","g_cool02","g_cool03","g_cool04","g_cool05","g_cool06","g_cool07","g_cool08","g_sp02","g_of04"];
async function run() {
  const browser = await chromium.launch(process.env.EXE ? { executablePath: process.env.EXE } : {});
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, reducedMotion: "reduce" });
    page.on("pageerror", e => errors.push(e.message));
    const save = { intro: true, last: Date.now(), best: 100, n: 42, chips: 9, shards: 7,
      keys: { 1: 998 }, mats: { shard: { n: 4, v: 100 } },
      keyClr: { nr: Array(5).fill(true), br: Array(5).fill(true) },
      ch: { ht: { lv: 81 }, luarie: { lv: 81 }, mimi: { lv: 81 } }, dragonFragments: { atk: 4 } };
    await page.addInitScript(data => {
      if (!localStorage.getItem("3sync-save-v1")) localStorage.setItem("donguri-save-v2", JSON.stringify(data));
    }, save);
    await page.route(origin + "/**", route => {
      const pathname = new URL(route.request().url()).pathname;
      const file = path.join(root, pathname === "/" ? "index.html" : pathname);
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return route.fulfill({ status: 404, body: "" });
      return route.fulfill({ path: file });
    });
    await page.goto(origin + "/");
    await page.waitForFunction(() => typeof galleryItems !== "undefined" && galleryItems.length === 32, null, { timeout: 20000 });
    await page.evaluate(() => {
      TITLE = false; $("title").hidden = true; enterInterior("home");
      for (const cid of CIDS) { S.ch[cid].lv = 81; S.ch[cid].nodes = Object.fromEntries(Object.keys(TREES[cid].nodes).map(id => [id, 1])); }
      for (const a of ACH) S.achClaimed[a.id] = 1;
      // maximal records so every achievement is earned (unlocks achCount slots too)
      S.best = 500;
      S.ofBest = { top: 5, clears: 9 };
      S.rushBest = { n: 5, t: 60 };
      S.runBest = {}; for (let i = 0; i < 5; i++) S.runBest[i] = { seg: 99 };
      for (const cid of CIDS) { S.ch[cid].spx = 282; }
      const it = makeItem(50, false); it.plus = 10; S.inv.push(it);
      for (const slot of ["w", "h", "c"]) { const x = makeItem(50, false); x.plus = 10; S.inv.push(x); S.ch.luarie.eq[slot] = x.id; }
      save(true); enterInterior("home");
      const unearned = ACH.filter(a => !achState().has(a.id)).map(a => a.id);
      console.log("unearned achievements:", JSON.stringify(unearned));
    });
    await page.click('[data-home-view="album"]');
    await page.waitForFunction(() => document.querySelectorAll("[data-gallery-tab]").length === 5, null, { timeout: 15000 });
    const result = {};
    for (const tab of ["cool", "offshot", "special"]) {
      await page.click(`[data-gallery-tab="${tab}"]`);
      await page.waitForTimeout(600);
      const found = await page.evaluate(ids => {
        const out = {};
        document.querySelectorAll("img").forEach(img => {
          for (const id of ids) if (img.src.includes(id)) out[id] = { src: img.src, ok: img.complete && img.naturalWidth > 0 };
        });
        return out;
      }, REPLACED);
      Object.assign(result, found);
      if (tab === "cool") await page.screenshot({ path: path.join(__dirname, "album_cool_v2.png") });
    }
    let fail = 0;
    for (const id of REPLACED) {
      const r = result[id];
      const good = r && r.src.includes(id + "v2.webp") && r.ok;
      if (!good) fail++;
      console.log(id, good ? "OK" : "NG", r ? r.src.split("/").pop() : "not found");
    }
    // open modal for g_cool01
    await page.click('[data-gallery-tab="cool"]');
    await page.waitForTimeout(400);
    await page.evaluate(() => { const el = [...document.querySelectorAll("img")].find(i => i.src.includes("g_cool01v2")); el && el.closest("[data-gallery-open],button,div").click(); });
    await page.waitForTimeout(900);
    const modal = await page.evaluate(() => { const img = [...document.querySelectorAll("img")].find(i => i.src.includes("g_cool01v2.webp") && i.naturalWidth > 1000); return img ? img.src.split("/").pop() + " " + img.naturalWidth + "x" + img.naturalHeight : null; });
    console.log("modal g_cool01:", modal || "NG");
    if (!modal) fail++;
    await page.screenshot({ path: path.join(__dirname, "album_open_cool01_v2.png") });
    console.log("page errors:", errors.length, errors.slice(0, 3).join(" | "));
    console.log(fail === 0 && errors.length === 0 ? "VERIFY PASS" : "VERIFY FAIL");
  } finally { await browser.close(); }
}
run().catch(e => { console.error(e); process.exit(1); });
