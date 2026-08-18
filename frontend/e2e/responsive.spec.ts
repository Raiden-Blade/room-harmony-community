import { expect, test, type Page, type TestInfo } from "@playwright/test";

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
  test(`responsive ${viewport.name}: key screens fit and remain operable`, async ({ page }, testInfo: TestInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.addInitScript(() => localStorage.setItem("rhc-demo-session", "responsive-user"));

    await page.goto("/");
    await expect(page.getByRole("heading", { name: /自分の部屋で試せるPLANへ/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await testInfo.attach(`${viewport.name}-home`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });

    const mainAction = page.getByRole("link", { name: "6畳のおすすめを見る" });
    const actionBox = await mainAction.boundingBox();
    expect(actionBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    await page.goto("/coordinates/coord-001");
    await expect(page.getByRole("heading", { name: /ナチュラルで整える/ })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await testInfo.attach(`${viewport.name}-coordinate`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: "image/png",
    });

    await page.keyboard.press("Tab");
    await expect(page.locator(":focus-visible")).toBeVisible();
  });
}
