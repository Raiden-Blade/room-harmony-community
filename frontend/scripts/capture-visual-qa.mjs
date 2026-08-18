import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const frontendDirectory = resolve(scriptDirectory, "..");
const repositoryDirectory = resolve(frontendDirectory, "..");
const backendDirectory = join(repositoryDirectory, "backend");
const demoDirectory = join(repositoryDirectory, ".demo");
const outputDirectory = join(demoDirectory, "visual-qa");
const apiPort = Number(process.env.RHC_QA_API_PORT || 8100);
const frontendPort = Number(process.env.RHC_QA_FRONTEND_PORT || 5174);
const baseUrl = `http://127.0.0.1:${frontendPort}`;
const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
const databasePath = join(demoDirectory, `visual-qa-${process.pid}.db`);
const uploadDirectory = join(demoDirectory, `visual-qa-uploads-${process.pid}`);
const python = process.env.RHC_PYTHON || (process.platform === "win32"
  ? join(backendDirectory, ".venv", "Scripts", "python.exe")
  : join(backendDirectory, ".venv", "bin", "python"));
const viteEntry = join(frontendDirectory, "node_modules", "vite", "bin", "vite.js");
const viewports = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 800 },
];

if (!existsSync(python) || !existsSync(viteEntry)) {
  throw new Error("Visual QA requires backend/.venv and frontend/node_modules. Run start-demo.cmd once first.");
}

await mkdir(outputDirectory, { recursive: true });

const backend = spawn(python, ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", String(apiPort)], {
  cwd: backendDirectory,
  env: {
    ...process.env,
    RHC_DATABASE_URL: `sqlite:///${databasePath.replaceAll("\\", "/")}`,
    RHC_UPLOAD_DIR: uploadDirectory,
    RHC_CORS_ORIGINS: JSON.stringify([baseUrl]),
  },
  stdio: "inherit",
});
const frontend = spawn(process.execPath, [viteEntry, "--host", "127.0.0.1", "--port", String(frontendPort)], {
  cwd: frontendDirectory,
  env: { ...process.env, VITE_API_BASE_URL: apiBaseUrl },
  stdio: "inherit",
});

async function waitFor(url, label) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The child server is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error(`${label} did not become ready at ${url}`);
}

async function stop(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolvePromise) => child.once("exit", resolvePromise)),
    new Promise((resolvePromise) => setTimeout(resolvePromise, 3_000)),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

let browser;
try {
  await Promise.all([
    waitFor(`${apiBaseUrl}/health`, "Visual QA backend"),
    waitFor(baseUrl, "Visual QA frontend"),
  ]);
  browser = await chromium.launch();
  for (const viewport of viewports) {
    const sessionId = `visual-qa-${viewport.name}-${Date.now()}`;
    const emptySessionId = `visual-qa-empty-${viewport.name}-${Date.now()}`;
    const requestHeaders = { "Content-Type": "application/json", "X-Session-ID": sessionId };
    const planResponse = await fetch(`${apiBaseUrl}/api/plans/from-coordinate/coord-001`, {
      method: "POST", headers: requestHeaders, body: "{}",
    });
    if (!planResponse.ok) throw new Error(`Could not create visual QA PLAN (${planResponse.status})`);
    const plan = await planResponse.json();
    const creatorResponse = await fetch(`${apiBaseUrl}/api/creators/me`, {
      method: "PUT", headers: requestHeaders,
      body: JSON.stringify({ display_name: `Visual QA ${viewport.name}`, bio: "Creator impact layout review" }),
    });
    if (!creatorResponse.ok) throw new Error(`Could not create visual QA Creator (${creatorResponse.status})`);
    const creator = await creatorResponse.json();
    let contribution = null;

    const pages = [
      { name: "home", path: "/" },
      { name: "seasonal", path: "/seasonal" },
      { name: "challenge", path: "/challenges/new-life-6tatami-2028" },
      { name: "archive", path: "/challenges/new-life-6tatami-2027" },
      { name: "explore", path: "/explore?room_size=SMALL_6&need=STORAGE&budget_max=50000" },
      { name: "coordinate", path: "/coordinates/coord-001" },
      { name: "coordinate-error", path: "/coordinates/coord-does-not-exist" },
      { name: "product", path: "/products/DEMO-BED-01" },
      { name: "create", path: "/create" },
      { name: "create-challenge", path: "/create?challenge=new-life-6tatami-2028" },
      { name: "create-products", path: "/create" },
      { name: "create-real-products", path: "/create" },
      { name: "creator", path: `/creators/${creator.id}` },
      { name: "saved-empty", path: "/saved", session: emptySessionId },
      { name: "saved", path: "/saved" },
      { name: "plan-edit", path: `/plans/${plan.id}/edit` },
      { name: "plan-publish-real", path: `/plans/${plan.id}` },
      { name: "handoff", path: `/plans/${plan.id}/handoff` },
      { name: "about", path: "/about" },
    ];
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto(baseUrl);
    for (const target of pages) {
      if (target.name === "creator" && !contribution) {
        const contributionResponse = await fetch(`${apiBaseUrl}/api/community/coordinates`, {
          method: "POST", headers: requestHeaders,
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
            products: [
              { product_id: "DEMO-BED-01", role: "MAIN_FURNITURE", quantity: 1 },
              { product_id: "DEMO-DESK-01", role: "SUPPORT_FURNITURE", quantity: 1 },
              { product_id: "DEMO-STORAGE-01", role: "STORAGE", quantity: 1 },
            ],
            existing_furniture: [{ label: "手持ちの机", category: "SUPPORT_FURNITURE", dimensions: "幅90cm" }],
            image_ids: [],
          }),
        });
        if (!contributionResponse.ok) throw new Error(`Could not create visual QA Coordinate (${contributionResponse.status})`);
        contribution = await contributionResponse.json();
        const entryResponse = await fetch(`${apiBaseUrl}/api/challenges/new-life-6tatami-2028/entries`, {
          method: "POST", headers: requestHeaders, body: JSON.stringify({ coordinate_id: contribution.id }),
        });
        if (!entryResponse.ok) throw new Error(`Could not create visual QA Challenge Entry (${entryResponse.status})`);
      }
      await page.evaluate((value) => localStorage.setItem("rhc-demo-session", value), target.session || sessionId);
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
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = "auto";
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        window.scrollTo(0, 0);
      });
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      if (dimensions.scrollWidth > dimensions.clientWidth + 1) {
        throw new Error(`${viewport.name}/${target.name} overflows by ${dimensions.scrollWidth - dimensions.clientWidth}px`);
      }
      const outputPath = join(outputDirectory, `${viewport.name}-${target.name}.png`);
      await page.screenshot({ path: outputPath, fullPage: true });
      console.log(`captured ${outputPath}`);
    }
    await context.close();
    if (contribution) {
      const unpublishResponse = await fetch(`${apiBaseUrl}/api/community/coordinates/${contribution.id}`, {
        method: "DELETE", headers: requestHeaders,
      });
      if (!unpublishResponse.ok) throw new Error(`Could not clean visual QA Coordinate (${unpublishResponse.status})`);
    }
  }
} finally {
  if (browser) await browser.close();
  await Promise.all([stop(frontend), stop(backend)]);
  for (const path of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`, uploadDirectory]) {
    await rm(path, { force: true, recursive: path === uploadDirectory });
  }
}
