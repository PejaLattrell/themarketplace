import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFileSync, mkdirSync, openSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright";

// Contract tests use a local Supabase API substitute. No test branch exists in app code.
// This deliberately does not claim to verify a deployed Supabase Storage service.
const listings = JSON.parse(readFileSync(new URL("../tests/fixtures/listings.json", import.meta.url)));
const messages = [];
const uploads = new Map();
let failNextListing = false;
let failNextMessage = false;
const storagePrefix = "/storage/v1/object/marketplace-images/";
const mock = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,HEAD,OPTIONS");
  if (req.method === "OPTIONS") { res.writeHead(204).end(); return; }
  const url = new URL(req.url, "http://127.0.0.1:54329");
  const respond = (data, status = 200) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };
  const readBody = async () => { const chunks = []; for await (const chunk of req) chunks.push(chunk); return Buffer.concat(chunks); };
  try {
    if (url.pathname.startsWith(storagePrefix)) {
      const path = url.pathname.slice(storagePrefix.length);
      if (req.method === "POST") {
        const form = await new Request(url, { method: "POST", headers: req.headers, body: await readBody(), duplex: "half" }).formData();
        const file = [...form.values()].find(value => typeof value !== "string");
        assert(file, "SDK should upload a file");
        uploads.set(path, { buffer: Buffer.from(await file.arrayBuffer()), type: file.type });
        respond({ Key: `marketplace-images/${path}`, Id: randomUUID() }); return;
      }
      const photo = uploads.get(path);
      if (!photo) { respond({ message: "Not found" }, 404); return; }
      res.writeHead(200, { "Content-Type": photo.type }); res.end(photo.buffer); return;
    }
    if (url.pathname.startsWith("/storage/v1/object/public/marketplace-images/")) {
      const photo = uploads.get(url.pathname.split("/").at(-1));
      if (!photo) { respond({ message: "Not found" }, 404); return; }
      res.writeHead(200, { "Content-Type": photo.type }); res.end(photo.buffer); return;
    }
    if (url.pathname === "/rest/v1/marketplace_listings") {
      if (req.method === "POST") {
        if (failNextListing) { failNextListing = false; respond({ code: "TEST", message: "Simulated failure" }, 503); return; }
        const body = JSON.parse((await readBody()).toString());
        const listing = { ...body, id: randomUUID(), is_demo: false, created_at: new Date().toISOString() };
        listings.unshift(listing); respond({ id: listing.id }, 201); return;
      }
      let rows = listings;
      if (url.searchParams.has("id")) rows = rows.filter(value => value.id === url.searchParams.get("id").replace(/^eq\./, ""));
      const fields = url.searchParams.get("select")?.split(",") || [];
      assert(!fields.includes("seller_email"), "App must never request seller email");
      rows = rows.map(row => Object.fromEntries(fields.map(field => [field, row[field]])));
      respond(req.headers.accept?.includes("vnd.pgrst.object") ? rows[0] || null : rows); return;
    }
    if (url.pathname === "/rest/v1/marketplace_messages" && req.method === "POST") {
      if (failNextMessage) { failNextMessage = false; respond({ code: "TEST", message: "Simulated failure" }, 503); return; }
      messages.push(JSON.parse((await readBody()).toString())); res.writeHead(201).end(); return;
    }
    respond({ error: "Unknown test endpoint", path: url.pathname }, 404);
  } catch (error) { console.error(error); respond({ error: error.message }, 500); }
});

