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
    const pages = [
      { name: "home", path: "/" },
      { name: "explore", path: "/explore?room_size=SMALL_6&need=STORAGE&budget_max=50000" },
      { name: "coordinate", path: "/coordinates/coord-001" },
      { name: "plan-edit", path: `/plans/${plan.id}/edit` },
      { name: "handoff", path: `/plans/${plan.id}/handoff` },
    ];
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.addInitScript((value) => localStorage.setItem("rhc-demo-session", value), sessionId);
    for (const target of pages) {
      await page.goto(`${baseUrl}${target.path}`, { waitUntil: "networkidle" });
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
