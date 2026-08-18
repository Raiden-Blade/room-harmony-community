import { expect, test } from "@playwright/test";

test("E2E 1: Home → Similar-to-me → products → Save", async ({ page }) => {
  const sessionId = `e2e-user-one-${Date.now()}`;
  await page.addInitScript((value) => localStorage.setItem("rhc-demo-session", value), sessionId);
  await page.goto("/");
  await expect(page.getByText("新生活 × 一人暮らし × 6畳")).toBeVisible();
  await page.getByRole("link", { name: "6畳のおすすめを見る" }).click();
  await expect(page.getByRole("heading", { name: "あなたの条件に近いコーデ" })).toBeVisible();
  await expect(page.getByText("収納不足に対応").first()).toBeVisible();

  await page.getByRole("link", { name: "空間全体を見る" }).first().click();
  await expect(page).toHaveURL(/\/coordinates\/coord-001$/);
  await expect(page.getByRole("heading", { level: 1, name: /ナチュラルで整える/ })).toBeVisible();
  const productLinks = page.getByRole("link", { name: "商品と使用コーデを見る" });
  await expect(productLinks).toHaveCount(5);

  await productLinks.nth(0).click();
  await expect(page.getByRole("heading", { name: "この商品を使ったコーデを見る" })).toBeVisible();
  await page.goBack();
  await page.getByRole("link", { name: "商品と使用コーデを見る" }).nth(1).click();
  await expect(page.getByRole("heading", { name: "この商品を使ったコーデを見る" })).toBeVisible();
  await page.goBack();
  await page.getByRole("button", { name: "あとで参考にする" }).click();
  await expect(page.getByRole("button", { name: "保存済み" })).toBeDisabled();
});

test("E2E 2: Saved → PLAN → Existing → Replace → Total → Handoff", async ({ page, request }) => {
  const sessionId = `e2e-user-two-${Date.now()}`;
  await request.post("http://127.0.0.1:8000/api/saved/coord-001", { headers: { "X-Session-ID": sessionId } });
  await page.addInitScript((value) => localStorage.setItem("rhc-demo-session", value), sessionId);
  await page.goto("/saved");
  await expect(page.getByRole("heading", { name: "保存したコーデ" })).toBeVisible();
  await page.getByRole("button", { name: "自分向けに変更する" }).click();
  await expect(page.getByRole("heading", { name: "自分向けに変更する" })).toBeVisible();

  await page.getByLabel("手持ち家具の名前").fill("手持ちのチェア");
  await page.getByLabel("手持ち家具のサイズ").fill("幅45cm");
  await page.getByRole("button", { name: "手持ち家具を追加" }).click();
  await expect(page.getByText("手持ちのチェア").last()).toBeVisible();

  const beforeTotal = await page.locator(".plan-total-card > strong").textContent();
  await page.getByRole("button", { name: "別の商品に変更" }).first().click();
  await page.locator(".alternative-list button").first().click();
  await expect.poll(async () => page.locator(".plan-total-card > strong").textContent()).not.toBe(beforeTotal);

  await page.getByRole("button", { name: "この内容で比較準備へ" }).click();
  await expect(page.getByText("PRIVATE PLAN")).toBeVisible();
  await page.getByRole("link", { name: /店舗で\d+商品を比較する/ }).click();
  await expect(page.getByText("PREVIEW ONLY")).toBeVisible();
  await expect(page.getByLabel("Room Harmony handoff payload")).toContainText('"live_integration": false');
});