mkdirSync("artifacts", { recursive: true });
await new Promise(resolve => mock.listen(54329, "127.0.0.1", resolve));
const log = openSync("artifacts/e2e-server.log", "w");
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--port", "3100", "--hostname", "127.0.0.1"], {
  windowsHide: true, stdio: ["ignore", log, log],
  env: { ...process.env, NEXT_BUILD_DIR: ".next-e2e", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key", NEXT_TELEMETRY_DISABLED: "1" },
});
let browser;
try {
  let ready = false;
  for (let i = 0; i < 100; i++) { try { const r = await fetch("http://127.0.0.1:3100/sell"); if (r.ok) { ready = true; break; } } catch {} await delay(200); }
  assert(ready, "Next.js test server should start");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("https://images.unsplash.com/**", route => route.abort());
  await page.route("https://fonts.googleapis.com/**", route => route.abort());
  const base = "http://127.0.0.1:3100";
  await page.goto(base);
  await page.getByRole("heading", { name: "Find your next favorite" }).waitFor();
  assert.equal(await page.locator(".listing-card").count(), 8);
  await page.screenshot({ path: "artifacts/home-desktop.png", fullPage: true });
  await page.getByRole("tab", { name: "Electronics", exact: true }).click();
  assert.equal(await page.locator(".listing-card").count(), 2);
  await page.getByRole("tab", { name: "All finds", exact: true }).click();
  await page.getByRole("textbox", { name: "Search listings" }).fill("chair");
  assert.equal(await page.locator(".listing-card").count(), 1);
  await page.getByRole("textbox", { name: "Search listings" }).fill("nothing-will-match-this");
  await page.getByRole("heading", { name: "No finds just yet." }).waitFor();
  await page.getByRole("button", { name: "Clear filters", exact: true }).click();
  await page.getByRole("combobox", { name: "Sort listings" }).selectOption("price-low");
  assert.equal(await page.locator(".card-price").first().innerText(), "$18");
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page.getByLabel("Maximum price ($)").fill("40");
  assert.equal(await page.locator(".listing-card").count(), 3);
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByRole("button", { name: "Filters", exact: true }).click();
  await page.getByRole("button", { name: "List view", exact: true }).click();
  assert(await page.locator(".list-view").count());
  await page.getByRole("button", { name: "Grid view", exact: true }).click();
  await page.getByRole("button", { name: "Save item", exact: true }).first().click();
  await page.getByRole("link", { name: "Saved items (1)" }).click();
  await page.getByRole("heading", { name: "Your saved finds" }).waitFor();
  assert.equal(await page.locator(".listing-card").count(), 1);
  await page.reload();
  await page.getByRole("button", { name: "Remove from saved items", exact: true }).waitFor();
  assert.equal(await page.locator(".listing-card").count(), 1);
  console.log("PASS browse, categories, search, empty state, sorting, filters, view switching, and persistent saved items");

  await page.goto(`${base}/sell`);
  await page.getByLabel("Listing photo").setInputFiles({ name: "not-a-photo.txt", mimeType: "text/plain", buffer: Buffer.from("not a picture") });
  await page.getByRole("alert").filter({ hasText: "Choose a JPG, PNG, or WebP photo." }).waitFor();
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aLucAAAAASUVORK5CYII=", "base64");
  await page.getByLabel("Listing photo").setInputFiles({ name: "chair.png", mimeType: "image/png", buffer: png });
  await page.getByLabel("Listing title").fill("E2E: A free reading chair");
  await page.getByLabel("Category", { exact: false }).selectOption("Furniture");
  await page.getByLabel("Description", { exact: false }).fill("A sturdy chair, clean and comfortable, ready for its next reading corner.");
  await page.getByLabel("Price (USD)").fill("0");
  await page.getByLabel("Email address").fill("seller@example.com");
  failNextListing = true;
  await page.getByRole("button", { name: "Publish listing" }).click();
  await page.getByRole("alert").filter({ hasText: "couldn't publish" }).waitFor();
  assert.equal(await page.getByLabel("Listing title").inputValue(), "E2E: A free reading chair");
  assert.equal(uploads.size, 1, "A failed insert should keep the uploaded photo for retry");
  await page.getByRole("button", { name: "Publish listing" }).click();
  await page.getByRole("heading", { name: "Your good find is live." }).waitFor();
  assert.equal(uploads.size, 1, "Retry should not create a duplicate photo");
  assert.equal(listings[0].seller_email, "seller@example.com");
  assert.equal(listings[0].price, 0);
  assert.equal(listings[0].seller_name, "Community seller");
  assert.equal(listings[0].location, "Local pickup");
  assert.equal(listings[0].condition, "Good");
  await page.getByRole("link", { name: "View your listing" }).click();
  await page.getByRole("heading", { name: "E2E: A free reading chair" }).waitFor();
  assert((await page.locator(".detail-price").innerText()).includes("Free"));
  assert(!(await page.locator("body").innerText()).includes("seller@example.com"), "Seller email must stay private");
  await page.getByRole("link", { name: "Discover", exact: true }).first().click();
  await page.getByRole("link", { name: "E2E: A free reading chair", exact: true }).waitFor();
  await page.getByRole("link", { name: "E2E: A free reading chair", exact: true }).click();
  await page.screenshot({ path: "artifacts/detail-desktop.png", fullPage: true });
  console.log("PASS photo validation, upload, listing creation, insert-failure recovery, free price, and private contact data on the detail page");

  await page.getByRole("button", { name: "Message seller", exact: true }).click();
  await page.getByLabel("Your name", { exact: true }).fill("Test buyer");
  await page.getByLabel("Your email", { exact: true }).fill("buyer@example.com");
  await page.getByLabel("Your message").fill("Hello! Can I pick this chair up tomorrow afternoon?");
  failNextMessage = true;
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "couldn't save" }).waitFor();
  assert.equal(await page.getByLabel("Your email", { exact: true }).inputValue(), "buyer@example.com");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await page.getByRole("heading", { name: "Your message is saved." }).waitFor();
  assert.equal(messages.length, 1);
  assert.equal(messages[0].listing_id, listings[0].id);
  assert.equal(messages[0].buyer_email, "buyer@example.com");
  assert.equal(messages[0].body, "Hello! Can I pick this chair up tomorrow afternoon?");
  console.log("PASS message validation, failure recovery, and message persistence contract");

  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, name] of [["/", "home"], ["/sell", "sell"], [`/listings/${listings[0].id}`, "detail"]]) {
    await page.goto(`${base}${path}`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `No horizontal overflow on ${path}`);
    await page.screenshot({ path: `artifacts/${name}-mobile.png`, fullPage: true });
  }
  await page.goto(`${base}/listings/invalid-id`);
  await page.getByRole("heading", { name: "That find isn’t here." }).waitFor();
  const invalidMessage = await page.request.post(`${base}/api/messages`, { data: { listing_id: "bad" } });
  assert.equal(invalidMessage.status(), 400);
  const missingListing = await page.request.post(`${base}/api/messages`, { data: { listing_id: randomUUID(), buyer_name: "Test", buyer_email: "test@example.com", body: "A message for a missing listing." } });
  assert.equal(missingListing.status(), 404);
  assert.deepEqual(errors, [], "No uncaught browser errors");
  console.log("PASS mobile layout, missing listings, invalid requests, and browser error checks");
  console.log("Local API contract tests passed. Live Supabase and deployment verification are separate checks.");
} finally {
  await browser?.close();
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore", timeout: 5000 });
  else server.kill("SIGTERM");
  server.unref();
  const closed = new Promise(resolve => mock.close(resolve));
  mock.closeAllConnections();
  mock.unref();
  await closed;
  console.log("Test servers and browser closed.");
}
