import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, openSync, closeSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as pause } from "node:timers/promises";
import { chromium } from "playwright";

// Record the real application against isolated, in-memory sample data.
// The video carries a persistent disclosure; this script never writes to Supabase.
const output = resolve("artifacts/recording");
mkdirSync(`${output}/assets`, { recursive: true });
mkdirSync(`${output}/raw`, { recursive: true });
const listings = JSON.parse(readFileSync("tests/fixtures/listings.json", "utf8"));
const messages = [];
const uploads = new Map();
const photoUrls = ["https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85", ...listings.map(item => item.image_path)];
const photos = new Map();
await Promise.all(photoUrls.map(async (url, index) => {
  const path = `${output}/assets/${index}.jpg`;
  if (!existsSync(path)) {
    const response = await fetch(url);
    assert(response.ok, `Photo ${index} must load`);
    writeFileSync(path, Buffer.from(await response.arrayBuffer()));
  }
  photos.set(new URL(url).pathname, path);
}));

const backend = createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,OPTIONS");
  if (request.method === "OPTIONS") { response.writeHead(204).end(); return; }
  const url = new URL(request.url, "http://127.0.0.1:54330");
  const send = (body, status = 200) => { response.writeHead(status, { "Content-Type": "application/json" }); response.end(JSON.stringify(body)); };
  const readBody = async () => { const chunks = []; for await (const chunk of request) chunks.push(chunk); return Buffer.concat(chunks); };
  try {
    const storage = "/storage/v1/object/marketplace-images/";
    const publicStorage = "/storage/v1/object/public/marketplace-images/";
    if (url.pathname.startsWith(storage) || url.pathname.startsWith(publicStorage)) {
      const name = url.pathname.split("/").at(-1);
      if (request.method === "POST") {
        const form = await new Request(url, { method: "POST", headers: request.headers, body: await readBody(), duplex: "half" }).formData();
        const file = [...form.values()].find(value => typeof value !== "string");
        assert(file, "A real photo must be uploaded");
        uploads.set(name, { bytes: Buffer.from(await file.arrayBuffer()), type: file.type });
        await pause(550);
        send({ Key: `marketplace-images/${name}`, Id: randomUUID() }); return;
      }
      const photo = uploads.get(name);
      if (!photo) { send({ error: "Photo not found" }, 404); return; }
      response.writeHead(200, { "Content-Type": photo.type, "Content-Length": photo.bytes.length });
      response.end(request.method === "HEAD" ? undefined : photo.bytes); return;
    }
    if (url.pathname === "/rest/v1/marketplace_listings") {
      if (request.method === "POST") {
        const data = JSON.parse((await readBody()).toString());
        assert(uploads.has(data.image_path));
        const listing = { ...data, id: randomUUID(), is_demo: false, created_at: new Date().toISOString() };
        listings.unshift(listing); await pause(450); send({ id: listing.id }, 201); return;
      }
      let rows = listings;
      if (url.searchParams.has("id")) rows = rows.filter(item => item.id === url.searchParams.get("id").replace(/^eq\./, ""));
      const fields = (url.searchParams.get("select") || "").split(",");
      assert(!fields.includes("seller_email"), "Seller email stays private");
      rows = rows.map(item => Object.fromEntries(fields.map(field => [field, item[field]])));
      send(request.headers.accept?.includes("vnd.pgrst.object") ? rows[0] || null : rows); return;
    }
    if (url.pathname === "/rest/v1/marketplace_messages" && request.method === "POST") {
      messages.push(JSON.parse((await readBody()).toString()));
      await pause(600); response.writeHead(201).end(); return;
    }
    send({ error: "Unknown demo endpoint" }, 404);
  } catch (error) { console.error(error); send({ error: error.message }, 500); }
});
await new Promise(resolve => backend.listen(54330, "127.0.0.1", resolve));

