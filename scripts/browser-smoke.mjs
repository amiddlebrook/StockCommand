import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL || "https://stockcommand.averymiddlebrook2014.workers.dev";
const browser = await chromium.launch({ headless: true });
const failures = [];
const pageErrors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await context.newPage();
page.on("pageerror", error => pageErrors.push(error.message));
page.on("response", response => {
  if (new URL(response.url()).pathname.startsWith("/api/") && response.status() >= 400) {
    failures.push("API HTTP " + response.status() + ": " + response.url());
  }
});
await mkdir("test-artifacts", { recursive: true });
try {
  console.log("Testing dashboard:", baseURL);
  const response = await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 45000 });
  assert.equal(response?.status(), 200, "homepage must return HTTP 200");
  await page.locator(".app-shell").waitFor({ timeout: 25000 });
  await page.getByRole("heading", { name: /Market overview/ }).waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll(".watch-panel .price-cell")].some(el => /^\$[\d,]+/.test(el.textContent?.trim() || "")), null, { timeout: 45000 });
  assert.ok(await page.locator(".watch-panel tbody tr").count() >= 2, "watchlist rows missing");
  console.log("PASS: homepage hydrated with real market prices");

  await page.getByRole("textbox", { name: "Add ticker" }).fill("AMD");
  await page.getByRole("textbox", { name: "Add ticker" }).press("Enter");
  await page.locator(".side-symbol", { hasText: "AMD" }).waitFor({ timeout: 10000 });
  console.log("PASS: add-to-watchlist interaction");

  await page.getByRole("button", { name: "Paper Portfolio" }).click();
  await page.getByRole("heading", { name: /Paper portfolio/ }).waitFor();
  await page.getByRole("spinbutton", { name: "Number of shares" }).fill("2");
  await page.getByRole("spinbutton", { name: "Average purchase price (USD)" }).fill("125.50");
  await page.getByRole("button", { name: /Save paper trade/ }).click();
  await page.getByRole("status").getByText("Paper position saved locally.").waitFor();
  console.log("PASS: portfolio interaction");

  await page.getByRole("button", { name: "AI Research" }).click();
  await page.getByRole("heading", { name: /Research terminal/ }).waitFor();
  await page.getByRole("button", { name: "Run analysis" }).click();
  await page.locator(".brief-output").waitFor({ timeout: 60000 });
  assert.ok((await page.locator(".brief-output").innerText()).length > 80, "brief missing narrative and indicators");
  console.log("PASS: real market brief generation");

  await page.screenshot({ path: "test-artifacts/desktop.png", fullPage: true });

  const corruptContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await corruptContext.addInitScript(() => {
    localStorage.setItem("stockcommand.watch.v3", "null");
    localStorage.setItem("stockcommand.paper.v3", '{"unexpected":true}');
  });
  const corruptPage = await corruptContext.newPage();
  corruptPage.on("pageerror", error => pageErrors.push("persisted-state: " + error.message));
  await corruptPage.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 45000 });
  await corruptPage.getByRole("heading", { name: /Market overview/ }).waitFor({ timeout: 25000 });
  await corruptPage.screenshot({ path: "test-artifacts/mobile.png", fullPage: true });
  await corruptContext.close();
  console.log("PASS: dashboard recovers from malformed browser storage");
  assert.deepEqual(pageErrors, [], "uncaught browser errors");
  assert.deepEqual(failures, [], "API errors from browser");
  console.log("PASS: complete browser end-to-end verification");
} catch (error) {
  console.error("Browser verification failed:", error);
  console.error("Browser errors:", pageErrors);
  console.error("API failures:", failures);
  try { await page.screenshot({ path: "test-artifacts/failure.png", fullPage: true }); } catch {}
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
