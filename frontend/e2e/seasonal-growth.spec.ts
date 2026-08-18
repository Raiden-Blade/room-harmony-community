import { expect, test } from "@playwright/test";


test.describe.serial("Goal 3 seasonal growth loop", () => {
  test("E2E A: Home → Seasonal → Active Challenge → REAL → Save → Adapt", async ({ page }) => {
    const sessionId = `e2e-seasonal-discovery-${Date.now()}`;
    await page.addInitScript((value) => localStorage.setItem("rhc-demo-session", value), sessionId);
    await page.goto("/");
    await page.getByRole("link", { name: "今のテーマと前年Archiveを見る" }).click();
    await expect(page).toHaveURL(/\/seasonal$/);
    await expect(page.getByRole("heading", { name: "季節のコーデ再利用ループ" })).toBeVisible();
    await page.getByRole("link", { name: "今のテーマを見る" }).click();
    await expect(page.getByRole("heading", { name: "新生活の6畳 2028" })).toBeVisible();
    await expect(page.getByText(/NITORI公式企画・公式選定ではありません/)).toBeVisible();
    await page.locator("#challenge-gallery").getByRole("link", { name: "空間全体を見る" }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "あとで参考にする" }).click();
    await expect(page.getByRole("button", { name: "保存済み" })).toBeDisabled();
    await page.getByRole("button", { name: "このコーデを自分向けにアレンジ" }).click();
    await expect(page.getByRole("heading", { name: "自分向けに変更する" })).toBeVisible();
  });

  test("E2E B: Creator → owned Coordinate → Challenge Entry → gallery", async ({ page, request }) => {
    const sessionId = `e2e-seasonal-entry-${Date.now()}`;
    const creatorResponse = await request.put("http://127.0.0.1:8000/api/creators/me", {
      headers: { "X-Session-ID": sessionId },
      data: { display_name: "E2E Seasonal Creator", bio: "Seasonal参加の検証用Display Identity" },
    });
    expect(creatorResponse.ok()).toBeTruthy();
    const creator = await creatorResponse.json() as { id: string };
    const coordinateResponse = await request.post("http://127.0.0.1:8000/api/community/coordinates", {
      headers: { "X-Session-ID": sessionId },
      data: {
        kind: "PLAN",
        title: "E2E 新生活Challenge参加PLAN",
        description: "6畳・一人暮らし・賃貸・8万円以内のStructured PLANです。",
        room_type: "ONE_ROOM",
        size_band: "SMALL_6",
        housing_type: "RENTAL",
        household: "SINGLE",
        budget_max: 50000,
        style: "NATURAL",
        needs: ["STORAGE", "LOW_BUDGET"],
        products: [
          { product_id: "DEMO-BED-01", role: "MAIN_FURNITURE", quantity: 1 },
          { product_id: "DEMO-DESK-01", role: "SUPPORT_FURNITURE", quantity: 1 },
          { product_id: "DEMO-STORAGE-01", role: "STORAGE", quantity: 1 },
        ],
        existing_furniture: [],
        image_ids: [],
      },
    });
    expect(coordinateResponse.ok()).toBeTruthy();
    const coordinate = await coordinateResponse.json() as { id: string };

    await page.addInitScript((value) => localStorage.setItem("rhc-demo-session", value), sessionId);
    await page.goto(`/creators/${creator.id}`);
    await expect(page.getByRole("heading", { name: "E2E Seasonal Creator" })).toBeVisible();
    await page.getByRole("link", { name: "空間全体を見る" }).click();
    const newLifeOption = page.locator(".challenge-option-list article").filter({ hasText: "新生活の6畳 2028" });
    await newLifeOption.getByRole("button", { name: "このテーマに参加" }).click();
    await expect(page.getByRole("link", { name: /新生活の6畳 2028/ })).toBeVisible();
    await page.getByRole("link", { name: /新生活の6畳 2028/ }).click();
    await expect(page).toHaveURL(/\/challenges\/new-life-6tatami-2028$/);
    await expect(page.locator(`#challenge-gallery a[href="/coordinates/${coordinate.id}"]`).first()).toBeVisible();
    expect(coordinate.id).toContain("community-");
  });

  test("E2E C: archived example → PLAN → derivative → current Challenge → Creator impact", async ({ page }) => {
    const sessionId = `e2e-seasonal-remix-${Date.now()}`;
    await page.addInitScript((value) => localStorage.setItem("rhc-demo-session", value), sessionId);
    await page.goto("/challenges/new-life-6tatami-2027");
    await expect(page.getByText("前年Archive")).toBeVisible();
    await page.locator("#challenge-gallery").getByRole("link", { name: "空間全体を見る" }).first().click();
    await expect(page.getByText("この暮らしが参加するテーマ")).toBeVisible();
    await page.getByRole("button", { name: "このコーデを自分向けにアレンジ" }).click();
    await expect(page.getByRole("heading", { name: "自分向けに変更する" })).toBeVisible();
    await page.getByRole("button", { name: "この内容で比較準備へ" }).click();
    await expect(page.getByText("PRIVATE PLAN")).toBeVisible();
    await page.getByRole("button", { name: "公開コーデとして共有" }).click();
    await page.getByLabel("公開用の表示名").fill("E2E Archive Remixer");
    await page.getByLabel("主な変更理由").selectOption("STORAGE_FOCUS");
    await page.getByLabel("変更の補足（任意）").fill("前年の6畳例を収納重視に更新しました。 ");
    await page.getByRole("button", { name: "PLANとして公開" }).click();
    await expect(page).toHaveURL(/\/coordinates\/community-/);
    const derivativeId = new URL(page.url()).pathname.split("/").at(-1);
    expect(derivativeId).toBeTruthy();
    await expect(page.getByText("参考とアレンジのつながり")).toBeVisible();
    await expect(page.getByText("収納を重視した").first()).toBeVisible();

    const newLifeOption = page.locator(".challenge-option-list article").filter({ hasText: "新生活の6畳 2028" });
    await newLifeOption.getByRole("button", { name: "このテーマに参加" }).click();
    await expect(page.getByRole("link", { name: /新生活の6畳 2028/ })).toBeVisible();
    const creatorLink = page.getByRole("link", { name: /E2E Archive Remixer/ }).first();
    await creatorLink.click();
    await expect(page.getByRole("heading", { name: "E2E Archive Remixer" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "今年の新生活ユーザーの参考へ" })).toBeVisible();
    const seasonalSummary = page.locator(".creator-seasonal-summary");
    await expect(seasonalSummary.locator("article").filter({ hasText: "テーマ参加" }).getByText("1")).toBeVisible();
    await page.getByRole("link", { name: "新生活の6畳 2028 →" }).click();
    await expect(page.locator(`#challenge-gallery a[href="/coordinates/${derivativeId}"]`).first()).toBeVisible();
  });
});
