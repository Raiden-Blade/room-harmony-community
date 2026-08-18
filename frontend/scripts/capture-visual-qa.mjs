import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputDirectory = resolve(scriptDirectory, "..", "..", ".demo", "visual-qa");
const baseUrl = process.env.RHC_FRONTEND_URL || "http://127.0.0.1:5173";
const apiBaseUrl = process.env.RHC_API_URL || "http://127.0.0.1:8000";
const viewports = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 800 },
];
await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch();
try {
  for (const viewport of viewports) {
    const sessionId = `visual-qa-${viewport.name}-${Date.now()}`;
    const planResponse = await fetch(`${apiBaseUrl}/api/plans/from-coordinate/coord-001`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-ID": sessionId },
      body: "{}",
    });
    if (!planResponse.ok) throw new Error(`Could not create visual QA PLAN (${planResponse.status})`);
    const plan = await planResponse.json();
    const creatorResponse = await fetch(`${apiBaseUrl}/api/creators/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Session-ID": sessionId },
      body: JSON.stringify({ display_name: `Visual QA ${viewport.name}`, bio: "Creator impact layout review" }),
    });
    if (!creatorResponse.ok) throw new Error(`Could not create visual QA Creator (${creatorResponse.status})`);
    const creator = await creatorResponse.json();
    const contributionResponse = await fetch(`${apiBaseUrl}/api/community/coordinates`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-ID": sessionId },
      body: JSON.stringify({
        kind: "PLAN",
        title: `Visual QA ${viewport.name}の公開PLAN`,
        description: "Creator、Helpful、Save、Adapt、Impactの視覚階層を確認するsynthetic PLANです。",
        room_type: "ONE_ROOM",
        size_band: "SMALL_6",
        housing_type: "RENTAL",
        household: "SINGLE",
        budget_max: 50000,
        style: "NATURAL",
        needs: ["STORAGE"],
        products: [{ product_id: "DEMO-BED-01", role: "MAIN_FURNITURE", quantity: 1 }],
        existing_furniture: [{ label: "手持ちの机", category: "SUPPORT_FURNITURE", dimensions: "幅90cm" }],
        image_ids: [],
      }),
    });
    if (!contributionResponse.ok) throw new Error(`Could not create visual QA Coordinate (${contributionResponse.status})`);
    const contribution = await contributionResponse.json();
    const pages = [
      { name: "home", path: "/" },
      { name: "explore", path: "/explore?room_size=SMALL_6&need=STORAGE&budget_max=50000" },
      { name: "coordinate", path: `/coordinates/${contribution.id}` },
      { name: "create", path: "/create" },
      { name: "create-products", path: "/create" },
      { name: "create-real-products", path: "/create" },
      { name: "creator", path: `/creators/${creator.id}` },
      { name: "plan-edit", path: `/plans/${plan.id}/edit` },
      { name: "plan-publish-real", path: `/plans/${plan.id}` },
      { name: "handoff", path: `/plans/${plan.id}/handoff` },
    ];
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.addInitScript((value) => localStorage.setItem("rhc-demo-session", value), sessionId);
    for (const target of pages) {
      await page.goto(`${baseUrl}${target.path}`, { waitUntil: "networkidle" });
      if (target.name === "create-products" || target.name === "create-real-products") {
        if (target.name === "create-products") await page.getByRole("radio", { name: /PLAN/ }).check();
        await page.getByRole("button", { name: "暮らしの条件へ" }).click();
        await page.getByLabel("タイトル").fill(`Visual QA ${viewport.name} step 3`);
        await page.getByRole("button", { name: "商品・画像へ" }).click();
        await page.locator(".product-picker input[type=checkbox]").first().check();
      }
      if (target.name === "plan-publish-real") {
        await page.getByRole("button", { name: "公開コーデとして共有" }).click();
        await page.getByRole("radio", { name: /REAL ROOMとして共有/ }).check();
      }
      await page.waitForTimeout(50);
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = "auto";
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(20);
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      if (dimensions.scrollWidth > dimensions.clientWidth + 1) {
        throw new Error(`${viewport.name}/${target.name} overflows by ${dimensions.scrollWidth - dimensions.clientWidth}px`);
      }
      const outputPath = resolve(outputDirectory, `${viewport.name}-${target.name}.png`);
      await page.screenshot({ path: outputPath, fullPage: true });
      console.log(`captured ${outputPath}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