const env = { ...process.env, NEXT_BUILD_DIR: ".next-recording", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54330", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "local-demo-publishable-key", NEXT_TELEMETRY_DISABLED: "1" };
const log = openSync(`${output}/server.log`, "w");
let server, browser, context, page, video;
const timeline = [];
let start;
try {
  if (process.env.RECORD_SKIP_BUILD !== "1" || !existsSync(".next-recording/BUILD_ID")) {
    console.log("Building an isolated production app for the recording…");
    const build = spawn(process.execPath, ["node_modules/next/dist/bin/next", "build"], { env, windowsHide: true, stdio: ["ignore", log, log] });
    const code = await new Promise(resolve => build.on("exit", resolve));
    assert.equal(code, 0, "Production build must pass; see recording/server.log");
  }
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", "3200", "--hostname", "127.0.0.1"], { env, windowsHide: true, stdio: ["ignore", log, log] });
  const base = "http://127.0.0.1:3200";
  let ready = false;
  for (let i = 0; i < 80; i++) { try { if ((await fetch(`${base}/sell`)).ok) { ready = true; break; } } catch {} await pause(250); }
  assert(ready, "Recording server must start");
  for (const path of ["/", "/sell", `/listings/${listings[0].id}`]) assert((await fetch(`${base}${path}`)).ok);

  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, recordVideo: { dir: `${output}/raw`, size: { width: 1440, height: 900 } }, locale: "en-US" });
  await context.route("https://images.unsplash.com/**", async route => {
    const photo = photos.get(new URL(route.request().url()).pathname);
    if (photo) await route.fulfill({ path: photo, contentType: "image/jpeg" });
    else await route.continue();
  });
  await context.addInitScript(() => {
    function installOverlay() {
      const host = document.createElement("div");
      host.id = "walkthrough-overlay";
      host.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none";
      const shadow = host.attachShadow({ mode: "open" });
      shadow.innerHTML = `<style>
        *{box-sizing:border-box}#cursor{position:fixed;left:1365px;top:815px;width:22px;height:29px;filter:drop-shadow(0 2px 2px #0005);transform:translate(-2px,-2px)}
        #caption{position:fixed;left:24px;bottom:22px;background:#194735f5;border:1px solid #ffffff30;color:white;border-radius:9px;padding:13px 19px;box-shadow:0 5px 25px #10281825;max-width:680px;font-family:Arial,sans-serif}
        #caption small{display:block;font-size:9px;letter-spacing:1.6px;color:#dce5cf;margin-bottom:5px}#caption strong{font-size:17px;line-height:1.4;font-weight:500}
        #badge{position:fixed;bottom:24px;right:24px;border:1px solid #d7decf;border-radius:5px;background:#fffffff2;color:#4f6c50;font:10px Arial,sans-serif;letter-spacing:.8px;padding:9px 12px}
        .ring{position:fixed;width:34px;height:34px;border:2px solid #c08d49;border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 0 0 4px #f5e8c933}
      </style><svg id="cursor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 30"><path d="M3 2v23l6-6 5 9 4-2-5-9 8-1Z" fill="#fff" stroke="#194735" stroke-width="1.5" stroke-linejoin="round"/></svg><div id="caption"><small>GOOD FINDS / PRODUCT WALKTHROUGH</small><strong>Good things. New beginnings.</strong></div><div id="badge">LOCAL DEMO · SAMPLE DATA</div>`;
      document.documentElement.append(host);
      const cursor = shadow.querySelector("#cursor");
      window.addEventListener("pointermove", event => { cursor.style.left = `${event.clientX}px`; cursor.style.top = `${event.clientY}px`; }, { passive: true });
      window.addEventListener("pointerdown", event => {
        const ring = document.createElement("div"); ring.className = "ring"; ring.style.left = `${event.clientX}px`; ring.style.top = `${event.clientY}px`; shadow.append(ring);
        ring.animate([{ opacity: 1, scale: .7 }, { opacity: 0, scale: 1.7 }], { duration: 550 }).onfinish = () => ring.remove();
      }, { passive: true });
      window.__demoCaption = (label, title) => { shadow.querySelector("small").textContent = label; shadow.querySelector("strong").textContent = title; sessionStorage.setItem("walkthrough-caption", JSON.stringify([label, title])); };
      try { const saved = JSON.parse(sessionStorage.getItem("walkthrough-caption")); if (saved) window.__demoCaption(...saved); } catch {}
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installOverlay, { once: true });
    else installOverlay();
  });

  page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  video = page.video();
  let pointer = { x: 1365, y: 815 };
  async function move(x, y, duration = 350) {
    const from = { ...pointer };
    for (let i = 1; i <= 18; i++) { const t = i / 18; const ease = t * t * (3 - 2 * t); await page.mouse.move(from.x + (x - from.x) * ease, from.y + (y - from.y) * ease); await pause(duration / 18); }
    pointer = { x, y };
  }
  async function point(locator) {
    let box = await locator.boundingBox();
    assert(box, "The next control must be visible");
    if (box.y < 85 || box.y + box.height > 785) {
      await locator.evaluate(element => element.scrollIntoView({ behavior: "smooth", block: "center" })); await pause(700); box = await locator.boundingBox();
    }
    await move(box.x + Math.min(box.width / 2, 180), box.y + box.height / 2); await pause(170);
  }
  async function click(locator, wait = 1000) { await point(locator); await page.mouse.click(pointer.x, pointer.y); await pause(wait); }
  async function type(locator, text, delay = 28) { await point(locator); await locator.click(); await locator.press("ControlOrMeta+A"); await locator.pressSequentially(text, { delay }); await pause(350); }
  async function select(locator, value) { await point(locator); await locator.selectOption(value); await pause(800); }
  async function caption(label, title) { timeline.push({ seconds: (Date.now() - start) / 1000, label, title }); await page.evaluate(({ label, title }) => window.__demoCaption(label, title), { label, title }); console.log(label, title); }
  async function loadedPhotos() { await page.evaluate(async () => { await Promise.all([...document.images].filter(img => img.loading !== "lazy").map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; }))); }); }
  start = Date.now();
  await page.goto(base, { waitUntil: "networkidle" });
  await loadedPhotos(); await pause(1000);
  await page.screenshot({ path: `${output}/cover.png` });
  await caption("GOOD FINDS / PRODUCT WALKTHROUGH", "A neighborhood marketplace for a second life."); await pause(2800);

  await click(page.getByRole("link", { name: "Explore the finds", exact: true }), 1400);
  await caption("01 / DISCOVER", "Browse the collection. Find your kind of good.");
  await page.locator(".listing-grid").first().evaluate(element => element.scrollIntoView({ behavior: "smooth", block: "center" })); await pause(1300);
  await page.screenshot({ path: `${output}/browse.png` });
  await click(page.getByRole("tab", { name: "Electronics", exact: true }), 1700);
  assert.equal(await page.locator(".listing-card").count(), 2);
  await click(page.getByRole("tab", { name: "All finds", exact: true }), 700);
  await type(page.getByRole("textbox", { name: "Search listings" }), "chair", 110); await pause(1300);
  assert.equal(await page.locator(".listing-card").count(), 1);
  await click(page.getByRole("button", { name: "Clear search", exact: true }), 700);
  await click(page.getByRole("button", { name: "List view", exact: true }), 1300);
  await click(page.getByRole("button", { name: "Grid view", exact: true }), 800);

  await caption("02 / CREATE A LISTING", "One photo. A few details. A fresh beginning.");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" })); await pause(1000);
  await click(page.getByRole("link", { name: "Sell an item", exact: true }), 1000);
  await page.getByRole("heading", { name: "Pass something good along." }).waitFor();
  await point(page.locator(".upload-trigger"));
  const chooserPromise = page.waitForEvent("filechooser"); await page.mouse.click(pointer.x, pointer.y);
  const chooser = await chooserPromise; await pause(650); await chooser.setFiles(`${output}/assets/1.jpg`); await pause(1300);
  await type(page.getByLabel("Listing title"), "Studio reading chair", 50);
  await select(page.getByLabel("Category", { exact: false }), "Furniture");
  await select(page.getByLabel("Condition", { exact: false }), "Like new");
  await type(page.getByLabel("Description", { exact: false }), "A comfortable gray upholstered chair with a light wood frame. Clean, sturdy, and perfect for a quiet reading corner. Local pickup available.", 22);
  await type(page.getByLabel("Price (USD)"), "75", 120);
  await type(page.getByLabel("City or neighborhood"), "Downtown, Portland", 38);
  await type(page.getByLabel("Your name"), "Alex", 80);
  await type(page.getByLabel("Email address"), "alex@example.com", 45);
  await pause(800);
  await caption("02 / CREATE A LISTING", "Publish the listing, with your email kept private.");
  await click(page.getByRole("button", { name: "Publish listing", exact: true }), 1000);
  await page.getByRole("heading", { name: "Your good find is live." }).waitFor();
  assert.equal(uploads.size, 1); assert.equal(listings.length, 9); await pause(2200);

  await caption("03 / LISTING DETAILS", "A dedicated page for every good find.");
  await click(page.getByRole("link", { name: "View your listing", exact: true }), 1400);
  await page.getByRole("heading", { name: "Studio reading chair", exact: true }).waitFor();
  await loadedPhotos(); await pause(1500);
  assert.equal(await page.locator(".detail-price").innerText(), "$75USD");
  assert(!(await page.locator("body").innerText()).includes("alex@example.com"));
  await page.screenshot({ path: `${output}/listing.png` });
  await page.locator(".description-block").evaluate(element => element.scrollIntoView({ behavior: "smooth", block: "center" })); await pause(1900);

  await caption("04 / MESSAGE THE SELLER", "Start the conversation, right from the listing.");
  await click(page.getByRole("button", { name: "Message seller", exact: true }), 1000);
  await type(page.getByLabel("Your name", { exact: true }), "Jamie", 90);
  await type(page.getByLabel("Your email", { exact: true }), "jamie@example.com", 45);
  await type(page.getByLabel("Your message", { exact: true }), "Hi Alex! Is this chair still available? I can collect it this weekend.", 32);
  await click(page.getByRole("button", { name: "Send message", exact: true }), 1200);
  await page.getByRole("heading", { name: "Your message is saved." }).waitFor();
  assert.equal(messages.length, 1); assert.equal(messages[0].listing_id, listings[0].id);
  await page.getByRole("heading", { name: "Your message is saved." }).evaluate(element => element.scrollIntoView({ behavior: "smooth", block: "center" })); await pause(2500);

  await caption("GOOD FINDS / A NEW CHAPTER", "Your listing is now part of the collection.");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" })); await pause(900);
  await click(page.getByRole("link", { name: "Discover", exact: true }).first(), 1000);
  await click(page.getByRole("link", { name: "Explore the finds", exact: true }), 1000);
  await page.locator(".listing-grid").first().evaluate(element => element.scrollIntoView({ behavior: "smooth", block: "start" })); await pause(900);
  await page.getByRole("link", { name: "Studio reading chair", exact: true }).waitFor();
  await pause(3000);
  assert.deepEqual(errors, [], "No browser errors during the recording");
  writeFileSync(`${output}/walkthrough.json`, JSON.stringify({ mode: "Local demonstration with an isolated in-memory API; not a live Supabase or Vercel recording", resolution: "1440 × 900", audio: "Silent, with on-screen section labels", durationSeconds: (Date.now() - start) / 1000, listingCreated: true, photoUploaded: true, messageSaved: true, timeline }, null, 2));
  await context.close(); context = null;
  await video.saveAs(`${output}/good-finds-walkthrough.webm`);
  console.log("Recording saved:", `${output}/good-finds-walkthrough.webm`);
} catch (error) {
  if (page && !page.isClosed()) await page.screenshot({ path: `${output}/recording-error.png` }).catch(() => {});
  throw error;
} finally {
  await context?.close(); await browser?.close();
  if (server) {
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore", timeout: 5000 });
    else server.kill("SIGTERM");
    server.unref();
  }
  const closed = new Promise(resolve => backend.close(resolve)); backend.closeAllConnections(); backend.unref(); await closed; closeSync(log);
}
