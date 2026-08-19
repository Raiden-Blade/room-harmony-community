import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { API_BASE_URL } from "./support";

const viewports = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 800 },
];

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
}

for (const viewport of viewports) {
  test(`responsive ${viewport.name}: key screens fit and remain operable`, async ({ page, request }, testInfo: TestInfo) => {
    const sessionId = `responsive-${viewport.name}-${Date.now()}`;
    const planResponse = await request.post(`${API_BASE_URL}/api/plans/from-coordinate/coord-001`, {
      headers: { "X-Session-ID": sessionId },
      data: {},
    });
    expect(planResponse.ok()).toBeTruthy();
    const plan = await planResponse.json() as { id: string };
    const creatorResponse = await request.put(`${API_BASE_URL}/api/creators/me`, {
      headers: { "X-Session-ID": sessionId },
      data: { display_name: `Responsive ${viewport.name}`, bio: "Responsive visual QA profile" },
    });
    expect(creatorResponse.ok()).toBeTruthy();
    const creator = await creatorResponse.json() as { id: string };
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.addInitScript((value) => localStorage.setItem("rhc-demo-session", value), sessionId);

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /自分の部屋で試せるPLANへ/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await testInfo.attach(`${viewport.name}-home`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });

    const mainAction = page.getByRole("link", { name: "条件から参考コーデを探す" });
    const actionBox = await mainAction.boundingBox();
    expect(actionBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    await page.goto("/seasonal");
    await expect(page.getByRole("heading", { name: /前年の暮らしを/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const seasonalAction = page.getByRole("link", { name: "今のテーマを見る" });
    expect((await seasonalAction.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await testInfo.attach(`${viewport.name}-seasonal`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });

    await page.goto("/challenges/new-life-6tatami-2028");
    await expect(page.getByRole("heading", { name: "新生活の6畳 2028" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const challengeAction = page.getByRole("link", { name: "このテーマでコーデをつくる" });
    expect((await challengeAction.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus-visible")).toBeVisible();
    await testInfo.attach(`${viewport.name}-challenge`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });

    await page.goto("/challenges/new-life-6tatami-2027");
    await expect(page.getByText("前年Archive")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await testInfo.attach(`${viewport.name}-archive`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });

    await page.goto("/coordinates/coord-001");
    await expect(page.getByRole("heading", { name: /ナチュラルで整える/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await testInfo.attach(`${viewport.name}-coordinate`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });

    await page.keyboard.press("Tab");
    await expect(page.locator(":focus-visible")).toBeVisible();

    await page.goto("/create");
    await expect(page.getByRole("heading", { name: "暮らしを、誰かの参考にする" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const createAction = page.getByRole("button", { name: "暮らしの条件へ" });
    expect((await createAction.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
    await testInfo.attach(`${viewport.name}-create`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });

    await page.goto(`/creators/${creator.id}`);
    await expect(page.getByRole("heading", { name: `Responsive ${viewport.name}` })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await testInfo.attach(`${viewport.name}-creator`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });

    await page.goto(`/plans/${plan.id}/edit`);
    await expect(page.getByRole("heading", { name: "自分向けに変更する" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    const replaceBox = await page.getByRole("button", { name: "別の商品に変更" }).first().boundingBox();
    expect(replaceBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    await testInfo.attach(`${viewport.name}-plan-edit`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });

    await page.goto(`/plans/${plan.id}/handoff`);
    await expect(page.getByText("接続前プレビュー")).toBeVisible();
    await page.getByText("開発者向け：連携データを確認").click();
    await expect(page.getByLabel("Room Harmony handoff payload")).toContainText('"live_integration": false');
    await expectNoHorizontalOverflow(page);
    await testInfo.attach(`${viewport.name}-handoff`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });
  });
}
