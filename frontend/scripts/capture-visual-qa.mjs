import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputDirectory = resolve(scriptDirectory, "..", "..", ".demo", "visual-qa");
const baseUrl = process.env.RHC_FRONTEND_URL || "http://127.0.0.1:5173";
const viewports = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 800 },
];
const pages = [
  { name: "home", path: "/" },
  { name: "coordinate", path: "/coordinates/coord-001" },
];

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch();
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.addInitScript(() => localStorage.setItem("rhc-demo-session", "visual-qa-user"));
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
