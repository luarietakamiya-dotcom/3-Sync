// Album screenshots for the sisters-art branch: category tabs + enlargements.
// All achievements are force-claimed in the seed so every main slot is viewable;
// unlock logic itself is covered by check_achievements.js.
// NODE_PATH=<Playwright modules> EXE=<optional Chromium executable> node game/artifacts/gallery-sisters-art/shots_album.js
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "../..");
const origin = "http://noise-dive.test";
const shotsDir = path.join(__dirname, "shots");
fs.mkdirSync(shotsDir, { recursive: true });

async function run() {
  const browser = await chromium.launch(process.env.EXE ? { executablePath: process.env.EXE } : {});
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, reducedMotion: "reduce" });
    page.on("pageerror", error => errors.push(error.message));
    const save = {
      intro: true, last: Date.now(), best: 100, n: 42, chips: 9, shards: 7,
      keys: { 1: 998 }, mats: { shard: { n: 4, v: 100 } },
      keyClr: { nr: Array(5).fill(true), br: Array(5).fill(true) },
      ch: { ht: { lv: 81 }, luarie: { lv: 81 }, mimi: { lv: 81 } },
      dragonFragments: { atk: 4 }
    };
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
    await page.waitForFunction(() => typeof ZONES !== "undefined" && ZONES.length > 0 && typeof MATS !== "undefined" && Boolean(MATS.shard));
    await page.waitForFunction(() => typeof galleryItems !== "undefined" && galleryItems.length === 32, null, { timeout: 20000 });
    await page.evaluate(() => {
      TITLE = false;
      $("title").hidden = true;
      enterInterior("home");
    });
    await page.evaluate(() => {
      for (const cid of CIDS) {
        S.ch[cid].lv = 81;
        S.ch[cid].nodes = Object.fromEntries(Object.keys(TREES[cid].nodes).map(id => [id, 1]));
      }
      for (const a of ACH) S.achClaimed[a.id] = 1;
      save(true);
      enterInterior("home");
    });
    await page.click('[data-home-view="album"]');
    await page.waitForFunction(() => document.querySelectorAll("[data-gallery-tab]").length === 5, null, { timeout: 15000 });
    const states = await page.evaluate(() => {
      const counts = {};
      document.querySelectorAll("[data-gallery-state]").forEach(n => { counts[n.dataset.galleryState] = (counts[n.dataset.galleryState] || 0) + 1; });
      return counts;
    });
    console.log("album states (default tab):", JSON.stringify(states));
    for (const [tab, name] of [["offshot", "album_offshot"], ["solo", "album_solo"], ["cool", "album_cool"], ["special", "album_special"]]) {
      await page.click(`[data-gallery-tab="${tab}"]`);
      await page.waitForTimeout(700);
      const counts = await page.evaluate(() => {
        const c = {};
        document.querySelectorAll("[data-gallery-state]").forEach(n => { c[n.dataset.galleryState] = (c[n.dataset.galleryState] || 0) + 1; });
        return c;
      });
      console.log(`tab ${tab}:`, JSON.stringify(counts));
      await page.screenshot({ path: path.join(shotsDir, name + ".png") });
    }
    // g_sp01 (achCount 45) and g_sp02 (all-achievements) derive from the reached-condition
    // set, so they stay locked/secret in this seed by design; their tab rendering is the
    // verification for them. Enlargements are checked on four reached slots.
    for (const slot of ["g_of01", "g_so02", "g_cool05", "g_so01", "g_sp01"]) {
      const tab = slot.startsWith("g_of") ? "offshot" : slot.startsWith("g_so") ? "solo" : slot.startsWith("g_cool") ? "cool" : "special";
      await page.click(`[data-gallery-tab="${tab}"]`);
      await page.waitForTimeout(500);
      await page.click(`[data-gallery-open="${slot}"]`);
      await page.waitForFunction(() => $("galleryDialog").open && $("galleryFull").naturalWidth > 0, null, { timeout: 15000 });
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(shotsDir, "open_" + slot + ".png") });
      await page.keyboard.press("Escape");
      await page.locator("#galleryDialog").waitFor({ state: "hidden" });
      console.log("opened", slot);
    }
    console.log("page errors:", JSON.stringify(errors));
    if (errors.length) process.exitCode = 1;
  } finally {
    await browser.close();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
