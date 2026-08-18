import { expect, test } from "@playwright/test";


test.describe.serial("Goal 2 creator loop", () => {
  const runId = Date.now();
  const creatorSession = `e2e-creator-${runId}`;
  const consumerSession = `e2e-consumer-${runId}`;
  let originalCoordinateId = "";
  let originalCreatorId = "";
  let privatePlanId = "";

  test("E2E A: identity → REAL image → products → publish → profile", async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("rhc-demo-session", value), creatorSession);
    await page.goto("/create");
    await page.getByLabel("公開用の表示名").fill("E2E 暮らしの試作家");
    await page.getByLabel("短い自己紹介（任意）").fill("6畳と手持ち家具の工夫を共有します。");
    await page.getByRole("button", { name: "暮らしの条件へ" }).click();
    await page.getByLabel("タイトル").fill("E2E 手持ち家具を活かすREAL ROOM");
    await page.getByLabel("工夫・背景（任意）").fill("User申告の実在空間を、再利用できる条件と一緒に共有します。");
    await page.getByRole("button", { name: "商品・画像へ" }).click();
    await page.locator(".product-picker input[type=checkbox]").first().check();
    await page.getByLabel("名前").fill("今持っている机");
    await page.getByLabel("サイズ（任意）").fill("幅90cm");
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAE0lEQVR4nGP0SgthgAEmOAsvBwAzwgEMTuT5NAAAAABJRU5ErkJggg==",
      "base64",
    );
    await page.getByLabel("画像を選ぶ").setInputFiles({ name: "room.png", mimeType: "image/png", buffer: png });
    await expect(page.getByAltText("アップロードした部屋のプレビュー")).toBeVisible();
    await page.getByRole("button", { name: "REAL ROOMとして公開" }).click();
    await expect(page).toHaveURL(/\/coordinates\/community-/);
    originalCoordinateId = page.url().split("/").at(-1) || "";
    await expect(page.getByRole("heading", { name: "E2E 手持ち家具を活かすREAL ROOM" })).toBeVisible();
    const creatorLink = page.getByRole("link", { name: /E2E 暮らしの試作家/ }).first();
    originalCreatorId = (await creatorLink.getAttribute("href"))?.split("/").at(-1) || "";
    await creatorLink.click();
    await expect(page.getByRole("heading", { name: "E2E 暮らしの試作家" })).toBeVisible();
    await expect(page.getByText("誰かの暮らしに役立った記録")).toBeVisible();
  });

  test("E2E B: other session → Helpful + Save → Adapt → Existing + Replace", async ({ page }) => {
    expect(originalCoordinateId).toContain("community-");
    await page.addInitScript((value) => localStorage.setItem("rhc-demo-session", value), consumerSession);
    await page.goto(`/coordinates/${originalCoordinateId}`);
    await page.getByRole("button", { name: "参考になった · 0" }).click();
    await expect(page.getByRole("button", { name: "参考になったを取り消す · 1" })).toBeVisible();
    await page.getByRole("button", { name: "あとで参考にする" }).click();
    await expect(page.getByRole("button", { name: "保存済み" })).toBeDisabled();
    await page.getByRole("button", { name: "このコーデを自分向けにアレンジ" }).click();
    await expect(page.getByRole("heading", { name: "自分向けに変更する" })).toBeVisible();
    privatePlanId = page.url().split("/").at(-2) || "";

    await page.getByLabel("手持ち家具の名前").fill("手持ちのチェア");
    await page.getByLabel("手持ち家具のサイズ").fill("幅45cm");
    await page.getByRole("button", { name: "手持ち家具を追加" }).click();
    await expect(page.getByText("手持ちのチェア").last()).toBeVisible();
    const beforeTotal = await page.locator(".plan-total-card > strong").textContent();
    await page.getByRole("button", { name: "別の商品に変更" }).first().click();
    await page.locator(".alternative-list button").first().click();
    await expect.poll(async () => page.locator(".plan-total-card > strong").textContent()).not.toBe(beforeTotal);
  });

  test("E2E C: PLAN owner → public PLAN → lineage → original Creator impact", async ({ page }) => {
    expect(privatePlanId).toContain("plan-");
    await page.addInitScript((value) => localStorage.setItem("rhc-demo-session", value), consumerSession);
    await page.goto(`/plans/${privatePlanId}`);
    await page.getByRole("button", { name: "公開コーデとして共有" }).click();
    await page.getByLabel("公開用の表示名").fill("E2E アレンジャー");
    await page.getByLabel("主な変更理由").selectOption("LOWER_BUDGET");
    await page.getByLabel("変更の補足（任意）").fill("予算に合わせて商品を置き換えました。");
    await page.getByRole("button", { name: "PLANとして公開" }).click();
    await expect(page).toHaveURL(/\/coordinates\/community-/);
    await expect(page.getByText("参考とアレンジのつながり")).toBeVisible();
    await expect(page.getByText("予算を抑えた").first()).toBeVisible();

    await page.goto(`/creators/${originalCreatorId}`);
    await expect(page.getByRole("heading", { name: "E2E 暮らしの試作家" })).toBeVisible();
    const impact = page.locator(".impact-grid");
    await expect(impact.getByText("参考になった")).toBeVisible();
    await expect(impact.getByText("PLAN開始")).toBeVisible();
    await expect(impact.getByText("公開アレンジ")).toBeVisible();
    await expect(impact.locator("article").filter({ hasText: "公開アレンジ" }).getByText("1")).toBeVisible();
  });
});
